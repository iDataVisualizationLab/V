const legendSettings = {
    titleMargin: {
        left: 40,
        top: 30
    },
    margin: {
        left: 60,
        top: 50
    },
    width: 314,
    height: 116,
    nodeRadius: 8,
    itemHeight: 18,
    itemWidth: 200,
    linkSize: 16,
    linkStrokeWidth: 2,
    titleHeight: 10,
    titleFontSize: 16,
};
let nodeColors = {
    'Person': 'black',
    'Product': 'purple',
    'Document': 'magenta',
    'Financial': 'gray',
    'Country': 'blue'
};

//<editor-fold desc="this section is for scaling">

let nodeActionColors = {
    'Email': 'purple',
    'Phone': 'steelblue',
    'Sell': 'black',
    'Buy': 'green',
    'Author': 'magenta',
    'Financial': 'steelblue',
    'Travels': 'blue'
};
let actionCodesToActions = {0: 'Email', 1: 'Phone', 2: 'Sell', 3: 'Buy', 4: 'Author', 5: 'Financial', 6: 'Travels'}

let nodeTypeCodeToNodeType = {
    1: 'Person',
    2: 'Product',
    3: 'Document',
    4: 'Financial',
    5: 'Country'
};

function actionCodeToColor(actionCode){
    return nodeActionColors[actionCodesToActions[actionCode]];
}

function getActionColor() {
    return function (nodeAction) {
        return nodeActionColors[actionCodesToActions[nodeAction]];
    }
}

function nodeColor(node) {
    return nodeColors[nodeTypeCodeToNodeType[node2Type[node.id]]];
}

//</editor-fold>

function drawNodeLegends(legendG) {
    legendSettings.height = (Math.max(d3.keys(nodeColors).length, d3.keys(nodeActionColors).length) + 1) * legendSettings.itemHeight + legendSettings.titleHeight + legendSettings.titleMargin.top;
    //Add the box.
    legendG.append('rect').attr("width", legendSettings.width).attr("height", legendSettings.height).attr("stroke", "black").attr("fill", 'none').attr("stroke-width", 1.5).attr("rx", '5');
    let legendNodeTitleG = legendG.append('g').attr("transform", `translate(${legendSettings.titleMargin.left},${legendSettings.titleMargin.top})`);
    legendNodeTitleG.selectAll('text').data(['Node Types']).enter().append('text').text(d => d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let legendNodeG = legendG.append('g').attr("transform", `translate(${legendSettings.margin.left}, ${legendSettings.titleHeight + legendSettings.titleMargin.top})`);
    let legendNodeGs = legendNodeG.selectAll('.nodeLegendG').data(d3.entries(nodeColors)).enter().append('g').attr('class', 'nodeLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.itemHeight})`);
    legendNodeGs.append('circle')//Append circles
        .attr('class', 'legendNode')
        .attr('cx', -legendSettings.nodeRadius)
        .attr('cy', legendSettings.itemHeight / 2)
        .attr("r", legendSettings.nodeRadius).attr('fill', d => d.value);
    legendNodeGs.append('text').text(d => d.key).attr('fill', d => nodeColors[d.key]).call(defineLegendText);
}

function drawLinkLegends(legendG, linkLegendData, colorScale) {
    //Draw legend for strokes.
    let linkLegendG = legendG.selectAll(".linkLegend").data([1]).join('g')
        .attr("class", "linkLegend")
        .attr("transform", `translate(${legendSettings.itemWidth}, 0)`);

    let legendLinkTitleG = linkLegendG.selectAll(".legendLinkTitleG").data([1]).join('g')
        .attr("class", "legendLinkTitleG")
        .attr("transform", `translate(${legendSettings.titleMargin.left - legendSettings.margin.left},${legendSettings.titleMargin.top})`);

    legendLinkTitleG.selectAll('text').data(['Edge Types']).join('text').text(d => d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let linkLegendContentG = linkLegendG.selectAll(".linkLegendContentG").data([1])
        .join('g')
        .attr("class", "linkLegendContentG")
        .attr('transform', `translate(0, ${legendSettings.titleHeight + legendSettings.titleMargin.top})`);
    let linkLegendGs = linkLegendContentG.selectAll('.linkLegendG')
        .data(linkLegendData)
        .enter().append('g').attr('class', 'linkLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.itemHeight})`);
    linkLegendGs.append('line')
        .attr('y1', legendSettings.itemHeight / 2).attr("y2", legendSettings.itemHeight / 2)
        .attr("x2", -legendSettings.linkSize)
        .attr('stroke', colorScale)
        .attr("stroke-width", legendSettings.linkStrokeWidth);
    linkLegendGs.append('text').text(d => {
        if (d === '') {
            return 'Empty';
        }
        return actionCodesToActions[d];
    }).attr('fill', colorScale).call(defineLegendText);
}

function defineLegendText(theText) {
    theText
        .attr('x', 2 * legendSettings.nodeRadius)
        .attr('y', legendSettings.itemHeight / 2)
        .attr('alignment-baseline', 'middle');
}
