//<editor-fold desc="This section is for data processing">
function getLinkTypes(data, columns) {
    return Array.from(new Set(data.map(d => columns.map(clm => d[clm]).join(","))));
}

function getLinksByColumns(data, sourceClm, targetClm, typeColumns) {
    let nestKey = nestKeyOfColumns([sourceClm, targetClm].concat(typeColumns));
    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);
    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][sourceClm],
            target: d.values[0][targetClm],
            data: d.values,
            dataCount: d.values.length,
            id: d.key
        };

        let typeData = [];
        typeColumns.forEach(clm => {
            item[clm] = d.values[0][clm];
            typeData.push(d.values[0][clm]);
        });

        item.type = typeData.join(",");
        return item;
    });
    return links;
}

function nestKeyOfColumns(columns) {
    return function (d) {
        return columns.map(clm => d[clm]).join(',');
    }

}

function getLinksByColumnsAtTime(data, sourceClm, targetClm, timeClm, typeColumns) {
    let nestKey = nestKeyOfColumns([sourceClm, targetClm, timeClm].concat(typeColumns));//Also nested by time here since different time we need different link though they are the same for everything

    let nestedBySourceTargetLinkProp = d3.nest().key(nestKey).entries(data);

    let links = nestedBySourceTargetLinkProp.map(d => {
        let item = {
            source: d.values[0][sourceClm],
            target: d.values[0][targetClm],
            data: d.values,
            dataCount: d.values.length,
            id: d.key
        };

        let typeData = [];
        typeColumns.forEach(clm => {
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
        let rows = nestedLinkByNodes[d].map(links => links.data).flat();
        return {
            id: d,
            data: rows,
            dataCount: rows.length
        }
    });
    return nodes;
}

function getAllNodesFromLinksWithCombination(links, combinedNodes) {
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
        let rows = nestedLinkByNodes[d].map(links => links.data).flat();
        return {
            id: d,
            nodes: combinedNodes[d],
            nodeCount: combinedNodes[d].length,
            data: rows,
            dataCount: rows.length
        }
    });
    return nodes;
}
//</editor-fold>

//<editor-fold desc="This section is for the data processing for honey pot">
function getUniqueSourcesAndTargets(data, clmSource, clmTarget) {
    let allSTs = [];
    data.forEach(row => {
        allSTs.push(row[clmSource]);
        allSTs.push(row[clmTarget]);
    });
    return Array.from(new Set(allSTs));
}

function getLinksGroupedByFanInOut(data, clmSource, clmTarget, typeColumns, clmTime) {
    let allNodes = {};
    data.forEach(row => {
        let source = row[clmSource];
        let target = row[clmTarget];
        if (!allNodes[source]) allNodes[source] = {sources: new Set(), targets: new Set()};
        if (!allNodes[target]) allNodes[target] = {sources: new Set(), targets: new Set()};
        if (source !== target) {
            allNodes[source].targets.add(target);
            allNodes[target].sources.add(source);
        } else {
            allNodes[source].hasSelfLoop = true;
        }
    });
    let combinedNodes = {};
    d3.entries(allNodes).forEach(row => {
        let node = row.key;
        let value = row.value;
        let combinedKey = "sources" + Array.from(value.sources).sort() + "targets" + Array.from(value.targets) + "hasSelfLoop" + value.hasSelfLoop;
        if (!combinedNodes[combinedKey]) combinedNodes[combinedKey] = [];
        combinedNodes[combinedKey].push(node);
    });
    //From node value to its combined name (combined + index)
    let nodeToCombinedNode = {};
    let combinedNodeToNodes = {};
    d3.entries(combinedNodes).forEach((row, i) => {
        let newKey = 'combined' +i;
        row.value.forEach(node => {
            nodeToCombinedNode[node] = 'combined' +i;
        });
        combinedNodeToNodes[newKey] = row.value;
    });
    //Loop through each row and generate links.
    let linksObj = {};
    let timedLinksObj = {};
    data.forEach(row => {
        let type = typeColumns.map(clm => row[clm]).join(',');
        let combinedSource = nodeToCombinedNode[row[clmSource]];
        let combinedTarget = nodeToCombinedNode[row[clmTarget]];
        let linkedKey = combinedSource + "," + combinedTarget + "," + type;
        let time = row[clmTime];
        let timedLinkedKey = linkedKey+","+time;
        //For the links without time
        if (!linksObj[linkedKey]) {
            linksObj[linkedKey] = {
                source: combinedSource,
                target: combinedTarget,
                type: type,
                data: [],
                id: linkedKey
            };
        }
        linksObj[linkedKey].data.push(row);
        //For the timed links
        if (!timedLinksObj[timedLinkedKey]) {
            timedLinksObj[timedLinkedKey] = {
                source: combinedSource,
                target: combinedTarget,
                type: type,
                time: time,
                data: [],
                id: timedLinkedKey
            };
        }
        timedLinksObj[timedLinkedKey].data.push(row);
    });

    let links = d3.entries(linksObj).map(r => {
        r.value.dataCount = r.value.data.length;
        return r.value;
    });
    let timedLinks = d3.entries(timedLinksObj).map(r => {
        r.value.dataCount = r.value.data.length;
        return r.value;
    });
    debugger;
    let nodes = getAllNodesFromLinksWithCombination(links, combinedNodeToNodes);
    //Copy the nodes to avoid changing its x, y for the network.
    let timedNodes = nodes.map(n => {
        return Object.assign({}, n);
    });
    return {nodes, links, timedNodes, timedLinks};
}


//</editor-fold>