const margin = {left: 0, top: 20, right: 120, bottom: 20},
    networkWidth = 500,
    networkHeight = 500,
    timeArcWidth = window.innerWidth - networkWidth - margin.left - margin.right,
    timeArcHeight = window.innerHeight - margin.top - margin.bottom - 120,
    svgWidth = networkWidth + timeArcWidth + margin.left + margin.right,
    svgHeight = Math.max(networkHeight, timeArcHeight) + margin.top + margin.bottom;

let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight).style('overflow-x', 'visible');
//Title.
let titleG = svg.append('g').attr('transform', `translate(${(networkWidth - margin.left) / 2}, ${margin.top})`);
titleG.append('text').text('').attr('class', 'graphTitle').attr('text-anchor', 'middle');
let legendG = svg.append('g').attr('transform', `translate(${legendSettings.margin.left}, ${networkHeight})`);
drawNodeLegends(legendG);
let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
let networkG = mainG.append('g').attr('transform', `translate(0, -20)`);
let timeArcG = mainG.append('g').attr('transform', `translate(${networkWidth},0)`).attr("id", "timeArcG");
let ipdatacsvTbl = document.getElementById('ipdatacsvTbl');
let keep = false;

let timeParse = d3.timeParse('%H:%M %b %d, %Y');
let startTime = timeParse('00:00 Jan 01, 2025');

document.getElementById("dataFile").addEventListener("change", loadData);
let dataFiles = ["Q1-Graph1", "Q1-Graph2", "Q1-Graph3", "Q1-Graph4", "Q1-Graph5", "seed1_graph", "seed2_graph", "seed3_graph"];
let mappedData = [null, null, null, null, null, null, null, null];
let mappedScores = [0.52, 0.34, 0.25, 0.05, 0.03, 0, 0, 0.12];
let template2GraphData = [null, null, null, null, null, null, null, null];

let currentFileIndex = 0;
document.getElementById("dataFile").selectedIndex = currentFileIndex;
handleFile(dataFiles[currentFileIndex]);

document.getElementById('switchMapping').addEventListener("change", handleMapping);


function setTemplate2GraphScore() {
    document.getElementById('template2GraphDiv').style.visibility = 'visible'
    document.getElementById(`template`).addEventListener("change", handleMappingTemplate2Graph)
    document.getElementById(`template2Seed3`).addEventListener("change", handleMappingTemplate2Graph)
    mappedScores.forEach((score, i) => {

        let de = document.getElementById(`template2GraphScore${i + 1}`)
        if (de) {
            de.innerText = '' + score;
            document.getElementById(`template2Graph${i + 1}`).addEventListener("change", handleMappingTemplate2Graph)
        }
    });

}

function secondsToDateTime(seconds) {
    return new Date(startTime.getTime() + seconds * 1000);
}

function loadData(event) {
    currentFileIndex = event.target.selectedIndex;
    handleFile(event.target.value);
}

async function handleMappingTemplate2Graph(event) {
    debugger
    let theId = event.target.id;
    if (theId !== 'template') {
        let theIndex = parseInt('' + theId.charAt(theId.length - 1)) - 1;

        if (event.target.checked) {
            if (!template2GraphData[theIndex]) {
                template2GraphData[theIndex] = await d3.csv('data/Q1-Graph' + (theIndex + 1) + '_mapped_template.csv');
                template2GraphData[theIndex] = cleanData(template2GraphData[theIndex]);
            }
            let tALinkElements = d3.selectAll('.tALinkElements');
            tALinkElements.attr('stroke', d => {
                let enclosedLinks = d.threatEvents;
                let existCount = 0;
                enclosedLinks.forEach(l => {
                    if (template2GraphData[theIndex].find(md => md.Source === l.Source && md.Target === l.Target && md.eType === l.eType && md.Time.getTime() === l.Time.getTime())) {
                        existCount += 1;
                    }
                });
                if (existCount == 0) {
                    return 'red';
                }
                return actionCodeToColor(enclosedLinks[0].eType);
            });
        }
    } else {

        let tALinkElements = d3.selectAll('.tALinkElements');
        tALinkElements.attr('stroke', d => {
            let enclosedLinks = d.threatEvents;
            return actionCodeToColor(enclosedLinks[0].eType);
        });
    }

}

async function handleMapping() {
    if (document.getElementById('switchMapping').checked) {
        if (!mappedData[currentFileIndex]) {
            mappedData[currentFileIndex] = await d3.csv('data/' + dataFiles[currentFileIndex] + '_mapped_graph.csv');
            mappedData[currentFileIndex] = cleanData(mappedData[currentFileIndex]);
        }
        let tALinkElements = d3.selectAll('.tALinkElements');
        tALinkElements.attr('stroke', d => {
            let enclosedLinks = d.threatEvents;
            let existCount = 0;
            enclosedLinks.forEach(l => {
                if (mappedData[currentFileIndex].find(md => md.Source === l.Source && md.Target === l.Target && md.eType === l.eType && md.Time.getTime() === l.Time.getTime())) {
                    existCount += 1;
                }
            });
            if (existCount == 0) {
                return 'red';
            }
            return actionCodeToColor(enclosedLinks[0].eType);
        });
    } else {
        let tALinkElements = d3.selectAll('.tALinkElements');
        tALinkElements.attr('stroke', d => {
            let enclosedLinks = d.threatEvents;
            return actionCodeToColor(enclosedLinks[0].eType);
        });
    }

}

function handleFile(fileName) {
    if (currentFileIndex === 8) {
        document.getElementById(`template`).checked = true;
        document.getElementById('template2GraphDiv').style.visibility = 'visible';
        document.getElementById('graph2TemplateDiv').style.visibility = 'hidden';
        setTemplate2GraphScore();
    } else {
        document.getElementById('template2GraphDiv').style.visibility = 'hidden';
        document.getElementById('graph2TemplateDiv').style.visibility = 'visible';
    }

    document.getElementById('switchMapping').checked = false;
    document.getElementById('mappingScore').innerText = '' + mappedScores[currentFileIndex];
    d3.csv('data/' + fileName + ".csv").then(data => {
        data = cleanData(data);
        // data = data.filter(d=>d[COL_TIME].getTime() >= startTime.getTime() );

        let nodeActions = getActions(data);
        let nodeActionColor = getActionColor(nodeActions);
        let links = getLinksByColumns([COL_ACTION], data);
        let nodes = getAllNodesFromLinks(links);
        let linkStrokeWidthScale = getLinkStrokeWidthScale(links, networkSettings.link.minStrokeWidth, networkSettings.link.maxStrokeWidth);
        drawNetworkGraph(networkG, networkWidth, networkHeight, nodes, links, nodeActions, nodeActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onNetworkLinkMouseOverCallback, onNetworkNodeMouseOutCallback, onNetworkLinkMouseOutCallback);
        drawLinkLegends(legendG, nodeActions, nodeActionColor);
        //links and nodes without combinations
        let timeLinks = getLinksByColumns([COL_ACTION, COL_TIME], data);
        //Copy the nodes to avoid changing its x, y for the network.
        let timeNodes = nodes.map(n => {
            return Object.assign({}, n);
        });
        //links and nodes with combinations
        let targetsOfUnknownOnly = getTargetsOfUnknownOnly(data);
        //Remove (xxx.xx.90.1)
        //targetsOfUnknownOnly = targetsOfUnknownOnly.filter(d => d != 'xxx.xx.90.1');
        let combinedNode = {id: 'combined', nodes: []};
        let tgoNodes = [];
        timeNodes.forEach(n => {
            if (targetsOfUnknownOnly.indexOf(n.id) >= 0) {
                combinedNode.nodes.push(n);
            } else {
                tgoNodes.push(n);
            }
        });
        //Add the combined node
        tgoNodes.push(combinedNode);
        let tgoLinks = timeLinks.map(d => {
            if (targetsOfUnknownOnly.indexOf(d.target) >= 0) {
                d.targetId = d.target;//store it for future references.
                d.target = 'combined';
            }
            return d;
        });
        //After combining nodes => some links are combined again (same time and same source as 'unknown').
        let nestedBySTDT = {};
        tgoLinks.forEach(l => {
            let key = l.source + "," + l.target + "," + l[COL_ACTION] + ',' + l[COL_TIME];
            if (!nestedBySTDT[key]) nestedBySTDT[key] = [];
            nestedBySTDT[key].push(l);
        });
        //Now we need to redo the links again.
        tgoLinks = d3.entries(nestedBySTDT).map(r => {
            let value = r.value;
            let threatEvents = [];
            value.map(v => {
                threatEvents = threatEvents.concat(v['threatEvents']);
            });
            let link = {
                source: value[0].source,
                target: value[0].target,
                threatEvents: threatEvents,
                threatCount: threatEvents.length
            };
            link[COL_ACTION] = value[0][COL_ACTION];
            link[COL_TIME] = value[0][COL_TIME];
            if (link.target === 'combined') {
                if (!link.targetIds) link.targetIds = [];
                link.targetIds.push(link.targetId);
            }
            return link;
        });

        drawTimeArc(timeArcG, timeArcWidth, timeArcHeight, tgoNodes, tgoLinks, nodeActions, nodeActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onTimeArcLinkMouseOverCallBack);

        //Reset it when clicking on the svg
        document.onclick = () => {
            keep = !keep;
            resetBrushing();
        };

        //function to give custom orders.
        function orderFunction(nodes, links, onComplete) {
            //Convert ID of sources and targets of links to object
            links.forEach(l => {
                l.source = nodes.find(n => n.id === l.source);
                l.target = nodes.find(n => n.id === l.target);
            });

            let sortOrderValue = {
                outside: 1,
                targetOfOutside: 2,
                unknown: 3,
                targetsOfUnknownOnly: 4,
                others: 5
            };
            let targetsOfOutsideIPs = links.filter(l => l.source.id.startsWith('xxx.xx')).map(d => d.target.id);

            nodes.forEach(n => {
                if (!n.id.startsWith('xxx.xx')) {
                    n.orderValue = sortOrderValue.outside;
                } else if (targetsOfOutsideIPs.indexOf(n.id) >= 0) {
                    n.orderValue = sortOrderValue.targetOfOutside;
                } else if (n.id === 'unknown') {
                    n.orderValue = sortOrderValue.unknown;
                }
            });
            //Sort
            nodes.sort((a, b) => a.orderValue - b.orderValue);
            //Now the y will be the index.
            nodes.forEach((n, i) => {
                n.y = i;
            });
            onComplete();
        }

        function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
            let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.threatCount))).range([minWidth, maxWidth]);
            return function (threatCount) {
                return scale(threatCount);
            }
        }

        function onNodeMouseOverCallback(node) {
            //If the node is a combination then we need to concatenate many values
            if (node.id === 'combined') {
                filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE, COL_TARGET], node.nodes.map(d => d.id), data);
            } else {
                filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE, COL_TARGET], [node.id], data);
            }
            //Also brush the timeArc
            // brushTimeArcNode(node);
        }

        function onNetworkLinkMouseOverCallback(link) {
            let threatEvents = links.find(d => d === link).threatEvents;
            updateTable(ipdatacsvTbl, threatEvents);
            brushTimeArcLink(link);
        }

        function onTimeArcLinkMouseOverCallBack(link) {
            //Work with timeArc links.
            let threatEvents = tgoLinks.find(d => d === link).threatEvents;
            updateTable(ipdatacsvTbl, threatEvents);
        }

        function onNetworkNodeMouseOutCallback() {
            resetBrushing();
        }

        function onNetworkLinkMouseOutCallback() {
            resetBrushing();
        }

    });
}
