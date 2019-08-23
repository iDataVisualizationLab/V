dispatch.on("change", () => {
    //If it is training toggle button
    btnTrain.classList.remove("paused");
    stopTraining();
    currentModel = null;
});

function loadModelClick(modelName) {
    // dispatch.call("loadModel", null, modelName);
    // toast("loading " + modelName);
    loadModel(modelName).then();
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
