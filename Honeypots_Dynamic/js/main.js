const margin = {left: 0, top: 20, right: 120, bottom: 20},
    networkWidth = 450,
    networkHeight = 450,
    timeArcWidth = window.innerWidth - networkWidth - margin.left - margin.right,
    timeArcHeight = window.innerHeight - margin.top - margin.bottom - 220,
    svgWidth = networkWidth + timeArcWidth + margin.left + margin.right,
    svgHeight = Math.max(networkHeight, timeArcHeight) + margin.top + margin.bottom;

let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight).style('overflow-x', 'visible');
//Title.
let titleG = svg.append('g').attr('transform', `translate(${(networkWidth - margin.left) / 2}, ${margin.top})`);
titleG.append('text').text('104.12.0.0 Threat Event Log Visualization').attr('class', 'graphTitle').attr('text-anchor', 'middle');
let legendG = svg.append('g').attr('transform', `translate(${legendSettings.margin.left}, ${margin.top + networkHeight + margin.top})`);

let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
let networkG = mainG.append('g').attr('transform', `translate(0, 0)`);
let timeArcG = mainG.append('g').attr('transform', `translate(${networkWidth},0)`);
let ipdatacsvTbl = document.getElementById('ipdatacsvTbl');
let keep = false;
let ng;

let fileName = "data/honeypot/20110401.txt";

//COMMON SETTINGS
let nwMinStrokeWidth = 1,
    nwMaxStrokeWidth = 3,
    nwMinRadius = 4,
    nwMaxRadius = 10,
    timeArcTransitionDuration = 500;


const COL_TIME = 'start_time',
    COL_LINK_TYPE = 'label',
    COL_SOURCE_ADDRESS = "source_ip_address",
    COL_DESTINATION_ADDRESS = "destination_ip_address";

//<editor-fold desc="This section is about link type and node type colors">
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
//</editor-fold>


let networkGraph = null;
let timeArcGraph = null;
//<editor-fold desc="This section is to calculate the nodes and links for the Network">
let dataReaderWK = new WorkerPool("js/workers/worker_datareader.js", onReaderResult, 1);
dataReaderWK.startWorker({}, 0);

//</editor-fold>
function onReaderResult(e) {
    //Hide loader if it is showing
    if(isLoaderVisible()){
        hideLoader();
    }
    let nodes = e.data.nodes, links = e.data.links, timedNodes = e.data.timedNodes, timedLinks = e.data.timedLinks;
    //Create a simulation for drag/drop and also help to

    let {linkTypes, colorColumns, colors, formatColumns, formats, networkSettings} = getNetworkSettings(links, COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, linkTypeColor, nodeTypeColor);
    if (!networkGraph) {
        networkGraph = new drawNetworkGraph(networkG, nodes, links, networkSettings);
    } else {
        networkGraph.onUpdateData(nodes, links);
    }
    const timeArcSettings = getTimeArcSettings(COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, linkTypes, linkTypeColor, nodeTypeColor, networkGraph.linkStrokeWidthScale, colorColumns, colors, formatColumns, formats);
    if (!timeArcGraph) {
        timeArcGraph = new drawTimeArc(timeArcG, timedNodes, timedLinks, timeArcSettings);
    } else {
        timeArcGraph.onUpdateTAData(timedNodes, timedLinks);
    }
}
let linkLegendData = [
    {value: "1", text: "safe"},
    {value: "-1", text: "known threat"},
    {value: "-2", text: "unknown threat"}
];

drawLinkLegends(legendG, linkLegendData, linkTypeColor);
drawNodeLegends(legendG);
//Reset it when clicking on the svg
document.onclick = () => {
    keep = !keep;
    resetBrushing(timeArcTransitionDuration);
};


function getNetworkSettings(links, COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, linkTypeColor, nodeTypeColor) {
    let linkTypes = Array.from(new Set(links.map(l => l['type'])));
    //Data for the table
    let colorColumns = [COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS],
        colors = [linkTypeColor, nodeTypeColor, nodeTypeColor],
        formatColumns = [COL_TIME],
        formats = [d3.timeFormat("%b %d %Y %H:%M:%S")];

    //Setup data for the network

    const networkSettings = {
        margin: {
            top: 10
        },
        node: {
            minRadius: nwMinRadius,
            maxRadius: nwMaxRadius
        },
        link: {
            minStrokeWidth: nwMinStrokeWidth,
            maxStrokeWidth: nwMaxStrokeWidth
        },
        transition: {
            duration: 500
        },
        width: networkWidth,
        height: networkHeight,
        nodeTypeColor: nodeTypeColor,
        linkTypes: linkTypes,
        linkTypeColor: linkTypeColor,
        onNodeMouseOverCallback: onNetworkNodeMouseOverCallback,
        onLinkMouseOverCallback: onNetworkLinkMouseOverCallback,
        onNodeMouseOutCallback: onNetworkNodeMouseOutCallback,
        onLinkMouseOutCallback: onNetworkLinkMouseOutCallback
    };

    function onNetworkNodeMouseOverCallback(node) {
        //If the node is a combination then we need to concatenate many values
        let rows = node.data;
        updateTable(ipdatacsvTbl, rows, colorColumns, colors, formatColumns, formats);
        //Also brush the timeArc
        brushTimeArcNode(node, timeArcTransitionDuration);
    }

    function onNetworkLinkMouseOverCallback(link) {
        let threatEvents = link.data;
        updateTable(ipdatacsvTbl, threatEvents, colorColumns, colors, formatColumns, formats);
        brushTimeArcLink(link, timeArcTransitionDuration);
    }

    function onNetworkNodeMouseOutCallback() {
        resetBrushing(timeArcTransitionDuration);
    }

    function onNetworkLinkMouseOutCallback() {
        resetBrushing(timeArcTransitionDuration);
    }

    return {
        linkTypes,
        colorColumns,
        colors,
        formatColumns,
        formats,
        nodeColor: nodeTypeColor,
        networkSettings
    };
}

function getTimeArcSettings(COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, linkTypes, linkTypeColor, nodeTypeColor, linkStrokeWidthScale, colorColumns, colors, formatColumns, formats) {
//Setup data for the timeArcs
    const timeArcSettings = {
        textHeight: 15,
        transition: {
            duration: 500
        },
        width: timeArcWidth,
        height: timeArcHeight,
        linkTypes: linkTypes,
        linkTypeColor: linkTypeColor,
        nodeTypeColor: nodeTypeColor,
        linkStrokeWidthScale: linkStrokeWidthScale,
        onNodeMouseOverCallBack: onTimeArcNodeMouseOverCallback,
        onLinkMouseOverCallBack: onTimeArcLinkMouseOverCallBack,
        orderFunction: forceDirectedLayout
    };

    function onTimeArcNodeMouseOverCallback(node) {
        //If the node is a combination then we need to concatenate many values
        let threatEvents = node.data;
        updateTable(ipdatacsvTbl, threatEvents, colorColumns, colors, formatColumns, formats);
        //Also brush the timeArc
        brushTimeArcNode(node, timeArcTransitionDuration);
    }

    function onTimeArcLinkMouseOverCallBack(link) {
        //Work with timeArc links.
        let threatEvents = link.data;
        updateTable(ipdatacsvTbl, threatEvents, colorColumns, colors, formatColumns, formats);
    }

    return timeArcSettings;
}

