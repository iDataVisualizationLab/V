const pointRadius = 3;
loadData(10, visualizeData, false);

function visualizeData(processedData) {
    const copiedData = processedData.data;
    //Sizing
    const plotMargins = {top: 10, right: 10, bottom: 10, left: 10};
    const svgWidth = window.innerWidth;
    const plotWidth = svgWidth / (copiedData.length) - plotMargins.left - plotMargins.right;
    const plotHeight = plotWidth;
    const svgHeight = 2 * (plotHeight + plotMargins.top + plotMargins.bottom);
    const mainSvg = d3.select("#mainSvg");
    mainSvg
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    //Project data
    const projectedData = copiedData.map((timeStepData) => {
        const pca = new dr.PCA(timeStepData);
        const pCs = dr.projectToPCs(pca, timeStepData, 2);
        return pCs;
    });

    //Now create the scalers
    const xDomain = d3.extent(projectedData.flat().map(d => d[0]));
    const yDomain = d3.extent(projectedData.flat().map(d => d[1]));
    const xScale = d3.scaleLinear().domain(xDomain).range([0, plotWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([plotHeight, 0]);


    //Draw the projected data.
    const projectedG = mainSvg.append('g');
    projectedG.selectAll('.projectedPlot').data(projectedData).enter().append('g')
        .attr('transform', (d, i) => `translate(${plotMargins.left + i * (plotWidth + plotMargins.left + plotMargins.right)}, 0)`)
        .attr("id", (d, i) => `projectedPlot${i}`);
    projectedData.forEach((timeStepData, i) => {
        plotPoints(d3.select(`#projectedPlot${i}`), timeStepData, xScale, yScale, plotWidth, plotHeight);
    });

    //Now do the adjustment
    let adjustedData = []
    adjustedData[0] = projectedData[0];//Keep the first time step
    const ids1 = [], ids2 = [];
    for (let i = 0; i < projectedData.length; i++) {
        ids1.push(i);
        ids2.push(i);
    }
    for (let timeStep = 1; timeStep < projectedData.length; timeStep++) {
        const set1 = adjustedData[timeStep - 1];
        const set2 = projectedData[timeStep];
        const pt = new dr.ProcrustestTransformation(set1, set2, ids1, ids2);
        adjustedData.push(pt.translatedResult());
    }
    //Draw the adjusted data
    const adjustedG = mainSvg.append('g').attr('transform', `translate(0, ${plotHeight + plotMargins.top + plotMargins.left})`);
    adjustedG.selectAll('.adjustedPlot').data(adjustedData).enter().append('g')
        .attr('transform', (d, i) => `translate(${plotMargins.left + i * (plotWidth + plotMargins.left + plotMargins.right)}, 0)`)
        .attr("id", (d, i) => `adjustedPlot${i}`);
    adjustedData.forEach((timeStepData, i) => {
        plotPoints(d3.select(`#adjustedPlot${i}`), timeStepData, xScale, yScale, plotWidth, plotHeight);
    });

}

function plotPoints(g, points, xScale, yScale, width, height, color = 'blue') {
    g.selectAll('.circle').data(points).join('circle')
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr('r', pointRadius)
        .attr('stroke', 'black')
        .attr("fill", color)
        .attr("fill-opacity", 0.3);
}

