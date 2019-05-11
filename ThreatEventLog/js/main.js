let settings = {
    node: {
        minRadius: 4,
        maxRadius: 30
    },
    link: {
        minStrokeWidth: 1.5,
        maxStrokeWidth: 5
    },
    legend: {
        nodeRadius: 8,
        height: 18,
        linkSize: 16,
        linkStrokeWidth: 2
    }
};
let COL_END_TIME = 'End Time', COL_NAME = 'Name', COL_DEVICE_ACTION = 'Device Action',
    COL_DEVICE_PRODUCT = 'Device Product', COL_DEVICE_VENDOR = 'Device Vendor',
    COL_SOURCE_ADDRESS = 'Source Address', COL_SOURCE_PORT = 'Source Port',
    COL_SOURCE_ZONE_NAME = 'Source Zone Name', COL_DESTINATION_ADDRESS = 'Destination Address',
    COL_DESTINATION_PORT = 'Destination Port', COL_DESTINATION_ZONE = 'Destination Zone Name';
let margin = {left: 10, top: 20, right: 300, bottom: 0}, width = 600, height = 600,
    svgWidth = width + margin.left + margin.right, svgHeight = height + margin.top + margin.bottom;
let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight);
//Title.
let titleG = svg.append('g').attr('transform', `translate(${margin.left + (width / 2)}, ${margin.top})`);
titleG.append('text').text('104.12.0.0 Threat Event Log Visualization').attr('class', 'graphTitle').attr('text-anchor', 'middle');
let legendG = svg.append('g').attr('transform', `translate(${svgWidth - margin.right}, ${margin.top})`);
//Draw the legend
let nodeColorLegendObj = {
    'inside': 'steelblue',
    'unknown': 'gray',
    'outside': 'red'
};

drawNodeLegends();

let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

let linkElements = mainG.selectAll('.linkElements'),
    nodeElements = mainG.selectAll('.nodeElements');

let nodeRadiusScale;
let deviceProducts;
let deviceActions;
d3.csv('data/104.12.0.0.csv').then(data => {
    //Create the table.
    updateTable(document.getElementById('ipdatacsvTbl'), data);
    let headers = Object.keys(data[0]);
    //Get deviceProducts
    deviceProducts = getDeviceProducts(data);
    deviceActions = getDeviceActions(data);
    let deviceProductColor = getDeviceProductColor(deviceProducts);
    let deviceActionColor = getDeviceActionColor(deviceActions);
    svg.append("defs").selectAll("marker")
        .data(deviceActions)
        .enter().append("marker")
        .attr("id", d => 'marker' + deviceActions.indexOf(d))
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr('markerUnits', "strokeWidth")
        .attr("orient", "auto")
        .attr('xoverflow', 'visible')
        .append("path")
        .attr('d', 'M0,-5L10,0L0,5')
        .attr("fill", deviceActionColor(d => d));

    svg.append("defs").selectAll("marker")
        .data(deviceActions)
        .enter().append("marker")
        .attr("id", d => 'markerSelfLoop')
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", -6)
        .attr("markerWidth", 3)
        .attr("markerHeight", 3)
        .attr('markerUnits', "strokeWidth")
        .attr("orient", "auto")
        .attr('xoverflow', 'visible')
        .append("path")
        .attr('d', 'M0,-5L10,0L0,5')
        .attr("fill", deviceActionColor(d => d));

    let graph = generateGraph(data);
    let nodes = graph.nodes;
    let links = graph.links;
    nodeRadiusScale = getNodeRadiusScale(nodes, settings.node.minRadius, settings.node.maxRadius);
    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, settings.link.minStrokeWidth, settings.link.maxStrokeWidth);
    //Calculate the node's radius
    nodes.forEach(n => {
        n.radius = nodeRadiusScale(n.linkCount);
    })

    let simulation = d3.forceSimulation()
        .on('tick', tick);
    //Restart the simulation layout
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2)).alphaTarget(0.3).restart()
        .force("collide", d3.forceCollide(d => d.radius));

    //Update the links
    linkElements = linkElements.data(links, d => d.index);

    //Exit any old links
    linkElements.exit().remove();

    //Enter any new links
    let enterLink = linkElements.enter().append('path').attr('class', "linkElements")
        .attr("marker-end", d => {
            if (d.source === d.target) {
                return `url(#${'markerSelfLoop'})`
            }
            return `url(#${'marker' +
            // deviceProducts.indexOf(d[COL_DEVICE_PRODUCT])
            deviceActions.indexOf(d[COL_DEVICE_ACTION])
                })`
        })
        // .attr("stroke", d => deviceProductColor(d[COL_DEVICE_PRODUCT]))
        .attr("stroke", d => deviceActionColor(d[COL_DEVICE_ACTION]))
        .attr("stroke-width", d => linkStrokeWidthScale(d.threatCount));


    //Now move the legend group to the center.
    legendG.attr("transform", `translate(${svgWidth - margin.right}, ${
    (svgHeight - (d3.entries(nodeColorLegendObj).length +
        // deviceProducts.length
        deviceActions.length
    ) * settings.legend.height) / 2
        })`);
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
            return nodeRadiusScale(d.linkCount);
        })
        .style('fill', nodeColor)
        .call(d3.drag()
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
    nodeElements = enterNode.merge(nodeElements);
    nodeElements.on("mouseover", d => {
        showTip(`IP: "${d.id}", links count: ${d.linkCount}`);
        filterByColumns(document.getElementById('ipdatacsvTbl'), [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS], d.id, data);
    })
        .on("mouseout", d => {
            hideTip();
        });


    drawLinkLegends();

    function drawLinkLegends() {
        //Draw legend for strokes.
        let linkLegendG = legendG.append('g').attr("transform", `translate(0, ${settings.legend.height * d3.entries(nodeColorLegendObj).length})`);
        let linkLegendGs = linkLegendG.selectAll('.linkLegendG')
        // .data(deviceProducts)
            .data(deviceActions)
            .enter().append('g').attr('class', 'linkLegendG').attr("transform", (d, i) => `translate(${0}, ${i * settings.legend.height})`);
        linkLegendGs.append('line')
            .attr('y1', settings.legend.height / 2).attr("y2", settings.legend.height / 2)
            .attr("x2", -settings.legend.linkSize)
            // .attr('stroke', deviceProductColor)
            .attr('stroke', deviceActionColor)
            .attr("stroke-width", settings.legend.linkStrokeWidth);
        linkLegendGs.append('text').text(d => {
            //For products
            //return d;
            //For actions
            if (d === '') {
                return 'Empty';
            }
            return d;
        }).call(defineLegendText);
    }

    function arcPath(leftHand, d) {
        let x1 = leftHand ? d.source.x : d.target.x,
            y1 = leftHand ? d.source.y : d.target.y,
            x2 = leftHand ? d.target.x : d.source.x,
            y2 = leftHand ? d.target.y : d.source.y,
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
            drx = drx / (1 + (1 / siblingCount) * (arcScale(
                // d[COL_DEVICE_PRODUCT]
                d[COL_DEVICE_ACTION]
            ) - 1));
            dry = dry / (1 + (1 / siblingCount) * (arcScale(
                // d[COL_DEVICE_PRODUCT]
                d[COL_DEVICE_ACTION]
            ) - 1));
        }

        return "M" + x1 + "," + y1 + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + x2 + "," + y2;
    }

    function countSiblingLinks(source, target) {
        let count = 0;
        for (let i = 0; i < links.length; ++i) {
            if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                count++;
        }
        ;
        return count;
    };

    function getSiblingLinks(source, target) {
        let siblings = [];
        for (let i = 0; i < links.length; ++i) {
            if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                siblings.push(
                    // links[i][COL_DEVICE_PRODUCT]
                    links[i][COL_DEVICE_ACTION]
                );
        }
        return siblings;
    };

    function tick() {
        linkElements.attr("d", d => arcPath(true, d));
        nodeElements.attr("cx", d => d.x).attr("cy", d => d.y);
    }

    //<editor-fold desc="this section is for drag drop">
    function dragsubject() {
        return simulation.find(d3.event.x, d3.event.y);
    }

    function dragstarted() {
        if (!d3.event.active) simulation.alphaTarget(0.1).restart();
        d3.event.subject.fx = d3.event.subject.x;
        d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
        d3.event.subject.fx = d3.event.x;
        d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
        if (!d3.event.active) simulation.alphaTarget(0);
        d3.event.subject.fx = null;
        d3.event.subject.fy = null;
    }

    //</editor-fold>

});

function drawNodeLegends() {
    let legendNodeG = legendG.append('g');
    let legendNodeGs = legendNodeG.selectAll('.nodeLegendG').data(d3.entries(nodeColorLegendObj)).enter().append('g').attr('class', 'nodeLegendG').attr("transform", (d, i) => `translate(${0}, ${i * settings.legend.height})`);

    legendNodeGs.append('circle')//Append circles
        .attr('class', 'legendNode')
        .attr('cx', -settings.legend.nodeRadius + 2)
        .attr('cy', settings.legend.height / 2)
        .attr("r", settings.legend.nodeRadius).attr('fill', d => d.value);
    legendNodeGs.append('text').text(d => d.key + " IPs").call(defineLegendText);
}

function defineLegendText(theText) {
    theText.attr('x', 2 * settings.legend.nodeRadius)
        .attr('y', settings.legend.height / 2)
        .attr('alignment-baseline', 'middle')
}

//<editor-fold desc="This section is for data processing">
function getDeviceProducts(data) {
    return Array.from(new Set(data.map(d => d[COL_DEVICE_PRODUCT])));
}

function getDeviceActions(data) {
    return Array.from(new Set(data.map(d => d[COL_DEVICE_ACTION])));
}

function generateGraph(data) {
    let nestedBySourceTargetLinkProp = d3.nest().key(d => d[COL_SOURCE_ADDRESS] + "," + d[COL_DESTINATION_ADDRESS] + "," +
        // d[COL_DEVICE_PRODUCT]
        d[COL_DEVICE_ACTION]
    ).entries(data);

    let links = nestedBySourceTargetLinkProp.map(d => {
        return {
            source: d.values[0][COL_SOURCE_ADDRESS],
            target: d.values[0][COL_DESTINATION_ADDRESS],
            threatEvents: d.values,
            threatCount: d.values.length,
            // 'Device Product': d.values[0][COL_DEVICE_PRODUCT]
            'Device Action': d.values[0][COL_DEVICE_ACTION]

        };
    });
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
        ;
    });

    let nodes = Object.keys(nestedLinkByNodes).map(d => {
        return {
            id: d,
            linkCount: d3.sum(nestedLinkByNodes[d].map(links => links.threatCount))
        }
    });
    return {nodes: nodes, links: links};
}

//</editor-fold>

//<editor-fold desc="this section is for scaling">
function getDeviceProductColor(deviceProducts) {
    return function (deviceProduct) {
        return d3.schemeCategory10[deviceProducts.indexOf(deviceProduct)];
    }
};

function getDeviceActionColor(deviceActions) {
    return function (deviceAction) {
        return d3.schemeCategory10[deviceActions.indexOf(deviceAction)];
    }
};

function nodeColor(node) {
    if (node.id.startsWith('104.12')) {
        return 'steelblue';
    } else if (node.id === "") {
        return 'gray';
    } else {
        return 'red';//outsider
    }
}

function getNodeRadiusScale(nodes, minR, maxR) {
    let scale = d3.scalePow(2).domain(d3.extent(nodes.map(d => d.linkCount))).range([minR, maxR]);
    return function (linkCount) {
        return scale(linkCount);
    }
}

function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
    let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.threatCount))).range([minWidth, maxWidth]);
    return function (threatCount) {
        return scale(threatCount);
    }
}

// function getLinkStrokeWidthScaleForDeviceProduct()
//</editor-fold>