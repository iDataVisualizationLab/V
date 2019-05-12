const margin = {left: 10, top: 20, right: 300, bottom: 0},
    networkWidth = 400,
    networkHeight = 1000,
    timeArcWidth = 1400,
    timeArcHeight = networkHeight,
    svgWidth = networkWidth + timeArcWidth + margin.left + margin.right,
    svgHeight = networkHeight + margin.top + margin.bottom;

let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight);
//Title.
// let titleG = svg.append('g').attr('transform', `translate(${svgWidth/2 - margin.left}, ${margin.top})`);
// titleG.append('text').text('104.12.0.0 Threat Event Log Visualization').attr('class', 'graphTitle').attr('text-anchor', 'middle');
// let legendG = svg.append('g').attr('transform', `translate(${svgWidth - margin.right}, ${margin.top})`);
// drawNodeLegends(legendG);
let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
let networkG = mainG.append('g').attr('transform', `translate(0, 0)`);
let timeArcG = mainG.append('g').attr('transform', `translate(${networkWidth},0)`);


d3.csv('data/104.12.0.0.csv').then(data => {
    data.forEach(d=>{
        d[COL_END_TIME] = new Date(d[COL_END_TIME]);
        if(d[COL_SOURCE_ADDRESS]===''){
            d[COL_SOURCE_ADDRESS] = 'unknown';
        }
    });
    let ipdatacsvTbl = document.getElementById('ipdatacsvTbl');
    let deviceActions = getDeviceActions(data);
    let deviceActionColor = getDeviceActionColor(deviceActions);
    let links = getLinksByColumns([COL_DEVICE_ACTION], data);
    let nodes = getAllNodesFromLinks(links);

    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, networkSettings.link.minStrokeWidth, networkSettings.link.maxStrokeWidth);
    drawNetworkGraph(networkG, networkWidth, networkHeight, nodes, links, deviceActions, deviceActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onLinkMouseOverCallback);
    let timeLinks = getLinksByColumns([COL_DEVICE_ACTION, COL_END_TIME], data);
    let timeNodes = nodes.map(n => {
        return Object.assign({}, n);
    });//Copy the nodes to avoid changing its x, y for the network.

    drawTimeArc(timeArcG, timeArcWidth, timeArcHeight, timeNodes, timeLinks, deviceActions, deviceActionColor, linkStrokeWidthScale);

    function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.threatCount))).range([minWidth, maxWidth]);
        return function (threatCount) {
            return scale(threatCount);
        }
    }

    function onNodeMouseOverCallback(value){
        filterByColumns(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS], value, data);
    }
    function onLinkMouseOverCallback(link){
        let threatEvents = links.find(d=>d===link).threatEvents;
        updateTable(ipdatacsvTbl, threatEvents);
    }

});

//<editor-fold desc="this section is for scaling">
function getDeviceActionColor(deviceActions) {
    return function (deviceAction) {
        return d3.schemeCategory10[deviceActions.indexOf(deviceAction)];
    }
};

function nodeColor(node) {
    if (node.id.startsWith('104.12')) {
        return 'steelblue';
    } else if (node.id === "unknown") {
        return 'gray';
    } else {
        return 'red';//outsider
    }
}
//</editor-fold>