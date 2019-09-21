let trainRULOrder;
let testRULOrder;
let X_train, y_train, X_test, y_test;
let X_trainOrg, y_trainOrg, X_testOrig, y_testOrig;
let link = d3.linkHorizontal()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    });
processInputs().then(() => {
    //Create default layersConfig.
    createTrainingGUI(layersConfig);
});
let features;
let selectedFeatures;

function populateFeatureSelection(features) {
    let cbxFeatures = $('#features');
    d3.select("#features").selectAll("*").remove();
    features.forEach((f, i) => {
        cbxFeatures.append($(` <div class="input-field col s4"><label><input type="checkbox" class="filled-in" id="feature${i}" checked/><span>${f}</span></label></div>`));
    });
}

function configInput() {
    dispatch.call("change", null, undefined);//Pause training first.
}

function selectFeatures() {
    //TODO: Check there is change or not.
    for (let i = 0; i < features.length; i++) {
        selectedFeatures[i] = $("#feature" + i).is(":checked");
    }
    dispatch.call("changeInput", null, undefined);
}

function copyFeatures(X, selectedFeatures) {
    return X.map(itemSequence => {
        return itemSequence.map(step => {
            let fs = [];
            selectedFeatures.forEach((sf, i) => {
                if (sf) {
                    fs.push(step[i]);
                }
            });
            return fs;
        });
    });
}


function processData(X_trainR, y_trainR, X_testR, y_testR, resolve) {
    X_train = X_trainR;
    X_test = X_testR;
    y_train = y_trainR;
    y_test = y_testR;
    //We build the sorting order.
    trainRULOrder = Array.from(y_train, (val, i) => i);
    trainRULOrder = trainRULOrder.sort((a, b) => y_train[a] - y_train[b]);
    testRULOrder = Array.from(y_test, (val, i) => i);
    testRULOrder = testRULOrder.sort((a, b) => y_test[a] - y_test[b]);
    let flattenedZ = X_train.flat().flat();
    let minZ = d3.min(flattenedZ);
    let maxZ = d3.max(flattenedZ);
    let avgZ = (maxZ - minZ) / 2 + minZ;

    drawInputColorScale(minZ, avgZ, maxZ);
    drawOutputColorScale();
    //Draw input
    let X_train_ordered = trainRULOrder.map(d => X_train[d]);
    drawHeatmaps(X_train_ordered, "inputContainer", "inputDiv").then(() => {
        hideLoader();
    });
    //Draw sample input for documentation.
    //Generate one sample output
    let noOfItems = X_train_ordered.length;
    let noOfSteps = X_train_ordered[0].length;
    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i);
    let z = [];
    for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
        let row = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            row.push(X_train_ordered[itemIdx][stepIdx][0])
        }
        z.push(row);
    }
    drawSampleInputOutput({x: x, y: y, z: z}, "Sample input sensor", "sampleInput");
    let y_train_ordered = trainRULOrder.map(v => y_train[v][0]).reverse();
    let sampleY = y_train_ordered.map(rulVal => Math.round(rulVal + 30.0 * (Math.random() - 0.5)));

    const lineChartData = [
        {
            x: sampleY,
            y: y,
            series: 'output',
            marker: 'o',
            type: 'scatter'
        },
        {
            x: y_train_ordered,
            y: y,
            series: 'target',
            marker: 'x',
            type: 'scatter'
        }
    ];
    drawSampleOutput(lineChartData, "Target vs. output RUL", "trainRUL");
    resolve();
}

async function processInputs() {
    return new Promise(resolve => {
        d3.json("data/train_FD001_100x50.json").then(X_trainR => {
            d3.json("data/train_RUL_FD001_100x50.json").then(y_trainR => {
                d3.json("data/test_FD001_100x50.json").then(X_testR => {
                    d3.json("data/test_RUL_FD001_100x50.json").then(y_testR => {
                        features = [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21].map(ss => "sensor" + ss);
                        // d3.json("data/X_train_HPCC_1_20.json").then(X_trainR => {
                        //     d3.json("data/y_train_HPCC_1_20.json").then(y_trainR => {
                        //         d3.json("data/X_test_HPCC_1_20.json").then(X_testR => {
                        //             d3.json("data/y_test_HPCC_1_20.json").then(y_testR => {
                        //                 features = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0'];
                        populateFeatureSelection(features);
                        selectedFeatures = features.map(_ => true);
                        X_train = copyFeatures(X_trainR, selectedFeatures);
                        X_test = copyFeatures(X_testR, selectedFeatures);
                        processData(X_train, y_trainR, X_test, y_testR, resolve);
                    });
                });
            });
        });
    });
}

async function drawColorScales(modelsConfig) {
    return new Promise(() => {
        for (let i = 0; i < modelsConfig.length - 1; i++) {//Except for the last one
            let layer = modelsConfig[i];
            let timeStamp = layer.timeStamp;
            let containerId = `colorScale${timeStamp}`;
            if (layer.layerType === "lstm") {
                drawLSTMColorScale(containerId, colorBarW, colorBarH);
            } else if (layer.layerType === "dense") {
                drawDenseColorScale(containerId);
            }
        }
    });
}

async function drawDenseColorScale(containerId) {
    return new Promise(() => {
        let theG = d3.select("#" + containerId);
        theG.selectAll("text").data([{text: " x : target", color: "gray"}, {
            text: " o : output",
            color: "darkgreen"
        }]).join("text")
            .text(d => d.text)
            .attr("fill", d => d.color)
            .attr("x", (d, i) => i * 100)
            .attr("y", colorBarH);
    });
}

async function drawLSTMColorScale(containerId, width, height) {
    let lstm1ColorScale = d3.scaleLinear()
        .domain([-1.0, 0.0, 1.0])
        .range(["#0877bd", "#e8eaeb", "#f59322"])
        .clamp(true);
    plotColorBar(d3.select("#" + containerId), lstm1ColorScale, containerId, width, height, "horizon");
}

async function drawInputColorScale(minZ, avgZ, maxZ) {
    return new Promise(() => {
        let inputColorScale = d3.scaleLinear()
            .domain([minZ, avgZ, maxZ])
            .range(["#0877bd", "#e8eaeb", "#f59322"])
            .clamp(true);
        d3.select("#inputColorScale").selectAll("*").remove();
        plotColorBar(d3.select("#inputColorScale"), inputColorScale, "inputColorBar", colorBarW, colorBarH, "horizon");
    });
}

async function drawOutputColorScale() {
    drawDenseColorScale("outputColorScale");
}

async function createTrainingGUI(layersConfig) {
    if (layersConfig.length === 0) {
        createDefaultLayers();
    }
    layersConfig.forEach(layerInfo => {
        if (layerInfo.id !== "output" && layerInfo.layerType !== "flatten") {
            createLayerGUI(layerInfo);
        }
    });
    btnTrain = createButton("trainingButtonContainer", (action) => {
        return new Promise(resolve => {
            //Process
            if (action === "start") {
                startTraining();
            }
            if (action === "pause") {
                stopTraining();
            }
        });
    });
}

function startTraining() {
    let epochs = +$("#epochs").val();
    let batchSize = +$("#batchSize").val();

    const inputShape = [X_train[0].length, X_train[0][0].length];

    //Toggle
    setTrainingConfigEditable(false);
    isTraining = true;
    showLoader();
    if (currentModel === null) {
        createModel(layersConfig, inputShape).then(model => {
            //Clear all current outputs if there are
            d3.selectAll(".weightLine").remove();
            //Draw the color scales for the intermediate outputs
            drawColorScales(layersConfig);
            if (model !== null) {
                currentModel = model;
                //Reset train losses, test losses for the first creation.
                trainLosses = [];
                testLosses = [];
                trainModel(currentModel, X_train, y_train, X_test, y_test, epochs, batchSize, false);
            }
        });
    } else {
        trainModel(currentModel, X_train, y_train, X_test, y_test, epochs, batchSize, false);
    }

}

function onWeightFilterChanged() {
    let weightFilter = +$("#weightFilter").val();
    for (let i = 0; i < layersConfig.length; i++) {
        let containerId = getWeightsContainerId(i);
        if (layersConfig[i].layerType === "lstm") {
            drawLSTMWeights(containerId);
        }
        if (layersConfig[i].layerType === "dense") {
            drawDenseWeights(containerId);
        }
    }
    for (let i = 0; i < layersConfig.length - 1; i++) {
        let layerInfo = layersConfig[i];
        if (layerInfo.layerType != 'flatten') {
            let weightContainerId = getWeightsContainerId(i);
            let outputWeightContainerId = getWeightsContainerId(i + 1);
            let weightsContainer = d3.select(`#${weightContainerId}`);
            let outputWeightsContainer = d3.select(`#${outputWeightContainerId}`);
            let weights = weightsContainer.selectAll(".weightLine");
            let outputWeights = outputWeightsContainer.selectAll(".weightLine");
            let layerId = layerInfo.id;//This is the same as 'layer' + layerInfo.timeStamp.
            let theLayer = d3.select(`#${layerId}`);

            let visibleIndexes = [];
            //If it is involved in any weight then it is visible.
            weights.each(w => {
                if (w.scaledWeight >= weightFilter) {
                    if (visibleIndexes.indexOf(w.targetIdx) < 0) {
                        visibleIndexes.push(w.targetIdx);
                    }
                }
            });
            outputWeights.each(w => {
                if (w.scaledWeight >= weightFilter) {
                    if (visibleIndexes.indexOf(w.sourceIdx) < 0) {
                        visibleIndexes.push(w.sourceIdx);
                    }
                }
            });

            //All the rest are belonging invisible.
            theLayer.selectAll(".layer" + layerInfo.timeStamp).style("opacity", (d, i) => {
                if (visibleIndexes.indexOf(i) >= 0) {
                    return 1.0;
                } else {
                    return 0;
                }
            });
        }
        //Process for the input layer.
        let theLayer = d3.select(`#inputContainer`);
        let outputWeightContainerId = getWeightsContainerId(0);
        let outputWeightsContainer = d3.select(`#${outputWeightContainerId}`);
        let outputWeights = outputWeightsContainer.selectAll(".weightLine");
        let visibleIndexes = [];
        outputWeights.each(w => {
            if (w.scaledWeight >= weightFilter) {
                if (visibleIndexes.indexOf(w.sourceIdx) < 0) {
                    visibleIndexes.push(w.sourceIdx);
                }
            }
        });
        //All the rest are belonging invisible.
        theLayer.selectAll(".inputDiv").style("opacity", (d, i) => {
            if (visibleIndexes.indexOf(i) >= 0) {
                return 1.0;
            } else {
                return 0;
            }
        });
    }
}