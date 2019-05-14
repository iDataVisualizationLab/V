const margin = {left: 0, top: 20, right: 120, bottom: 20},
    networkWidth = 500,
    networkHeight = 500,
    timeArcWidth = window.innerWidth - networkWidth - margin.left - margin.right,
    timeArcHeight = window.innerHeight - margin.top - margin.bottom - 220,
    svgWidth = networkWidth + timeArcWidth + margin.left + margin.right,
    svgHeight = Math.max(networkHeight, timeArcHeight) + margin.top + margin.bottom;

let svg = d3.select("#graphDiv").append("svg").attr("width", svgWidth).attr("height", svgHeight);
//Title.
let titleG = svg.append('g').attr('transform', `translate(${(networkWidth - margin.left) / 2}, ${margin.top})`);
titleG.append('text').text('104.12.0.0 Threat Event Log Visualization').attr('class', 'graphTitle').attr('text-anchor', 'middle');
let legendG = svg.append('g').attr('transform', `translate(${legendSettings.margin.left}, ${margin.top + networkHeight + margin.top})`);
drawNodeLegends(legendG);
let mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
let networkG = mainG.append('g').attr('transform', `translate(0, 0)`);
let timeArcG = mainG.append('g').attr('transform', `translate(${networkWidth},0)`);
let ipdatacsvTbl = document.getElementById('ipdatacsvTbl');

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
    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, networkSettings.link.minStrokeWidth, networkSettings.link.maxStrokeWidth);
    drawNetworkGraph(networkG, networkWidth, networkHeight, nodes, links, deviceActions, deviceActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onNetworkLinkMouseOverCallback, onNetworkNodeMouseOutCallback, onNetworkLinkMouseOutCallback);
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

    // drawTimeArc(timeArcG, timeArcWidth, timeArcHeight, tgoNodes, tgoLinks, deviceActions, deviceActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onTimeArcLinkMouseOverCallBack, orderFunction);
    drawTimeArc(timeArcG, timeArcWidth, timeArcHeight, tgoNodes, tgoLinks, deviceActions, deviceActionColor, linkStrokeWidthScale, onNodeMouseOverCallback, onTimeArcLinkMouseOverCallBack);

    //Reset it when clicking on the svg
    document.onclick = resetBrushing;

    //function to give custom orders.
    function orderFunction(nodes, links, onComplete){
        //Convert ID of sources and targets of links to object
        links.forEach(l=>{
           l.source = nodes.find(n=>n.id === l.source);
           l.target = nodes.find(n=>n.id === l.target);
        });
        debugger
        let sortOrderValue = {
            outside: 1,
            targetOfOutside: 2,
            unknown: 3,
            targetsOfUnknownOnly: 4,
            others: 5
        }
        let targetsOfOutsideIPs = links.filter(l=>l.source.id.startsWith('104.12')).map(d=>d.target.id);

        nodes.forEach(n=>{
            if(!n.id.startsWith('104.12')){
                n.orderValue = sortOrderValue.outside;
            }
            else if(targetsOfOutsideIPs.indexOf(n.id)>=0){
                n.orderValue = sortOrderValue.targetOfOutside;
            }else if(n.id === 'unknown'){
                n.orderValue = sortOrderValue.unknown;
            }
        });
        //Sort
        nodes.sort((a, b)=>a.orderValue - b.orderValue);
        //Now the y will be the index.
        nodes.forEach((n, i)=>{
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
        if(node.id === 'combined'){
            filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS], node.nodes.map(d=>d.id), data);
        }else{
            filterByColumnsOr(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS],[node.id], data);
        }
        //Also brush the timeArc
        brushTimeArcNode(node);
    }

    function onNetworkLinkMouseOverCallback(link) {
        let threatEvents = links.find(d => d === link).threatEvents;
        updateTable(ipdatacsvTbl, threatEvents);
        brushTimeArcLink(link);
    }

    function onTimeArcLinkMouseOverCallBack(link) {
        //Work with timeArc links.
        let values = [link.source.id, link.target.id==='combined'?link.targetId: link.target.id, link[COL_DEVICE_ACTION], link[COL_END_TIME]];
        filterByColumnsAnd(ipdatacsvTbl, [COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_DEVICE_ACTION, COL_END_TIME], values, data);
    }

    function onNetworkNodeMouseOutCallback() {
        resetBrushing();
    }

    function onNetworkLinkMouseOutCallback() {
        resetBrushing();
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