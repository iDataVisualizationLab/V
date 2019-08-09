const mapObjects = {};
let trainRULOrder;
let testRULOrder;
//Read data
d3.json("data/train_FD001_100x50.json").then(X_train => {
    d3.json("data/train_RUL_FD001_100x50.json").then(y_train => {
        d3.json("data/test_FD001_100x50.json").then(X_test => {
            d3.json("data/test_RUL_FD001_100x50.json").then(y_test => {
                //Draw color scales
                const colorBarW = 100;
                const colorBarH = 10;
                let flattenedZ = X_train.flat().flat();
                let minZ = d3.min(flattenedZ);
                let maxZ = d3.max(flattenedZ);
                let avgZ = (maxZ - minZ) / 2 + minZ;
                let inputColorScale = d3.scaleLinear()
                    .domain([minZ, avgZ, maxZ])
                    .range(["#0877bd", "#e8eaeb", "#f59322"])
                    .clamp(true);
                plotColorBar(d3.select("#inputColorScale"), inputColorScale, "inputColorBar", colorBarW, colorBarH, "horizon");

                let lstm1ColorScale = d3.scaleLinear()
                    .domain([0, 0.5, 1])
                    .range(["#0877bd", "#e8eaeb", "#f59322"])
                    .clamp(true);
                plotColorBar(d3.select("#lstm1ColorScale"), lstm1ColorScale, "lstm1ColorScale", colorBarW, colorBarH, "horizon");
                plotColorBar(d3.select("#lstm2ColorScale"), lstm1ColorScale, "lstm2ColorScale", colorBarW, colorBarH, "horizon");

                const inputShape = [X_train[0].length, X_train[0][0].length];
                createModel(16, 8, 8, 4, inputShape).then(model => {
                    trainModel(model, X_train, y_train, X_test, y_test);
                });
            });
        });

    });
});

async function tensor2DToArray2DAsync(ts) {
    return new Promise((resolve, reject) => {
        let noOfItems = ts.shape[0];
        let noOfFeatures = ts.shape[1];
        let itemSize = noOfFeatures;
        let result = [];
        let data = ts.dataSync();
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            let theItemIdx = itemIdx * itemSize;
            let item = data.slice(theItemIdx, theItemIdx + noOfFeatures);
            result.push(item);
        }
        resolve(result);
    });
}

async function tensor3DToArray3DAsync(ts) {
    return new Promise((resolve, reject) => {
        let noOfItems = ts.shape[0];
        let noOfSteps = ts.shape[1];
        let noOfFeatures = ts.shape[2];
        let itemSize = noOfSteps * noOfFeatures;
        let result = [];
        let data = ts.dataSync();
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            let item = [];
            for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
                let theStepIdx = itemIdx * itemSize + stepIdx * noOfFeatures;
                let step = data.slice(theStepIdx, theStepIdx + noOfFeatures);
                item.push(step);
            }
            result.push(item);
        }
        resolve(result);
    });
}

async function drawHeatmaps(data, container, selector) {
    let noOfItems = data.length;
    let noOfSteps = data[0].length;
    let noOfFeatures = data[0][0].length;
    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i);
    //Generate div for the inputs
    d3.select(`#${container}`).selectAll(`.${selector}`).data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter().append("div").attr("class", selector).attr("id", d => selector + d).style("margin-top", "10px").style("margin-bottom", "0px").style("border", "1px solid black").style("display", "inline-block");
    //Generate data.
    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let z = [];
        for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
            let row = [];
            for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
                row.push(data[itemIdx][stepIdx][featureIdx])
            }
            z.push(row);
        }
        if (!mapObjects[selector + featureIdx]) {
            //Draw the feature.
            let hm = new HeatMap(document.getElementById(selector + featureIdx), {x: x, y: y, z: z}, {
                noSvg: true,
                showAxes: false,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                borderWidth: 0,
                width: 100,
                height: 100
            });
            hm.plot();
            mapObjects[selector + featureIdx] = hm;
        } else {
            let hm = mapObjects[selector + featureIdx];
            hm.update({x: x, y: y, z: z})
        }

    }
}

async function drawLineCharts(data, normalizer, target, container, selector, lineChartSettings, noBorder) {
    let noOfItems = data.length;
    let noOfFeatures = data[0].length;
    //Generate steps
    let y = Array.from(Array(noOfItems), (yV, i) => i);
    //Generate div for the inputs
    let elms = d3.select(`#${container}`).selectAll(`.${selector}`).data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter().append("div").attr("class", selector).attr("id", d => selector + d).style("margin-top", "10px");
    if (typeof noBorder === 'undefined' || !noBorder) {
        elms.style("border", "1px solid black").style("display", "inline-block");
    }
    //Generate data.
    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let x = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            x.push(data[itemIdx][featureIdx]);
        }
        x = normalizer ? normalizer(x, -1.0, 1.0) : x;
        const lineChartData = [
            {
                x: x,
                y: y,
                series: 'output',
                marker: 'o',
                type: 'scatter'
            },
            {
                x: target,
                y: y,
                series: 'target',
                marker: 'x',
                type: 'scatter'
            }
        ];
        if (!mapObjects[selector + featureIdx]) {
            //Draw the feature.
            let lc = new LineChart(document.getElementById(selector + featureIdx), lineChartData, lineChartSettings);
            lc.plot();
            mapObjects[selector + featureIdx] = lc;
        } else {
            let lc = mapObjects[selector + featureIdx];
            lc.update(lineChartData);
        }

    }
}

function createModel(lstm1Nodes, lstm2Nodes, dense1Nodes, dense2Nodes, inputShape) {
    return new Promise((resolve, reject) => {
        const model = tf.sequential({
            layers: [
                tf.layers.lstm({
                    inputShape: inputShape,
                    units: lstm1Nodes,
                    returnSequences: true,
                    // kernelRegularizer: tf.regularizers.l2(0.01)
                }),
                tf.layers.lstm({
                    units: lstm2Nodes,
                    returnSequences: true,
                    // kernelRegularizer: tf.regularizers.l2(0.01)
                }),
                tf.layers.flatten(),
                tf.layers.dense({
                    units: dense1Nodes,
                    activation: 'relu',
                    // kernelRegularizer: tf.regularizers.l2(0.01)
                }),
                tf.layers.dense({
                    units: dense2Nodes,
                    activation: 'relu',
                    // kernelRegularizer: tf.regularizers.l2(0.01)
                }),
                tf.layers.dense({units: 1, activation: 'relu'})
            ]
        });
        model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError',
        });
        resolve(model);
    });
}


async function trainModel(model, X_train, y_train, X_test, y_test) {
    let X_train_T = tf.tensor(X_train);
    let y_train_T = tf.tensor(y_train);
    let X_test_T = tf.tensor(X_test);
    let y_test_T = tf.tensor(y_test);

    //We build the sorting order.
    trainRULOrder = Array.from(y_train, (val, i) => i);
    trainRULOrder = trainRULOrder.sort((a, b) => y_train[a] - y_train[b]);
    testRULOrder = Array.from(y_test, (val, i) => i);
    testRULOrder = testRULOrder.sort((a, b) => y_test[a] - y_test[b]);

    let X_train_ordered = trainRULOrder.map(d => X_train[d]);
    let y_train_ordered = trainRULOrder.map(d => y_train[d]);

    let X_test_ordered = testRULOrder.map(d => X_test[d]);
    let y_test_ordered = testRULOrder.map(d => y_test[d]);

    let X_train_T_ordered = tf.tensor(X_train_ordered);
    let X_test_T_ordered = tf.tensor(X_test_ordered);
    let y_test_T_ordered = tf.tensor(y_test_ordered);

    let y_train_flat_ordered = y_train_ordered.flat();
    let y_test_flat_ordered = y_test_ordered.flat();
    let target_ordered = normalizeTarget(y_train_flat_ordered, -1.0, 1.0);

    //Draw input
    drawHeatmaps(X_train_ordered, "inputContainer", "inputDiv").then(() => {
        hideLoader();
    });

    const epochs = 45;
    const batchSize = 8;

    let lineChartSettings = {
        noSvg: true,
        showAxes: false,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        width: 100,
        height: 100,
        colorScheme: ["#6a8759", "#a8aaab", "#0877bd"]
    };
    const testWidth = 250;
    const testHeight = 230;
    let outputSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 40,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        width: testWidth,
        height: testHeight,
        title: {
            text: "Training"
        },
        colorScheme: ["#6a8759", "#a8aaab", "#0877bd"]
    };
    let trainLosses = [];
    let testLosses = [];
    let batches = Math.ceil(y_test_flat_ordered.length / batchSize) * epochs;
    let xTest = Array.from(Array(batches), (x, i) => i);
    let trainTestSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 40,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        width: testWidth,
        height: testHeight,
        title: {
            text: "Testing"
        },
        colorScheme: ["#6a8759", "#a8aaab", "#0877bd"]
    };
    let trainLossW = 800;
    let trainLossH = 200;
    let trainLossBatchSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 60,
        paddingRight: 0,
        paddingTop: 20,
        paddingBottom: 40,
        width: trainLossW,
        height: trainLossH,
        title: {
            text: 'Training loss vs. testing loss.'
        },
        legend: {
            x: trainLossW - 50,
            y: 35
        },
        xAxisLabel: {
            text: 'Batch'
        },
        yAxisLabel: {
            text: 'Loss'
        }

    };
    let xScaleTest = d3.scaleLinear().domain([0, batches]).range([0, trainLossBatchSettings.width - trainLossBatchSettings.paddingLeft - trainLossBatchSettings.paddingRight]);
    trainLossBatchSettings.xScale = xScaleTest;
    let weightTypeColorScheme = ["#000000", "#6896ba", "#b64800", "#1e773b"];
    model.fit(X_train_T, y_train_T, {
        batchSize: batchSize,
        epochs: epochs,
        // shuffle: true,
        callbacks: {onEpochEnd: onEpochEnd, onBatchEnd: onBatchEnd, onTrainEnd: onTrainEnd}
    });

    //Draw the legends for weights
    d3.select("#weights0Container").selectAll(".legend").data(["input", "forget", "cell", "output"]).join("text").text(d => "-- " + d)
        .attr("font-size", 10)
        .attr("x", 0).attr("y", 0).attr("dy", (d, i) => `${i + 1}em`).attr("fill", (d, i) => weightTypeColorScheme[i]);
    d3.select("#weights1Container").selectAll(".legend").data(["input", "forget", "cell", "output"]).join("text").text(d => "-- " + d)
        .attr("font-size", 10)
        .attr("x", 0).attr("y", 0).attr("dy", (d, i) => `${i + 1}em`).attr("fill", (d, i) => weightTypeColorScheme[i]);
    let weights3Svg = d3.select("#weights3Container");
    weights3Svg.selectAll(".legend").data(["Flatten layer", "(cumulative weights)"]).join("text").text(d=>d)
        .attr("font-size", 10)
        .attr("x", 0).attr("y", 0).attr("dy", (d, i) => `${i + 1}em`);

    function onTrainEnd(batch, logs) {
        d3.selectAll(".weightLine").classed("weightLine", false);//Done training, stop animating
    }

    function onBatchEnd(batch, logs) {
        let trainLoss = logs.loss;
        let testLoss = model.evaluate(X_test_T, y_test_T).dataSync()[0];
        trainLosses.push(trainLoss);
        testLosses.push(testLoss);

        if (!trainLossBatchSettings.yScale) {
            trainLossBatchSettings.yScale = d3.scaleLinear().domain([0, trainLoss > testLoss ? trainLoss : testLoss]).range([trainLossBatchSettings.height - trainLossBatchSettings.paddingTop - trainLossBatchSettings.paddingBottom, 0]);
        }

        const lineChartData = [
            {
                x: xTest,
                y: trainLosses,
                series: 'train',
            },
            {
                x: xTest,
                y: testLosses,
                series: 'test',
            }
        ];
        if (!mapObjects['trainTestLoss']) {
            //Draw the feature.
            let lc = new LineChart(document.getElementById('trainTestLoss'), lineChartData, trainLossBatchSettings);
            lc.plot();
            mapObjects['trainTestLoss'] = lc;
        } else {
            let lc = mapObjects['trainTestLoss'];
            lc.update(lineChartData);
        }

    }

    function onEpochEnd(batch, logs) {
        //Display weights0
        let weights0 = model.layers[0].getWeights()[0];
        buildWeightPositionData(weights0, 100, 17.5, 100, 17.5, 100, 4, 10, 0, 3, 0.0, 0.7).then((result) => {
            d3.select("#weights0Container").selectAll(".weightLine")
                .data(result.lineData, d => d.idx).join('path')
                .attr("class", "weightLine")
                .attr("d", d => link(d))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", d => result.strokeWidthScale(d.weight))
                .attr("opacity", d => result.opacityScaler(d.weight))
                .attr("stroke", d => weightTypeColorScheme[d.type]);
        });


        //Draw layer 0
        let ts0 = model.layers[0].apply(X_train_T_ordered);
        tensor3DToArray3DAsync(ts0).then(data => {
            drawHeatmaps(data, "layer0Container", "layer0");
        });
        //Draw weights1
        let weights1 = model.layers[1].getWeights()[0];
        buildWeightPositionData(weights1, 100, 17.5, 100, 17.5, 100, 4, 10, 0, 3, 0.0, 0.7).then((result) => {

            d3.select("#weights1Container").selectAll(".weightLine")
                .data(result.lineData, d => d.idx).join('path')
                .attr("class", "weightLine")
                .attr("d", d => link(d))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", d => result.strokeWidthScale(d.weight))
                .attr("opacity", d => result.opacityScaler(d.weight))
                .attr("stroke", d => weightTypeColorScheme[d.type]);
        });
        //Draw layer 1
        let ts1 = model.layers[1].apply(ts0);
        tensor3DToArray3DAsync(ts1).then(data => {
            drawHeatmaps(data, "layer1Container", "layer1");
        });
        let ts2 = model.layers[2].apply(ts1);

        //(we skip flatten layer, layer 2)
        buildWeightForFlattenLayer(model.layers[3].getWeights()[0]).then(cumulativeT =>{
            buildWeightPositionData(cumulativeT, 100, 17.5, 100, 17.5, 100, 1, 0, 0.5, 3, 0.05, 0.7).then((result) => {
                d3.select("#weights3Container").selectAll(".weightLine")
                    .data(result.lineData, d => d.idx).join('path')
                    .attr("class", "weightLine")
                    .attr("d", d => link(d))
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", d => result.strokeWidthScale(d.weight))
                    .attr("opacity", d => result.opacityScaler(d.weight));
            });
        });
        //Draw layer 3
        let ts3 = model.layers[3].apply(ts2);
        tensor2DToArray2DAsync(ts3).then(data => {
            drawLineCharts(data, normalizeTarget, target_ordered, "layer3Container", "layer3", lineChartSettings, false);
        });
        //Draw weights 4
        let weights4 = model.layers[4].getWeights()[0];
        buildWeightPositionData(weights4, 100, 17.5, 100, 17.5, 100, 1, 0, 0.5, 3, 0.05, 0.7).then((result) => {
            d3.select("#weights4Container").selectAll(".weightLine")
                .data(result.lineData, d => d.idx).join('path')
                .attr("class", "weightLine")
                .attr("d", d => link(d))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", d => result.strokeWidthScale(d.weight))
                .attr("opacity", d => result.opacityScaler(d.weight));
        });
        //Draw layer 4
        let ts4 = model.layers[4].apply(ts3);
        tensor2DToArray2DAsync(ts4).then(data => {
            drawLineCharts(data, normalizeTarget, target_ordered, "layer4Container", "layer4", lineChartSettings, false);
        });
        //Draw weights 4
        let weights5 = model.layers[5].getWeights()[0];
        buildWeightPositionData(weights5, 100, 17.5, 250, 17.5, 100, 1, 0, 0.5, 3, 0.3, 0.7).then((result) => {
            d3.select("#weights5Container").selectAll(".weightLine")
                .data(result.lineData, d => d.idx).join('path')
                .attr("class", "weightLine")
                .attr("d", d => link(d))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", d => result.strokeWidthScale(d.weight))
                .attr("opacity", d => result.opacityScaler(d.weight));
        });
        //Draw output
        let ts5 = model.predict(X_train_T_ordered);
        tensor2DToArray2DAsync(ts5).then(data => {
            //We don't normalize the final result.
            drawLineCharts(data, null, y_train_flat_ordered, "layer5Container", "layer5", outputSettings, true).then(() => {
                //Update the training loss
                updateGraphTitle("layer5Container", "Training, MSE: " + logs.loss.toFixed(2));
            });
        });

        //Draw the testing data.
        let test = model.predict(X_test_T_ordered);
        tensor2DToArray2DAsync(test).then(data => {
            //We don't normalize the final result.
            drawLineCharts(data, null, y_test_flat_ordered, "testContainer", "test", trainTestSettings, true).then(() => {
                //Update test loss
                let testLoss = model.evaluate(X_test_T_ordered, y_test_T_ordered).dataSync()[0];
                updateGraphTitle("testContainer", "Testing, MSE: " + testLoss.toFixed(2));
            });
        });
    }
}

function updateGraphTitle(graphId, newText) {
    let theNode = d3.select("#" + graphId).select(".graphTitle").node();
    theNode.innerHTML = newText;
}

function normalizeTarget(data, min2, max2) {
    const min1 = d3.min(data);
    const max1 = d3.max(data);
    const range1 = max1 - min1;
    const range2 = max2 - min2;
    const result = data.map(d => {
        if (range1 === 0) {
            return (min2 + max2) / 2.0;
        }
        return min2 + ((d - min1) / range1) * range2;
    });
    return result;
}

function plotColorBar(theSvg, colorScale, id, width, height, orientation) {
    const domain = colorScale.domain();
    const minVal = domain[0];
    const domainSize = domain[domain.length - 1] - domain[0];
    const legend = theSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient' + id)
        .attr('x1', '0%') // left
        .attr('y1', '100%')
        .attr('x2', '100%') // to right
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
    colorScale.domain().forEach((dVal) => {
        legend.append("stop").attr("offset", Math.round((dVal - minVal) * 100 / domainSize) + "%").attr("stop-color", colorScale(dVal))
            .attr("stop-opacity", 1);
    });
    theSvg.append("g").append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", `url(#gradient${id})`)
        .attr("transform", "translate(0,0)");

    let axisG = theSvg.append("g").attr("transform", `translate(0,${height})`);
    let axisScale = d3.scaleLinear().domain(d3.extent(domain)).range([0, width]);
    let axisBottom = d3.axisBottom().scale(axisScale).ticks(5);
    axisG.call(axisBottom);
}

let link = d3.linkHorizontal()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    });

async function buildWeightPositionData(weightsT, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity) {
    return new Promise((resolve, reject) => {
        let weightData = weightsT.dataSync();
        let strokeWidthScale = d3.scaleLinear().domain(d3.extent(weightData)).range([minStrokeWidth, maxStrokeWidth]);
        let opacityScaler = d3.scaleLinear().domain(d3.extent(weightData)).range([minOpacity, maxOpacity]);
        let lineData = [];
        let wShape = weightsT.shape;
        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;
        let noOfRightNodes = wShape[1] / noOfWeightTypes;
        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
            let leftNodeStartY = leftNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
                let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let leftNodeY = leftNodeStartY + typeIdx * spanForWeightTypes;
                    let rightNodeY = rightNodeStartY + typeIdx * spanForWeightTypes;
                    let idx = leftIdx * (wShape[1]) + typeIdx * noOfRightNodes + rightIdx;
                    let item = {
                        source: {
                            x: -5,
                            y: leftNodeY
                        },
                        target: {
                            x: weightWidth + 5,
                            y: rightNodeY
                        },
                        idx: idx,
                        type: typeIdx,
                        weight: weightData[idx]
                    };
                    lineData.push(item);
                    // //TODO: may not break, but for now break for better performance
                    // break;
                }
            }
        }

        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScaler});
    });
}
async function buildWeightForFlattenLayer(weightsT, noOfLeftNodes){
    return new Promise((resolve, reject)=>{
        let cumulativeT =  tf.tensor(weightsT.split(8).map(t=>{
            let arr = t.cumsum().arraySync();
            return arr[arr.length-1];
        }));
        resolve(cumulativeT);
    });
}