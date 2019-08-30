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
// let fileName = "data/104.12.0.0.csv";
let fileName = "data/honeypot/20110401.txt";

//COMMON SETTINGS
let nwMinStrokeWidth = 1,
    nwMaxStrokeWidth = 3,
    nwMinRadius = 4,
    nwMaxRadius = 10,
    timeArcTransitionDuration = 500;

if (fileName === 'data/104.12.0.0.csv') {
    d3.csv(fileName).then(data => {
        data.forEach(d => {
            d['End Time'] = new Date(d['End Time']);
            if (d['Source Address'] === '') {
                d['Source Address'] = 'unknown';
            }
        });

        //<editor-fold desc="This section is about link type and node type colors">
        let deviceActionColors = {
            'Permitted': 'green',
            'none': 'steelblue',
            '': '#ff7f0e'
        };

        let linkTypeColor = getLinkTypeColor(deviceActionColors);

        let linkLegendData = [
            {value: "Permitted", text: "Permitted"},
            {value: "none", text: "None"},
            {value: "", text: "Empty"}
        ];
        drawNodeLegends(legendG);
        drawLinkLegends(legendG, linkLegendData, linkTypeColor);

        function getLinkTypeColor(linkTypeColorObj) {
            return function (type) {
                return linkTypeColorObj[type];
            }
        }
        let nodeColor = function nodeColor(value) {
            if (value.startsWith('104.12')) {
                return 'black';
            } else if (value === "unknown") {
                return 'gray';
            } else if (value === "combined") {
                return "black";
            } else {
                return 'red';//outsider
            }
        };
        //</editor-fold>

        const COL_TIME = 'End Time',
            COL_LINK_TYPE = 'Device Action',
            COL_SOURCE_ADDRESS = 'Source Address',
            COL_DESTINATION_ADDRESS = 'Destination Address';

        //<editor-fold desc="This section is to calculate the nodes and links for the Network">
        let links = getLinksByColumns(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, [COL_LINK_TYPE]);
        let nodes = getAllNodesFromLinks(links);
        //</editor-fold>

        let {linkTypes, colorColumns, colors, formatColumns, formats, linkStrokeWidthScale, networkSettings} = getNetworkSettings(data, links, COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, linkTypeColor, nodeColor);
        hideLoader();
        drawNetworkGraph(networkG, nodes, links, networkSettings);


        //<editor-fold desc="This section is to calculate nodes and links for the timeArc">
        //links and nodes without combinations
        let timeLinks = getLinksByColumnsAtTime(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, [COL_LINK_TYPE]);
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
        let nestedBySTDT = {};
        tgoLinks.forEach(l => {
            let key = l.source + "," + l.target + "," + l['type'] + ',' + l['time'];
            if (!nestedBySTDT[key]) nestedBySTDT[key] = [];
            nestedBySTDT[key].push(l);
        });
        //Now we need to redo the links again.
        tgoLinks = d3.entries(nestedBySTDT).map(r => {
            let value = r.value;
            let threatEvents = [];
            value.map(v => {
                threatEvents = threatEvents.concat(v['data']);
            });
            let link = {
                source: value[0].source,
                target: value[0].target,
                time: value[0].time,
                type: value[0].type,
                data: threatEvents,
                dataCount: threatEvents.length,

            };
            if (link.target === 'combined') {
                if (!link.targetIds) link.targetIds = [];
                link.targetIds.push(link.targetId);
            }
            return link;
        });

        function getTargetsOfUnknownOnly(data) {
            let targetsOfOthers = _.uniq(data.filter(d => d[COL_SOURCE_ADDRESS] !== 'unknown').map(d => d[COL_DESTINATION_ADDRESS]));
            let targetsOfUnknown = _.uniq(data.filter(d => d[COL_SOURCE_ADDRESS] === 'unknown').map(d => d[COL_DESTINATION_ADDRESS]));
            let targetsOfUnknownOnly = _.difference(targetsOfUnknown, targetsOfOthers);
            return targetsOfUnknownOnly;
        }

        //</editor-fold>

        const timeArcSettings = getTimeArcSettings(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, linkTypes, linkTypeColor, nodeColor, linkStrokeWidthScale, colorColumns, colors, formatColumns, formats);
        drawTimeArc(timeArcG, tgoNodes, tgoLinks, timeArcSettings);
        //Reset it when clicking on the svg
        document.onclick = () => {
            keep = !keep;
            resetBrushing(timeArcSettings.transition.duration);
        };

    });
}
else {
    d3.text(fileName).then(data => {
        let day = 'Apr 11, 2014 ';
        let cols = ["duration", "service", "source_bytes", "destination_bytes", "count", "same_srv_rate", "serror_rate", "srv_serror_rate", "dst_host_count",
            "dst_host_srv_count", "dst_host_same_src_port_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "flag", "ids_detection", "malware_detection",
            "ashula_detection", "label", "source_ip_address", "source_port_number", "destination_ip_address", "destination_port_number", "start_time", "protocol"];
        data = d3.tsvParseRows(data);
        data = data.map(d => {
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

        //Display first 1 hour
        data = data.filter(d => d[COL_TIME] <= new Date(day + '00:45:00'));

        //<editor-fold desc="This section is about link type and node type colors">
        let typeColorObj = {
            '1': 'green',
            '-1': 'steelblue',
            '-2': 'red'
        };

        let linkTypeColor = getLinkTypeColor(typeColorObj);
        let linkLegendData = [
            {value: "1", text: "safe"},
            {value: "-1", text: "known threat"},
            {value: "-2", text: "unknown threat"}
        ];
        drawNodeLegends(legendG);
        drawLinkLegends(legendG, linkLegendData, linkTypeColor);

        function getLinkTypeColor(linkTypeColorObj) {
            return function (type) {
                return linkTypeColorObj[type];
            }
        }
        let nodeTypeColor = function nodeTypeColor(value) {
            return 'black';
        };
        //</editor-fold>


        //<editor-fold desc="This section is to calculate the nodes and links for the Network">
        let {nodes, links, timedNodes, timedLinks} = getLinksGroupedByFanInOut(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, [COL_LINK_TYPE], COL_TIME);

        //</editor-fold>

        let {linkTypes, colorColumns, colors, formatColumns, formats, linkStrokeWidthScale, networkSettings} = getNetworkSettings(data, links, COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, linkTypeColor, nodeTypeColor);

        hideLoader();
        drawNetworkGraph(networkG, nodes, links, networkSettings);


        const timeArcSettings = getTimeArcSettings(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, linkTypes, linkTypeColor, nodeTypeColor, linkStrokeWidthScale, colorColumns, colors, formatColumns, formats);
        drawTimeArc(timeArcG, timedNodes, timedLinks, timeArcSettings);
        //Reset it when clicking on the svg
        document.onclick = () => {
            keep = !keep;
            resetBrushing(timeArcSettings.transition.duration);
        };


    });
}

function getNetworkSettings(data, links, COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, COL_TIME, linkTypeColor, nodeTypeColor) {
    let linkTypes = Array.from(new Set(links.map(l => l['type'])));
    //Data for the table
    let colorColumns = [COL_LINK_TYPE, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS],
        colors = [linkTypeColor, nodeTypeColor, nodeTypeColor],
        formatColumns = [COL_TIME],
        formats = [d3.timeFormat("%b %d %Y %H:%M:%S")];

    //Setup data for the network
    function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.dataCount))).range([minWidth, maxWidth]);
        return function (dataCount) {
            return scale(dataCount);
        }
    }

    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, nwMinStrokeWidth, nwMaxStrokeWidth);
    const networkSettings = {
        margin:{
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
        linkStrokeWidthScale: linkStrokeWidthScale,
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
        linkStrokeWidthScale,
        nodeColor: nodeTypeColor,
        networkSettings
    };
}

function getTimeArcSettings(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, linkTypes, linkTypeColor, nodeTypeColor, linkStrokeWidthScale, colorColumns, colors, formatColumns, formats) {
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