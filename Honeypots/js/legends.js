const legendSettings = {
    titleMargin: {
        left: 40,
        top: 30
    },
    margin: {
        left: 60,
        top: 50
    },
    width: 350,
    height: 116,
    nodeRadius: 8,
    itemHeight: 18,
    itemWidth: 200,
    linkSize: 16,
    linkStrokeWidth: 2,
    titleHeight: 10,
    titleFontSize: 16,
}
let nodeColorLegendObj = {
    'inside': 'black',
    'unknown': 'gray',
    'outside': 'red',
};

function drawNodeLegends(legendG) {
    //Add the box.
    legendG.append('rect').attr("width", legendSettings.width).attr("height", legendSettings.height).attr("stroke", "black").attr("fill", 'none').attr("stroke-width", 1.5).attr("rx", '5');
    let legendNodeTitleG = legendG.append('g').attr("transform", `translate(${legendSettings.titleMargin.left},${legendSettings.titleMargin.top})`);
    legendNodeTitleG.selectAll('text').data(['IP Addresses']).enter().append('text').text(d => d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let legendNodeG = legendG.append('g').attr("transform", `translate(${legendSettings.margin.left}, ${legendSettings.titleHeight + legendSettings.titleMargin.top})`);
    let legendNodeGs = legendNodeG.selectAll('.nodeLegendG').data(d3.entries(nodeColorLegendObj)).enter().append('g').attr('class', 'nodeLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.itemHeight})`);
    legendNodeGs.append('circle')//Append circles
        .attr('class', 'legendNode')
        .attr('cx', - legendSettings.nodeRadius)
        .attr('cy', legendSettings.itemHeight / 2)
        .attr("r", legendSettings.nodeRadius).attr('fill', d => d.value);
    legendNodeGs.append('text').text(d => d.key).attr('fill', d => nodeColorLegendObj[d.key]).call(defineLegendText);
}

function drawLinkLegends(legendG, linkLegendData, colorScale) {
    //Draw legend for strokes.
    let linkLegendG = legendG.append('g').attr("transform", `translate(${legendSettings.itemWidth}, 0)`);

    let legendLinkTitleG = linkLegendG.append('g').attr("transform", `translate(${legendSettings.titleMargin.left - legendSettings.margin.left},${legendSettings.titleMargin.top})`);
    legendLinkTitleG.selectAll('text').data(['Device Actions']).enter().append('text').text(d => d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let linkLegendContentG = linkLegendG.append('g').attr('transform', `translate(0, ${legendSettings.titleHeight + legendSettings.titleMargin.top})`);
    let linkLegendGs = linkLegendContentG.selectAll('.linkLegendG')
        .data(linkLegendData)
        .enter().append('g').attr('class', 'linkLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.itemHeight})`);
    linkLegendGs.append('line')
        .attr('y1', legendSettings.itemHeight / 2).attr("y2", legendSettings.itemHeight / 2)
        .attr("x2", -legendSettings.linkSize)
        .attr('stroke', d=>colorScale(d.value))
        .attr("stroke-width", legendSettings.linkStrokeWidth);
    linkLegendGs.append('text').text(d => {
        return d.text;
    }).attr('fill', colorScale).call(defineLegendText);
}

function defineLegendText(theText) {
    theText
        .attr('x', 2 * legendSettings.nodeRadius)
        .attr('y', legendSettings.itemHeight / 2)
        .attr('alignment-baseline', 'middle');
}