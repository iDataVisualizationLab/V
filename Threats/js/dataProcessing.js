const COL_END_TIME = 'End Time',
    COL_DEVICE_ACTION = 'Device Action',
    COL_SOURCE_ADDRESS = 'Source Address',
    COL_DESTINATION_ADDRESS = 'Destination Address';
//<editor-fold desc="This section is for data processing">
function getDeviceActions(data) {
    return Array.from(new Set(data.map(d => d[COL_DEVICE_ACTION])));
}
function getLinksByColumns(columns, data) {
    function nestKey(d) {
        let key = d[COL_SOURCE_ADDRESS] + "," + d[COL_DESTINATION_ADDRESS] + ",";
        columns.forEach(clm => {
            key += d[clm];
        });
        return key;
    }

    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);

    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][COL_SOURCE_ADDRESS],
            target: d.values[0][COL_DESTINATION_ADDRESS],
            threatEvents: d.values,
            threatCount: d.values.length,
        };
        columns.forEach(clm=>{
            item[clm] = d.values[0][clm];
        });
        return item;
    });
    return links;
}

function getAllNodesFromLinks(links) {
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
        return {
            id: d,
            linkCount: d3.sum(nestedLinkByNodes[d].map(links => links.threatCount))
        }
    });
    return nodes;
}

function getTargetsOfUnknownOnly(data){
    let targetsOfOthers = _.uniq(data.filter(d=>d[COL_SOURCE_ADDRESS] !== 'unknown').map(d=>d[COL_DESTINATION_ADDRESS]));
    let targetsOfUnknown = _.uniq(data.filter(d=>d[COL_SOURCE_ADDRESS] === 'unknown').map(d=>d[COL_DESTINATION_ADDRESS]));
    let targetsOfUnknownOnly = _.difference(targetsOfUnknown, targetsOfOthers);
    return targetsOfUnknownOnly;
}
//</editor-fold>