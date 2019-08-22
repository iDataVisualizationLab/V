const mapObjects = {};
let currentModel = null;
let trainRULOrder;
let testRULOrder;
let lstmWeightTypes = ["(click to toggle)", "input gate", "forget gate", "cell state", "output gate"];
let lstmWeightTypeDisplay = [1, 0, 0, 0];
let weightTypeDisplay = [1, 1];
let isTraining = false;
let trainLosses;
let testLosses;

let link = d3.linkHorizontal()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    });

//Layer
/***
 * Used to add layer from GUI (click button)
 */
function addLayer() {
    let layerType = $("#layerType").val();
    let units = +$("#noOfUnits").val();
    let activation = $("#activationType").val();
    let layerInfo = createLayer(layerType, units, activation);
    createLayerGUI(layerInfo);
}

function displayAddLayerDialog() {
    dispatch.call("change", null, undefined);
}

dispatch.on("change", () => {
    console.log("change");
    //If it is training toggle button
    //Toggle btnTrain if it is
    if (btnTrain && isTraining) {
        btnTrain.classList.toggle("paused");
    }
    stopTraining();
    currentModel = null;
});

function stopTraining() {
    isTraining = false;
    if (currentModel !== null) {
        currentModel.stopTraining = true;
    }
    //Enable the batch size, epochs form.
    $("#batchSize").prop("disabled", false);
    $("#epochs").prop("disabled", false);
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

// <span style="color: darkgray;">&nbsp;x&nbsp;: target</span>
// <span style="color: darkgreen;">&nbsp;o&nbsp;: output</span>

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

//Read data
d3.json("data/train_FD001_100x50.json").then(X_train => {
    d3.json("data/train_RUL_FD001_100x50.json").then(y_train => {
        d3.json("data/test_FD001_100x50.json").then(X_test => {
            d3.json("data/test_RUL_FD001_100x50.json").then(y_test => {
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

                //Create default layersConfig.
                createDefaultLayers();

                const inputShape = [X_train[0].length, X_train[0][0].length];

                btnTrain = createButton("trainingButtonContainer", (action) => {
                    //Toggle
                    if (action === "start") {
                        $("#batchSize").prop("disabled", true);
                        $("#epochs").prop("disabled", true);
                    } else {
                        $("#batchSize").prop("disabled", false);
                        $("#epochs").prop("disabled", false);
                    }
                    showLoader();
                    //Process
                    if (action === "start") {
                        isTraining = true;
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
                                    trainModel(currentModel, X_train, y_train, X_test, y_test);
                                }
                            });
                        } else {
                            trainModel(currentModel, X_train, y_train, X_test, y_test);
                        }
                    }
                    if (action === "pause") {
                        stopTraining();
                    }
                });
                btnTrain.style.margin = 10 + "px";
            });
        });

    });
});


