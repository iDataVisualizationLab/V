let trainRULOrder;
let testRULOrder;
let X_train, y_train, X_test, y_test;
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

async function processInputs() {
    return new Promise(resolve => {
        d3.json("data/train_FD001_100x50.json").then(X_trainR => {
            d3.json("data/train_RUL_FD001_100x50.json").then(y_trainR => {
                d3.json("data/test_FD001_100x50.json").then(X_testR => {
                    d3.json("data/test_RUL_FD001_100x50.json").then(y_testR => {
                        X_train = X_trainR;
                        y_train = y_trainR;
                        X_test = X_testR;
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
                        drawSampleInput(X_train_ordered, 0, "sampleInput");
                        resolve();
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
    if (!reviewMode) {
        const inputShape = [X_train[0].length, X_train[0][0].length];
        let modelName = saveSnapshot();
        if ($("#saveSnapshot").is(":checked")) {
            let valid = true;
            if (!modelName) {
                toast("Please insert snapshot name");
                valid = false;
            } else if (modelName.indexOf(":") >= 0) {
                toast("Model name cannot contain ':'");
                valid = false;
            }
            if (!valid) {
                btnTrain.classList.remove("paused");
                return;
            }
            //Save the model name
            saveModelName(modelName);
        }
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
    }else{
        trainModel(null, X_train, y_train, X_test, y_test, epochs, batchSize, true);
    }
}