async function loadModel(path) {
    //Load model
    let model = await tf.loadLayersModel(path, {strict: false});
    return model;
}

async function drawEvaluations(arrActual, arrPredicted) {
    let predictionChartWidth = (contentWidth / 2 - 20); //-20 is for the two padding left and right
    let noOfItems = arrActual[0].length;
    let xSeries = Array.from(new Array(noOfItems), (_, i) => i);
    //Use only one yScale ranging from 0 to 1
    let yScale = d3.scaleLinear().domain([0, 1]).range([predictionChartHeight-lineChartPaddings.paddingTop - lineChartPaddings.paddingBottom, 0]);
    //Append div for the plots if they are not there.
    d3.select("#predictions").selectAll(".predictionGraph").data(typeList).join("div").classed("predictionGraph", true)
        .attr("id", type => `prediction${type}`).style("width", `${predictionChartWidth}px`).style("height", `${predictionChartHeight}px`);

    arrActual.forEach((actualValues, i) => {
        let orderIdxs = argsort(actualValues);
        allPredictionGraphsOrder[i] = orderIdxs;
        actualValues.sort((a, b) => a - b);
        let predictedValues = orderIdxs.map(val => arrPredicted[i][val]);
        let mse = tf.tidy(() => tf.metrics.meanSquaredError(actualValues, predictedValues));
        let mae = tf.tidy(() => tf.metrics.meanAbsoluteError(actualValues, predictedValues));

        let lineChartData = [
            {
                x: xSeries,
                y: actualValues,
                series: "Actual",
                marker: "x",
                type: "scatter"
            },
            {
                x: xSeries,
                y: predictedValues,
                series: "Predicted",
                marker: "o",
                type: "scatter"
            }
        ];

        //LineChart settings
        let lineChartSettings = {
            noSvg: false,
            showAxes: true,
            paddingLeft: lineChartPaddings.paddingLeft,
            paddingRight: lineChartPaddings.paddingRight,
            paddingTop: lineChartPaddings.paddingTop,
            paddingBottom: lineChartPaddings.paddingBottom,
            yScale: yScale,
            highlightWithBar: false,
            eventHandlers: {
                "click": (mouseInfo) => {
                    let theItemIdx = mouseInfo.closestPointIdx;
                    let theItemOriginalIdx = allPredictionGraphsOrder[i][theItemIdx];
                    if (investigatingItems.has(theItemOriginalIdx)) {
                        investigatingItems.delete(theItemOriginalIdx);
                    } else {
                        investigatingItems.add(theItemOriginalIdx);
                    }

                    let cnn = d3.select("#CNN").selectAll(".cnnDataItem").data(Array.from(investigatingItems), d => d);
                    let enterItems = cnn.enter();
                    enterItems.append("div").classed("cnnDataItem", true).attr("id", d => `item${d}`).each(function () {
                        let theIdx = d3.select(this).datum();
                        let imgData = convertBlackToWhite(XArr[theIdx]);
                        let imgts = tf.tidy(() => tf.tensor(imgData, [40, 40, 1]));
                        renderImage(this, imgts, {width: imageSize, height: imageSize});
                        imgts.dispose();
                    })
                        .on("mouseover", () => {
                            highlightItem(theItemOriginalIdx);
                        });
                    cnn.exit().remove();
                },
                "mousemove": (mouseInfo) => {
                    let theItemIdx = mouseInfo.closestPointIdx;
                    let theItemOriginalIdx = allPredictionGraphsOrder[i][theItemIdx];
                    highlightItem(theItemOriginalIdx);
                },
                "mouseout": (mouseInfo) => {
                    allPredictionGraphs.forEach(pg => pg.highlightMarkers([], 1.0, 1.0));
                }
            },
            title: {
                text: `${typeList[i]}, mse = ${mse.dataSync()[0].toFixed(3)}, mae = ${mae.dataSync()[0].toFixed(3)}`,
                x: lineChartPaddings.paddingLeft + 10,
                y: lineChartPaddings.paddingTop,
                alignmentBaseline: "hanging",
                textAnchor: "start"
            },
        };
        //Clean the mse
        mse.dispose();
        mae.dispose();
        //Change color scheme to category 10
        lineChartSettings.colorScale = d3.scaleOrdinal()
            .domain(lineChartData.map(ld => ld.series))
            .range(lineChartData.map((_, i) => {
                return d3.schemeCategory10[i];
            }));
        let lc = new LineChart(document.getElementById(`prediction${typeList[i]}`), lineChartData, lineChartSettings);
        lc.plot();
        allPredictionGraphs[i] = lc;
    });
}


async function renderImage(container, tensor, imageOpts) {
    const resized = tf.tidy(() => tf.image.resizeNearestNeighbor(tensor, [imageOpts.height, imageOpts.width]).clipByValue(0.0, 1.0));
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    canvas.width = imageOpts.width;
    canvas.height = imageOpts.height;
    canvas.style = `margin: 4px; width:${imageOpts.width}px; height:${imageOpts.height}px; border: 1px solid silver;`;
    container.appendChild(canvas);
    await tf.browser.toPixels(resized, canvas);
    resized.dispose();
}

async function highlightItem(theItemOriginalIdx) {
    allPredictionGraphs.forEach((pg, idx) => pg.highlightMarkers([[allPredictionGraphsOrder[idx].indexOf(theItemOriginalIdx)], [allPredictionGraphsOrder[idx].indexOf(theItemOriginalIdx)]],
        1.0, 0.05));
}

function convertBlackToWhite(imgData) {
    let newData = [];
    for (let i = 0; i < imgData.length; i++) {
        newData[i] = [];
        for (let j = 0; j < imgData[i].length; j++) {
            newData[i][j] = 1 - imgData[i][j];
        }
    }
    return newData;
}

function getActivation(input, model, layer) {
    const activationModel = tf.model({
        inputs: model.input,
        outputs: layer.output
    });
    return activationModel.predict(input);
}
