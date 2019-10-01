const d3 = require("d3");
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
var svg2img = require('svg2img');
let fs = require('fs');

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
            return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
    }
});

process.on("message", function (file) {
    console.log('[child] received file: ', file);
    processFile(file, () => {
        process.send({
            file: file
        });
        process.disconnect();
    });
});

function processFile(fileName, onComplete) {
    fs.readFile('../honeypot/' + fileName, function (err, textData) {
        if (err) throw err;
        let rawData = textData.toString();
        let day = getDay(fileName);
        let duration = 1000 * 60 * 60;
        let cols = ["duration", "service", "source_bytes", "destination_bytes", "count", "same_srv_rate", "serror_rate", "srv_serror_rate", "dst_host_count",
            "dst_host_srv_count", "dst_host_same_src_port_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "flag", "ids_detection", "malware_detection",
            "ashula_detection", "label", "source_ip_address", "source_port_number", "destination_ip_address", "destination_port_number", "start_time", "protocol"];
        rawData = d3.tsvParseRows(rawData);
        rawData = rawData.map(d => {
            let item = {};
            cols.forEach((col, i) => {
                item[col] = d[i];
                if (col === "start_time") item[col] = new Date(day + item[col]);
            });
            return item;
        });
        const COL_TIME = 'start_time',
            COL_LINK_TYPE = 'label',
            COL_SOURCE_ADDRESS = "source_ip_address",
            COL_DESTINATION_ADDRESS = "destination_ip_address";
        let linkTypes = ['1', '-1', '-2']
        let typeColorObj = {
            '1': 'green',
            '-1': 'steelblue',
            '-2': 'red'
        }

        let linkTypeColor = getLinkTypeColor(typeColorObj);

        function getLinkTypeColor(linkTypeColorObj) {
            return function (type) {
                return linkTypeColorObj[type];
            }
        }

        let nodeTypeColor = function nodeTypeColor(value) {
            return 'black';
        }

        let nwMinStrokeWidth = 1,
            nwMaxStrokeWidth = 3,
            nwMinRadius = 4,
            nwMaxRadius = 10,
            width= 450,
            height= 450,
            networkSettings = {
                width: width,
                height: height,
                nodeTypeColor: nodeTypeColor,
                margin: {
                    top: 10
                },
                linkTypes: linkTypes,
                linkTypeColor: linkTypeColor,
                node: {
                    minRadius: nwMinRadius,
                    maxRadius: nwMaxRadius
                },
                link: {
                    minStrokeWidth: nwMinStrokeWidth,
                    maxStrokeWidth: nwMaxStrokeWidth
                }
            }

        for (let i = 0; i < 23; i++) {
            readData(rawData, i);
        }

        onComplete();


        function readData(rawData, hour) {
            let minTime = getTime(fileName, hour);
            let maxTime = minTime.getTime() + duration;
            let data = rawData.filter(d => d[COL_TIME] <= maxTime && d[COL_TIME] >= minTime);
            if (data.length > 0) {
                let {nodes, links} = getLinksGroupedByFanInOut(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, [COL_LINK_TYPE], COL_TIME);

                generateLayout(nodes, links, networkSettings.width, networkSettings.height, () => {
                    let svg = drawNetworkGraph(nodes, links, networkSettings);
                    //Save it
                    svg2img(svg.outerHTML, function(error, buffer) {
                        //returns a Buffer
                        fs.writeFileSync('input/'+fileName.split('.')[0]+hour+'.png', buffer);
                    });

                });
            }
        }
    });
}

function generateLayout(nodes, links, width, height, onComplete) {
    let simulation = d3.forceSimulation()
        .on("tick", tick)
        .on("end", end);
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-5))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(d => d.radius))
        .alphaMin(0.4);

    function tick() {
        nodes.forEach(n => {
            bound(n);
        });
    }

    function end() {
        onComplete(nodes, links);
    }

    function bound(node) {
        if (node.x !== undefined && node.y !== undefined) {
            let vecX = node.x - width / 2, vecY = node.y - height / 2;
            let distance = Math.sqrt(vecX * vecX + vecY * vecY);
            if (distance > width / 2 + 5) {
                let ratio = (width / 2) / distance;
                node.x = ratio * node.x;
                node.y = ratio * node.y;
                if (node.x < width / 2 && node.y < height / 2) {
                    node.x += 10;
                    node.y += 10;
                }

            }
        }
    }
}

function getAllNodesFromLinksWithCombination(links, combinedNodes) {
    let nestedLinkByNodes = {};
    links.forEach(link => {
        if (!nestedLinkByNodes[link.source]) {
            nestedLinkByNodes[link.source] = [link];
        } else {
            nestedLinkByNodes[link.source].push(link);
        }
        if (!nestedLinkByNodes[link.target]) {
            nestedLinkByNodes[link.target] = [link];
        } else {
            nestedLinkByNodes[link.target].push(link);
        }
    });

    let nodes = Object.keys(nestedLinkByNodes).map(d => {
        let rows = nestedLinkByNodes[d].map(links => links.data).flat();
        return {
            id: d,
            nodes: combinedNodes[d],
            nodeCount: combinedNodes[d].length,
            data: rows,
            dataCount: rows.length
        }
    });
    return nodes;
}

function getLinksGroupedByFanInOut(data, clmSource, clmTarget, typeColumns, clmTime) {
    let allNodes = {};
    data.forEach(row => {
        let source = row[clmSource];
        let target = row[clmTarget];
        if (!allNodes[source]) allNodes[source] = {sources: new Set(), targets: new Set()};
        if (!allNodes[target]) allNodes[target] = {sources: new Set(), targets: new Set()};
        if (source !== target) {
            allNodes[source].targets.add(target);
            allNodes[target].sources.add(source);
        } else {
            allNodes[source].hasSelfLoop = true;
        }
    });
    let combinedNodes = {};
    d3.entries(allNodes).forEach(row => {
        let node = row.key;
        let value = row.value;
        let combinedKey = "sources" + Array.from(value.sources).sort() + "targets" + Array.from(value.targets) + "hasSelfLoop" + value.hasSelfLoop;
        if (!combinedNodes[combinedKey]) combinedNodes[combinedKey] = [];
        combinedNodes[combinedKey].push(node);
    });
    //From node value to its combined name (combined + index)
    let nodeToCombinedNode = {};
    let combinedNodeToNodes = {}
    d3.entries(combinedNodes).forEach((row, i) => {
        let newKey = 'combined' + i;
        row.value.forEach(node => {
            nodeToCombinedNode[node] = 'combined' + i;
        });
        combinedNodeToNodes[newKey] = row.value;
    });
    //Loop through each row and generate links.
    let linksObj = {};
    let timedLinksObj = {};
    data.forEach(row => {
        let type = typeColumns.map(clm => row[clm]).join(',');
        let combinedSource = nodeToCombinedNode[row[clmSource]];
        let combinedTarget = nodeToCombinedNode[row[clmTarget]];
        let linkedKey = combinedSource + "," + combinedTarget + "," + type;
        let time = row[clmTime];
        let timedLinkedKey = linkedKey + "," + time;
        //For the links without time
        if (!linksObj[linkedKey]) {
            linksObj[linkedKey] = {
                source: combinedSource,
                target: combinedTarget,
                type: type,
                data: [],
                id: linkedKey
            };
        }
        linksObj[linkedKey].data.push(row);
        //For the timed links
        if (!timedLinksObj[timedLinkedKey]) {
            timedLinksObj[timedLinkedKey] = {
                source: combinedSource,
                target: combinedTarget,
                type: type,
                time: time,
                data: [],
                id: timedLinkedKey
            };
        }
        timedLinksObj[timedLinkedKey].data.push(row);
    });

    let links = d3.entries(linksObj).map(r => {
        r.value.dataCount = r.value.data.length;
        return r.value;
    });

    let nodes = getAllNodesFromLinksWithCombination(links, combinedNodeToNodes);

    return {nodes, links};

}

function getTime(fileName, hour) {
    let year = fileName.slice(0, 4);
    let month = fileName.slice(4, 6);
    let day = fileName.slice(6, 8);
    let str = `${year}-${month}-${day} ${hour}:00:00`;
    return new Date(str);
}

function getDay(fileName) {
    let year = fileName.slice(0, 4);
    let month = fileName.slice(4, 6);
    let day = fileName.slice(6, 8);
    let str = `${year}-${month}-${day} `;
    return str;
}

function createSvg(width, height) {
    const {document} = (new JSDOM(`...`)).window;
    const body = document.body;

    let svg = body.appendChild(document.createElement("svg"));
    d3.select(svg).attr("width", width).attr("height", height).append("g");
    return svg;
}

function drawNetworkGraph(nodes, links, networkSettings) {
    let svg = createSvg(networkSettings.width, networkSettings.height);
    let theGroup = d3.select(svg.children[0]);

    let width = networkSettings.width, height = networkSettings.height,
        nodeTypeColor = networkSettings.nodeTypeColor,
        margin = networkSettings.margin,
        linkTypes = networkSettings.linkTypes,
        linkTypeColor = networkSettings.linkTypeColor,
        nwMinStrokeWidth = networkSettings.link.minStrokeWidth,
        nwMaxStrokeWidth = networkSettings.link.maxStrokeWidth;

    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, nwMinStrokeWidth, nwMaxStrokeWidth);

    let nodeRadiusScale;
    //Add a clippath
    theGroup.append("defs").append("clipPath").attr("id", "theNetworkGraphCP").append("rect").attr("x", 0).attr("y", margin.top).attr("width", width).attr("height", height);
    theGroup.attr("clip-path", "url(#theNetworkGraphCP)");

    let contentGroup = theGroup.append("g");
    addArrowMarkers(contentGroup, linkTypes, linkTypeColor);
    let linkGroup = contentGroup.append("g");
    let nodeGroup = contentGroup.append("g");

    let linkElements = linkGroup.selectAll('.linkElements');
    let nodeElements = nodeGroup.selectAll('.nodeElements');

    setNodeRadius();
    updateNodesAndLinks(nodes, links);

    return svg;


    function updateNodesAndLinks(nodes, links) {

        //Update the links
        linkElements = linkElements.data(links, d => d.id);

        //Exit any old links
        linkElements.exit().remove();

        //Enter any new links
        let enterLink = linkElements.enter().append('path').attr('class', "linkElements")
            .attr("marker-end", d => {
                if (d.source === d.target) {
                    return `url(#markerSelfLoop${linkTypes.indexOf(d.type)})`;
                }
                return `url(#marker${linkTypes.indexOf(d.type)})`;
            })
            .attr("stroke", d => linkTypeColor(d.type))
            .attr("stroke-width", d => linkStrokeWidthScale(d.dataCount))
            .attr("fill", "none");

        linkElements = enterLink.merge(linkElements);

        //Update the nodes
        nodeElements = nodeElements.data(nodes, d => d.id)
        //Exit
        nodeElements.exit().remove();
        //enter any new nodes
        let enterNode = nodeElements.enter().append("circle")
            .attr("class", "nodeElements")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => {
                return d.radius;
            })
            .style('fill', d => nodeTypeColor(d.id));
        nodeElements = enterNode.merge(nodeElements);
        //Update all positions.
        linkElements.attr("d", d => arcPath(true, d));
        nodeElements.attr("cx", d => d.x).attr("cy", d => d.y);
    }

    function arcPath(leftHand, d) {
        let x1 = leftHand ? d.source.x : d.target.x,
            y1 = leftHand ? d.source.y : d.target.y,
            x2 = (leftHand ? d.target.x : d.source.x),
            y2 = (leftHand ? d.target.y : d.source.y),
            dx = x2 - x1,
            dy = y2 - y1,
            dr = Math.sqrt(dx * dx + dy * dy),
            drx = dr,
            dry = dr,
            sweep = leftHand ? 0 : 1,
            siblingCount = countSiblingLinks(d.source, d.target),
            xRotation = 0,
            largeArc = 0;

        // Self edge.
        if (x1 === x2 && y1 === y2) {
            largeArc = 1;
            sweep = 1;

            drx = 2.5 * d.source.radius;
            dry = 2 * d.source.radius;

            x1 = x1 + 1;
            y1 = y1 + 1;
        }

        if (siblingCount > 1) {
            let siblings = getSiblingLinks(d.source, d.target);
            let arcScale = d3.scalePoint()
                .domain(siblings)
                .range([1, siblingCount]);
            drx = drx / (1 + (1 / siblingCount) * (arcScale(d['type']) - 1));
            dry = dry / (1 + (1 / siblingCount) * (arcScale(d['type']) - 1));
        }

        return "M" + x1 + "," + y1 + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + x2 + "," + y2;
    }

    function countSiblingLinks(source, target) {
        let count = 0;
        for (let i = 0; i < links.length; ++i) {
            let linkSourceId = links[i].source.id;
            let linkTargetId = links[i].target.id;
            if ((linkSourceId == source.id && linkTargetId == target.id) || (linkSourceId == target.id && linkTargetId == source.id))
                count++;
        }
        ;
        return count;
    };

    function getSiblingLinks(source, target) {
        let siblings = [];
        for (let i = 0; i < links.length; ++i) {
            let linkSourceId = links[i].source.id;
            let linkTargetId = links[i].target.id;
            if ((linkSourceId == source.id && linkTargetId == target.id) || (linkSourceId == target.id && linkTargetId == source.id))
                siblings.push(links[i]['type']);
        }
        return siblings;
    };

    function getNodeRadiusScale(nodes, minR, maxR) {
        let scale = d3.scalePow(2).domain(d3.extent(nodes.map(d => d.nodeCount))).range([minR, maxR]);
        return function (nodeCount) {
            return scale(nodeCount);
        }
    }

    function addArrowMarkers(mainG, markerData, markerColor) {
        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("id", d => 'marker' + markerData.indexOf(d))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "auto")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());

        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("id", d => 'markerSelfLoop' + markerData.indexOf(d))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "25deg")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());
    }

    function setNodeRadius() {
        nodeRadiusScale = getNodeRadiusScale(nodes, networkSettings.node.minRadius, networkSettings.node.maxRadius);
        nodes.forEach(n => {
            n.radius = nodeRadiusScale(n.nodeCount);
        });
    }

    function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.dataCount))).range([minWidth, maxWidth]);
        return function (dataCount) {
            return scale(dataCount);
        }
    }
}


