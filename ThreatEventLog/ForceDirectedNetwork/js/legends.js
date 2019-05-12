let nodeColorLegendObj = {
    'inside': 'steelblue',
    'unknown': 'gray',
    'outside': 'red'
};

function drawNodeLegends(legendG) {
    let legendNodeG = legendG.append('g');
    let legendNodeGs = legendNodeG.selectAll('.nodeLegendG').data(d3.entries(nodeColorLegendObj)).enter().append('g').attr('class', 'nodeLegendG').attr("transform", (d, i) => `translate(${0}, ${i * networkSettings.legend.height})`);
    legendNodeGs.append('circle')//Append circles
        .attr('class', 'legendNode')
        .attr('cx', -networkSettings.legend.nodeRadius + 2)
        .attr('cy', networkSettings.legend.height / 2)
        .attr("r", networkSettings.legend.nodeRadius).attr('fill', d => d.value);
    legendNodeGs.append('text').text(d => d.key + " IPs").call(defineLegendText);
}

function drawLinkLegends(legendG, linkLegendData, colorScale) {
    //Draw legend for strokes.
    let linkLegendG = legendG.append('g').attr("transform", `translate(0, ${networkSettings.legend.height * d3.entries(nodeColorLegendObj).length})`);
    let linkLegendGs = linkLegendG.selectAll('.linkLegendG')
        .data(linkLegendData)
        .enter().append('g').attr('class', 'linkLegendG').attr("transform", (d, i) => `translate(${0}, ${i * networkSettings.legend.height})`);
    linkLegendGs.append('line')
        .attr('y1', networkSettings.legend.height / 2).attr("y2", networkSettings.legend.height / 2)
        .attr("x2", -networkSettings.legend.linkSize)
        .attr('stroke', colorScale)
        .attr("stroke-width", networkSettings.legend.linkStrokeWidth);
    linkLegendGs.append('text').text(d => {
        if (d === '') {
            return 'Empty';
        }
        return d;
    }).call(defineLegendText);
}

function defineLegendText(theText) {
    theText.attr('x', 2 * networkSettings.legend.nodeRadius)
        .attr('y', networkSettings.legend.height / 2)
        .attr('alignment-baseline', 'middle')
}

//Now move the legend group to the center.
//     legendG.attr("transform", `translate(${svgWidth - margin.right}, ${(svgHeight - (d3.entries(nodeColorLegendObj).length + deviceActions.length) * networkSettings.legend.height) / 2})`);