async function loadModel(path) {
    //Load model
    let model = await tf.loadLayersModel(path, {strict: false});
    return model;
}

//Note: must call this before the drawEvaluations method, to make sure that the orders of the scores are not changed yet.
async function findTop10Differences(arrActual, arrPredicted) {
    let numOfScores = arrActual.length;
    let numOfItems = arrActual[0].length;
    let distances = [];
    for (let itemIdx = 0; itemIdx < numOfItems; itemIdx++) {
        let distance = 0;
        for (let scoreIdx = 0; scoreIdx < numOfScores; scoreIdx++) {
            let actualScore = arrActual[scoreIdx][itemIdx];
            let predictedScore = arrPredicted[scoreIdx][itemIdx];
            distance += (actualScore - predictedScore) * (actualScore - predictedScore);
        }
        distances.push(Math.sqrt(distance));
    }
    let sortedIdxs = argsort(distances);
    return sortedIdxs.slice(sortedIdxs.length - 10, sortedIdxs.length).reverse();//Reverse since we need to display the most different first.
}

async function drawTop10Differences(itemIdxs) {
    drawTop10Items("top10differences", itemIdxs);
}

async function findTop10DifferencesEachType(arrActual, arrPredicted) {
    let top10DifferencesEachType = [];
    arrActual.forEach((actualValues, scoreIdx) => {
        let predictedValues = arrPredicted[scoreIdx];
        let scoreDiffs = actualValues.map((actual, itemIdx) => Math.abs(actual - predictedValues[itemIdx]));
        let sortedIdxs = argsort(scoreDiffs);
        top10DifferencesEachType.push(sortedIdxs.slice(sortedIdxs.length - 10, sortedIdxs.length).reverse());//Reverse since we need to display the most different first.
    });
    return top10DifferencesEachType;
}

function drawTop10Items(containerId, itemIdxs) {
    let container = d3.select(`#${containerId}`);

    container.selectAll(".top10differencesforeach").data(itemIdxs, d => d).join("div").classed("cnnDataItem", true)
        .style("display", "inline")
        .style("margin-left", imageMargins.left + "px")
        .attr("name", d => `item${d}`).each(function () {
        let theItemOriginalIdx = d3.select(this).datum();
        let imgData = convertBlackToWhite(XArr[theItemOriginalIdx]);
        let imgts = tf.tidy(() => tf.tensor(imgData, [40, 40, 1]));
        renderImage(this, imgts, {width: imageSize, height: imageSize});
        imgts.dispose();
    })
        .on("mouseover", (d) => {
            let theItemOriginalIdx = d;
            highlightItem(theItemOriginalIdx);


        });
}

async function drawTop10DifferencesEachType(top10DifferencesEachType) {
    top10DifferencesEachType.forEach((itemIdxs, scoreIdx) => {
        let scoreType = typeList[scoreIdx];
        let containerId = `top10differences${scoreType}`;
        d3.select(`#scoreDiv${scoreType}`).append("div").attr("id", containerId)
            .style("float", "left")
            .style("margin-top", imageMargins.top + "px");

        drawTop10Items(containerId, itemIdxs);
    });
}

async function drawEvaluations(arrActual, arrPredicted) {
    //Copy to make sure that we don't modify the original data unnecessarily.
    let arrActualCopied = arrActual.map(score => score.slice());
    let arrPredictedCopied = arrPredicted.map(score => score.slice());
    let noOfItems = arrActualCopied[0].length;
    let xSeries = Array.from(new Array(noOfItems), (_, i) => i);
    //Use only one yScale ranging from 0 to 1
    let yScale = d3.scaleLinear().domain([0, 1]).range([predictionChartHeight - lineChartPaddings.paddingTop - lineChartPaddings.paddingBottom, 0]);
    //Append div for the plots if they are not there.
    d3.selectAll(".scoreDiv").append("div").classed("predictionGraph", true).attr("id", d => "prediction" + d)
        .style("float", "left");

    arrActualCopied.forEach((actualValues, scoreIdx) => {
        let orderIdxs = argsort(actualValues);
        allPredictionGraphsOrder[scoreIdx] = orderIdxs;
        actualValues.sort((a, b) => a - b);
        let predictedValues = orderIdxs.map(val => arrPredictedCopied[scoreIdx][val]);

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
            width: predictionChartWidth,
            height: predictionChartHeight,
            eventHandlers: {
                "click": (mouseInfo) => {
                    let theItemIdx = mouseInfo.closestPointIdx;
                    let theItemOriginalIdx = allPredictionGraphsOrder[scoreIdx][theItemIdx];
                    if (investigatingItems.has(theItemOriginalIdx)) {
                        investigatingItems.delete(theItemOriginalIdx);
                    } else {
                        investigatingItems.add(theItemOriginalIdx);
                    }

                    let cnn = d3.select("#CNN").selectAll(".cnnDataItem").data(Array.from(investigatingItems), d => d);
                    let enterItems = cnn.enter();
                    enterItems.append("div").classed("cnnDataItem", true).style("display", "inline").attr("id", d => `item${d}`).each(function () {
                        let imgData = convertBlackToWhite(XArr[theItemOriginalIdx]);
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
                    let theItemOriginalIdx = allPredictionGraphsOrder[scoreIdx][theItemIdx];
                    highlightItem(theItemOriginalIdx);
                    //Show tip for the item.

                },
                "mouseout": (mouseInfo) => {
                    allPredictionGraphs.forEach(pg => pg.highlightMarkers([], 1.0, 1.0));
                }
            },
            title: {
                text: `${typeList[scoreIdx]}, mse = ${mse.dataSync()[0].toFixed(3)}, mae = ${mae.dataSync()[0].toFixed(3)}`,
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
        let lc = new LineChart(document.getElementById(`prediction${typeList[scoreIdx]}`), lineChartData, lineChartSettings);
        lc.plot();
        allPredictionGraphs[scoreIdx] = lc;
    });
}


async function renderImage(container, tensor, imageOpts) {
    const resized = tf.tidy(() => tf.image.resizeNearestNeighbor(tensor, [imageOpts.height, imageOpts.width]).clipByValue(0.0, 1.0));
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    canvas.width = imageOpts.width;
    canvas.height = imageOpts.height;
    canvas.style = `width:${imageOpts.width}px; height:${imageOpts.height}px; border: 1px solid silver;`;
    container.appendChild(canvas);
    await tf.browser.toPixels(resized, canvas);
    resized.dispose();
}

async function highlightItem(theItemOriginalIdx) {
    allPredictionGraphs.forEach((pg, idx) => pg.highlightMarkers([[allPredictionGraphsOrder[idx].indexOf(theItemOriginalIdx)], [allPredictionGraphsOrder[idx].indexOf(theItemOriginalIdx)]],
        1.0, 0.05));
    //Also highlight the in the scatter plot view too.
    d3.selectAll(".cnnDataItem").each(function () {
        let thisItem = d3.select(this);
        if (thisItem.datum() === theItemOriginalIdx) {
            thisItem.select("canvas").style('border', '1px solid red');
        } else {
            thisItem.select("canvas").style('border', '1px solid silver');
        }
    });
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

