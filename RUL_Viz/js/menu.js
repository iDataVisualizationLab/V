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
    loadModelConfig(modelName).then(() => {
        //Then start training.
        startTraining();
    });
}

function setTrainingConfigEditable(val) {
    //Enable the batch size, epochs form.
    $("#batchSize").prop("disabled", !val);
    $("#epochs").prop("disabled", !val);
    $("#saveSnapshot").prop("disabled", !val);
    $("#snapshotName").prop("disabled", !val);
    $("#loadModelMenu").prop("disabled", !val);
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

function saveSnapshot() {
    if ($("#saveSnapshot").is(":checked")) {
        return $("#snapshotName").val();
    } else {
        return false;
    }
}
