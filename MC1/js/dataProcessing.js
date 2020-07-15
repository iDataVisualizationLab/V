const COL_TIME = 'Time',
    COL_ACTION = 'eType',
    COL_SOURCE = 'Source',
    COL_TARGET = 'Target';
//<editor-fold desc="This section is for data processing">
function cleanData(data){
    data = data.filter(d=>d.eType !== "5");
    data.forEach(d => {
        d[COL_TIME] = secondsToDateTime(d[COL_TIME]);
        if (d[COL_SOURCE] === '') {
            d[COL_SOURCE] = 'unknown';
        }
    });
    //Todo: Quick fix, move all the co-authors to the Jan 01, 2025
    data = data.map(d => {
        if (d[COL_TIME].getTime() < startTime.getTime()) {
            d[COL_TIME] = startTime;
        }
        return d;
    })
    return data;
}
function getActions(data) {
    return Array.from(new Set(data.map(d => d[COL_ACTION])));
}
function getLinksByColumns(columns, data) {
    function nestKey(d) {
        let key = d[COL_SOURCE] + "," + d[COL_TARGET] + ",";
        columns.forEach(clm => {
            key += d[clm];
        });
        return key;
    }

    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);

    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][COL_SOURCE],
            target: d.values[0][COL_TARGET],
            threatEvents: d.values,
            threatCount: d.values.length,
        };
        columns.forEach(clm=>{
            item[clm] = d.values[0][clm];
        });
        return item;
    });
    //Order the link element by its type, so that the rare link will stay on top.
    let edgeTypeOrderValues = {}
    d3.nest().key(d=>d[COL_ACTION]).entries(links).forEach(
        d=>{
            edgeTypeOrderValues[d.key] = d.values.length;
        }
    );
    links.sort((l1, l2) => edgeTypeOrderValues[l1[COL_ACTION]] - edgeTypeOrderValues[l2[COL_ACTION]]).reverse();
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
    let targetsOfOthers = _.uniq(data.filter(d=>d[COL_SOURCE] !== 'unknown').map(d=>d[COL_TARGET]));
    let targetsOfUnknown = _.uniq(data.filter(d=>d[COL_SOURCE] === 'unknown').map(d=>d[COL_TARGET]));
    let targetsOfUnknownOnly = _.difference(targetsOfUnknown, targetsOfOthers);
    return targetsOfUnknownOnly;
}
//</editor-fold>
