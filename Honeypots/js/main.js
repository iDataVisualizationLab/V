const margin = {left: 0, top: 20, right: 120, bottom: 20},
    networkWidth = 500,
    networkHeight = 500,
    timeArcWidth = window.innerWidth - networkWidth - margin.left - margin.right,
    timeArcHeight = window.innerHeight - margin.top - margin.bottom - 220,
    svgWidth = networkWidth + timeArcWidth + margin.left + margin.right,
    svgHeight = Math.max(networkHeight, timeArcHeight) + margin.top + margin.bottom;

let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight).style('overflow-x', 'visible');
//Title.
let titleG = svg.append('g').attr('transform', `translate(${(networkWidth - margin.left) / 2}, ${margin.top})`);
titleG.append('text').text('104.12.0.0 Threat Event Log Visualization').attr('class', 'graphTitle').attr('text-anchor', 'middle');
let legendG = svg.append('g').attr('transform', `translate(${legendSettings.margin.left}, ${margin.top + networkHeight + margin.top})`);
drawNodeLegends(legendG);
let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
let networkG = mainG.append('g').attr('transform', `translate(0, 0)`);
let timeArcG = mainG.append('g').attr('transform', `translate(${networkWidth},0)`);
let ipdatacsvTbl = document.getElementById('ipdatacsvTbl');
let keep = false;
d3.csv('data/104.12.0.0.csv').then(data => {
    data.forEach(d => {
        d[COL_END_TIME] = new Date(d[COL_END_TIME]);
        if (d[COL_SOURCE_ADDRESS] === '') {
            d[COL_SOURCE_ADDRESS] = 'unknown';
        }
    });

    let deviceActions = getDeviceActions(data);
    let deviceActionColor = getDeviceActionColor(deviceActions);
    let links = getLinksByColumns([COL_DEVICE_ACTION], data);
    let nodes = getAllNodesFromLinks(links);
    //Setup data for the network
    let nwMinStrokeWidth = 1,
        nwMaxStrokeWidth = 3,
        nwMinRadius = 4,
        nwMaxRadius = 10;
    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, nwMinStrokeWidth, nwMaxStrokeWidth);
    const networkSettings = {
        node: {
            minRadius: nwMinRadius,
            maxRadius: nwMaxRadius
        },
        link: {
            minStrokeWidth: nwMinStrokeWidth,
            maxStrokeWidth: nwMaxStrokeWidth
        },
        width: networkWidth,
        height: networkHeight,
        nodeTypeColor: nodeColor,
        linkTypes: deviceActions,
        linkTypeColor: deviceActionColor,
        linkStrokeWidthScale: linkStrokeWidthScale,
        onNodeMouseOverCallback: onNodeMouseOverCallback,
        onLinkMouseOverCallback: onNetworkLinkMouseOverCallback,
        onNodeMouseOutCallback: onNetworkNodeMouseOutCallback,
        onLinkMouseOutCallback: onNetworkLinkMouseOutCallback
    };
    drawNetworkGraph(networkG, nodes, links, networkSettings);
    drawLinkLegends(legendG, deviceActions, deviceActionColor);
    //links and nodes without combinations
    let timeLinks = getLinksByColumns([COL_DEVICE_ACTION, COL_END_TIME], data);
    //Copy the nodes to avoid changing its x, y for the network.
    let timeNodes = nodes.map(n => {
        return Object.assign({}, n);
    });
    //links and nodes with combinations
    let targetsOfUnknownOnly = getTargetsOfUnknownOnly(data);
    //Remove (104.12.90.1)
    //targetsOfUnknownOnly = targetsOfUnknownOnly.filter(d => d != '104.12.90.1');
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
    debugger
    let nestedBySTDT = {};
    tgoLinks.forEach(l => {
        let key = l.source + "," + l.target + "," + l[COL_DEVICE_ACTION] + ',' + l[COL_END_TIME];
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
        }
        link[COL_DEVICE_ACTION] = value[0][COL_DEVICE_ACTION];
        link[COL_END_TIME] = value[0][COL_END_TIME];
        if (link.target === 'combined') {
            if (!link.targetIds) link.targetIds = [];
            link.targetIds.push(link.targetId);
        }
        return link;
    });
    //Setup data for the timeArcs
    const timeArcSettings = {
        textHeight: 15,
        transition: {
            duration: 500
        },
        width: timeArcWidth,
        height: timeArcHeight,
        linkTypes: deviceActions,
        linkTypeColor: deviceActionColor,
        nodeTypeColor: nodeColor,
        linkStrokeWidthScale: linkStrokeWidthScale,
        onNodeMouseOverCallBack: onNodeMouseOverCallback,
        onLinkMouseOverCallBack: onTimeArcLinkMouseOverCallBack,
        orderFunction: forceDirectedLayout
    };
    drawTimeArc(timeArcG, tgoNodes, tgoLinks, timeArcSettings);

    //Reset it when clicking on the svg
    document.onclick = () => {
        keep = !keep;
        resetBrushing(timeArcSettings.transition.duration);
    };


    function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.threatCount))).range([minWidth, maxWidth]);
        return function (threatCount) {
            return scale(threatCount);
        }
    }

    function onNodeMouseOverCallback(node) {
        //If the node is a combination then we need to concatenate many values
        if (node.id === 'combined') {
            filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS], node.nodes.map(d => d.id), data);
        } else {
            filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS], [node.id], data);
        }
        //Also brush the timeArc
        brushTimeArcNode(node, timeArcSettings.transition.duration);
    }

    function onNetworkLinkMouseOverCallback(link) {
        let threatEvents = links.find(d => d === link).threatEvents;
        updateTable(ipdatacsvTbl, threatEvents);
        brushTimeArcLink(link, timeArcSettings.transition.duration);
    }

    function onTimeArcLinkMouseOverCallBack(link) {
        //Work with timeArc links.
        let threatEvents = tgoLinks.find(d => d === link).threatEvents;
        updateTable(ipdatacsvTbl, threatEvents);
    }

    function onNetworkNodeMouseOutCallback() {
        resetBrushing(timeArcSettings.transition.duration);
    }

    function onNetworkLinkMouseOutCallback() {
        resetBrushing(timeArcSettings.transition.duration);
    }

});


//<editor-fold desc="this section is for scaling">
let deviceActionColors = {
    'Permitted': 'green',
    'none': 'steelblue',
    '': '#ff7f0e'
}

function getDeviceActionColor(deviceActions) {
    return function (deviceAction) {
        return deviceActionColors[deviceAction];
    }
};

function nodeColor(node) {
    if (node.id.startsWith('104.12')) {
        return 'black';
    } else if (node.id === "unknown") {
        return 'gray';
    } else if (node.id === "combined") {
        return "black";
    } else {
        return 'red';//outsider
    }
}

//</editor-fold>