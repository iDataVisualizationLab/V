const legendSettings = {
    margin:{
        left: 60
    },
    nodeRadius: 8,
    height: 18,
    width: 150,
    linkSize: 16,
    linkStrokeWidth: 2,
    titleHeight: 10,
    titleFontSize: 16
}
let nodeColorLegendObj = {
    'inside': 'black',
    'unknown': 'gray',
    'outside': 'red',
};

function drawNodeLegends(legendG) {
    let legendNodeTitleG = legendG.append('g');
    legendNodeTitleG.selectAll('text').data(['IP Addresses']).enter().append('text').text(d=>d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let legendNodeG = legendG.append('g').attr("transform", `translate(0, ${legendSettings.titleHeight})`);
    let legendNodeGs = legendNodeG.selectAll('.nodeLegendG').data(d3.entries(nodeColorLegendObj)).enter().append('g').attr('class', 'nodeLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.height})`);
    legendNodeGs.append('circle')//Append circles
        .attr('class', 'legendNode')
        .attr('cx', -legendSettings.nodeRadius + 2)
        .attr('cy', legendSettings.height / 2)
        .attr("r", legendSettings.nodeRadius).attr('fill', d => d.value);
    legendNodeGs.append('text').text(d => d.key).attr('fill', d=>nodeColorLegendObj[d.key]).call(defineLegendText);
}

function drawLinkLegends(legendG, linkLegendData, colorScale) {
    //Draw legend for strokes.
    let linkLegendG = legendG.append('g').attr("transform", `translate(${legendSettings.width}, 0)`);
    //.attr("transform", `translate(0, ${legendSettings.height * d3.entries(nodeColorLegendObj).length + 3*legendSettings.titleHeight})`);

    let legendLinkTitleG = linkLegendG.append('g');
    legendLinkTitleG.selectAll('text').data(['Device Actions']).enter().append('text').text(d=>d).style('font-size', legendSettings.titleFontSize).style('font-weight', 'bold');

    let linkLegendContentG = linkLegendG.append('g').attr('transform', `translate(0, ${legendSettings.titleHeight})`);
    let linkLegendGs = linkLegendContentG.selectAll('.linkLegendG')
        .data(linkLegendData)
        .enter().append('g').attr('class', 'linkLegendG').attr("transform", (d, i) => `translate(${0}, ${i * legendSettings.height})`);
    linkLegendGs.append('line')
        .attr('y1', legendSettings.height / 2).attr("y2", legendSettings.height / 2)
        .attr("x2", -legendSettings.linkSize)
        .attr('stroke', colorScale)
        .attr("stroke-width", legendSettings.linkStrokeWidth);
    linkLegendGs.append('text').text(d => {
        if (d === '') {
            return 'Empty';
        }
        return d;
    }).attr('fill', colorScale).call(defineLegendText);
}

function defineLegendText(theText) {
    theText
        .attr('x', 2 * legendSettings.nodeRadius)
        .attr('y', legendSettings.height / 2)
        .attr('alignment-baseline', 'middle');
}

//Now move the legend group to the center.
//     legendG.attr("transform", `translate(${svgWidth - margin.right}, ${(svgHeight - (d3.entries(nodeColorLegendObj).length + deviceActions.length) * legendSettings.height) / 2})`);