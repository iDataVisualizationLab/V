//<editor-fold desc="This section is for data processing">
function getLinkTypes(data, columns) {
    return Array.from(new Set(data.map(d => columns.map(clm=>d[clm]).join(","))));
}
function getLinksByColumns(data, sourceClm, targetClm, typeColumns) {
    let nestKey = nestKeyOfColumns([sourceClm, targetClm].concat(typeColumns));
    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);
    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][sourceClm],
            target: d.values[0][targetClm],
            threatEvents: d.values,
            threatCount: d.values.length,
        };

        let typeData = [];
        typeColumns.forEach(clm=>{
            item[clm] = d.values[0][clm];
            typeData.push(d.values[0][clm]);
        });

        item.type = typeData.join(",");
        return item;
    });
    return links;
}
function nestKeyOfColumns(columns){
    return function(d){
        return columns.map(clm=>d[clm]).join(',');
    }

}
function getLinksByColumnsAtTime(data, sourceClm, targetClm, timeClm, typeColumns){
    let nestKey = nestKeyOfColumns([sourceClm, targetClm, timeClm].concat(typeColumns));//Also nested by time here since different time we need different link though they are the same for everything

    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);

    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][sourceClm],
            target: d.values[0][targetClm],
            threatEvents: d.values,
            threatCount: d.values.length,
        };

        let typeData = [];
        typeColumns.forEach(clm=>{
            typeData.push(d.values[0][clm]);
        });
        item.type = typeData.join(",");
        //Add the time property
        item.time = d.values[0][timeClm];
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
//</editor-fold>