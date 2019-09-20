dispatch.on("change", () => {
    //If it is training toggle button
    btnTrain.classList.remove("paused");
    stopTraining();
    currentModel = null;
});
dispatch.on("changeInput", () => {
    return new Promise(() => {
        //Remove the map object
        mapObjects = {};
        //Remove input
        d3.select("#inputContainer").selectAll("*").remove();
        //Remove weights out from input layer.
        d3.select("#layer0Weights").selectAll("*").each(sel => {
        debugger
        });
        //Reappend the defs for the arrows.

        //Remove traintest loss
        d3.select("#trainTestLoss").selectAll("*").remove();
        //Remove output layer
        d3.select("#outputContainer").selectAll("*").remove();
        //Remove test container
        d3.select("#testContainer").selectAll("*").remove();
        //Remove all other layers.
        d3.selectAll(".layerContainer").selectAll("*").remove();
        d3.selectAll(".weightLine").remove();
        //Start from beginning
        processInputs();
    });
});

function loadModelClick(modelName) {
    showLoader();
    loadModel(modelName);
}

async function loadModel(modelName) {
    let layersConfig_ = await loadModelData(modelName, "layersConfig");
    let epochs_ = await loadModelData(modelName, "epochs");
    let batchSize_ = await loadModelData(modelName, "batchSize");
    let trainLosses_ = await loadModelData(modelName, "trainLosses");
    let testLosses_ = await loadModelData(modelName, "testLosses");
    let X_train_ = await loadModelData(modelName, "X_train");
    let y_train_ = await loadModelData(modelName, "y_train");
    let X_test_ = await loadModelData(modelName, "X_test");
    let y_test_ = await loadModelData(modelName, "y_test");
    $("#epochs").val(epochs_);
    $("#batchSize").val(batchSize_);
    $("#snapshotName").val(modelName);
    trainLosses = trainLosses_;
    testLosses = testLosses_;
    processData(X_train_, y_train_, X_test_, y_test_, () => {
        //Clear prev gui
        clearMiddleLayerGUI();
        reviewMode = true;
        layersConfig = layersConfig_;
        createTrainingGUI(layersConfig);
        tf.loadLayersModel(`localstorage://${modelName}`).then(model=>{
            trainModel(model, X_train, y_train, X_test, y_test, epochs_, batchSize_, true);
        });
    });
}

function setTrainingConfigEditable(val) {
    //Enable the batch size, epochs form.
    $("#batchSize").prop("disabled", !val);
    $("#epochs").prop("disabled", !val);
}

function stopTraining() {
    isTraining = false;
    if (currentModel !== null) {
        currentModel.stopTraining = true;
    }
    setTrainingConfigEditable(true);
}

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
