const optimizingIdx = 0
const pointRadius = 3;
loadData(2, processPredictions, true);

function processPredictions(processedData) {
    const timedData = processedData.data;
    const varScalers = processedData.varScalers;
    //Try to predict the first temperature variable.
    const timeStep = 1;
    const machineIdx = optimizingIdx;
    const predictIdx = 7;
    const y_true = timedData[timeStep][machineIdx][predictIdx];
    let y_pred = timedData[timeStep - 1][machineIdx][predictIdx];

    function invertData(value) {
        if (varScalers[predictIdx]) {
            return varScalers[predictIdx].invert(value);
        } else {
            return value;
        }

    }

    let msg1 = `Baseline true: ${invertData(y_true).toFixed(4)}, pred: ${invertData(y_pred).toFixed(4)}`;

    //Prepare data for predictions
    //Create the data with missing feature
    let missingFeatureData = timedData.map(machineData => machineData.map(featureData => {
        let row = [];
        featureData.forEach((val, i) => {
            if (i !== predictIdx) row.push(val);
        });
        return row;
    }));

    let DData = [];
    //True value
    timedData[timeStep].forEach((machineData, i) => {
        if (i !== machineIdx) {
            DData.push(machineData);
        }
    });
    //Now we will do l PCA for all the points in this time step
    const lData = missingFeatureData[timeStep];
    //Do D-dim projection
    const DDimPCA = new dr.PCA(DData);
    const lDimPCA = new dr.PCA(lData);
    const DProjection = dr.projectToPCs(DDimPCA, DData, 2);
    const lProjection = dr.projectToPCs(lDimPCA, lData, 2);

    //Calculate the Su.
    //Distance of the predicting machine to other machines
    const Su = [];
    lProjection.forEach((projectedData, mIdx) => {
        if (machineIdx !== mIdx) {
            Su.push(distance(projectedData, lProjection[machineIdx]));
        }
    });

    let x = [...lProjection[machineIdx]];//Set the default x to be the l projected.;
    let alpha = 1.0;
    let lr = 0.001;
    let iterations = 5000;
    const {
        alphaOptimized,
        xOptimized,
        losses
    } = dr.projectionOptimizer(Su, x, alpha, DProjection, lr, iterations);
    //Invert it back to original D space using DDimPCA
    const predictedDData = dr.invertToOriginalSpace(DDimPCA, [xOptimized]);

    y_pred = (predictedDData[0][predictIdx]);

    let msg2 = `<br/>PCA Projection prediction ${invertData(y_true).toFixed(4)}, vs ${invertData(y_pred).toFixed(4)}`;

    //Prepare data for visualization
    const DProjectionCopied1 = DProjection.map(machineData => [...machineData]);
    DProjectionCopied1.unshift(x);
    const DProjectionCopied2 = DProjection.map(machineData => [...machineData]);
    DProjectionCopied2.unshift(xOptimized);

    visualizeData(lProjection, DProjectionCopied1, DProjectionCopied1, losses);

    //Now even with perfect information, if we project it back we still lose information
    const AllDDimPCA = new dr.PCA(timedData[timeStep]);
    const AllDProjection = dr.projectToPCs(AllDDimPCA, timedData[timeStep], 2);
    //Invert it back
    const invertedDDimData = dr.invertToOriginalSpace(AllDDimPCA, AllDProjection);
    //Get the predicted value.
    y_pred = invertedDDimData[machineIdx][predictIdx];
    const msg3 = `<br/>Even with known feature, projection from PCA back is: ${invertData(y_pred).toFixed(4)}`;
    const msg4 = `<br/>Original x ${x.map(d => d.toFixed(4))}, optimized x ${xOptimized.map(d => d.toFixed(4))}` +
        `<br/>Original alpha ${alpha.toFixed(4)}, optimized alpha ${alphaOptimized.toFixed(4)}` +
        `<br/>Loss ${losses[losses.length - 1].toFixed(4)}`;
    document.getElementById('msg').innerHTML = msg1 + msg2 + msg3 + msg4;

}

function distance(x, y) {
    return Math.sqrt(d3.sum(x.map((xVal, i) => (xVal - y[i]) * (xVal - y[i]))));
}


function visualizeData(set1, set2, optimizedSet, losses) {
    const plot_margins = {top: 10, right: 10, bottom: 10, left: 10};
    const plotSize = 200;
    const plots = ["plot1", "plot2", "plot3", "plot4"];

    const mainSvg = d3.select("#mainSvg");
    mainSvg
        .attr("width", (plotSize + plot_margins.left + plot_margins.right) * plots.length)
        .attr("height", plotSize + plot_margins.top + plot_margins.bottom);

    mainSvg.selectAll('.plot').data(plots).enter()
        .append("g").attr('class', 'plot')
        .attr('id', d => d).attr('transform', (p, i) => `translate(${plot_margins.left + i * (plot_margins.left + plotSize + plot_margins.right)}, ${plot_margins.top})`)
        .append('rect')
        .attr("x", -plot_margins.left)
        .attr("y", -plot_margins.top)
        .attr("width", plotSize + plot_margins.left + plot_margins.right)
        .attr("height", plotSize + plot_margins.top + plot_margins.bottom)
        .attr("fill", "none")
        .attr("stroke", "black");


    plot_points(d3.select('#plot1'), set1, plotSize, plotSize);
    plot_points(d3.select('#plot2'), set2, plotSize, plotSize);

    //Perform the optimization
    plot_points(d3.select('#plot3'), optimizedSet, plotSize, plotSize);
    plotLosses(d3.select('#plot4'), losses, plotSize, plotSize);

    d3.selectAll('.optimizing').raise();


}

function plot_points(g, points, width, height, color = 'blue') {
    const minX = d3.min(points.map(d => d[0]));
    const maxX = d3.max(points.map(d => d[0]));
    const minY = d3.min(points.map(d => d[1]));
    const maxY = d3.max(points.map(d => d[1]));

    const xScale = d3.scaleLinear().domain([minX, maxX]).range([0, width]);
    const yScale = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
    g.selectAll('.circle').data(points).join('circle')
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr('r', pointRadius)
        .attr('stroke', 'black')
        .attr("fill", (d, i) => i === optimizingIdx ? 'red' : color)
        .attr("class", (d, i) => i === optimizingIdx ? 'optimizing' : 'normal');
}

function plotLosses(g, losses, width, height) {
    const minX = 0;
    const maxX = losses.length;
    const minY = d3.min(losses);
    const maxY = d3.max(losses);
    const xScale = d3.scaleLinear().domain([minX, maxX]).range([0, width]);
    const yScale = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);

    g.append('path')
        .datum(losses)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line().x((d, i) => xScale(i)).y((d) => yScale(d)));
}
