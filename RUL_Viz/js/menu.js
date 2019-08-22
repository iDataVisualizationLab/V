dispatch.on("change", () => {
    //If it is training toggle button
    btnTrain.classList.remove("paused");
    stopTraining();
    currentModel = null;
});
dispatch.on("save", () => {
    if (currentModel === null) {
        toast("Please train the model before saving.");
    } else {
        btnTrain.classList.remove("paused");
        stopTraining();
        toast("Saving...");
        currentModel.save("localstorage://" + generateName(layersConfig)).then(result => {
            toast("Saved the model");
        });
    }

});

function generateName(modelsConfig) {
    return modelsConfig.map(layerInfo => {
        return layerInfo.layerType + "," + layerInfo.units + "," + layerInfo.activation;
    }).join(";")
}

function stopTraining() {
    isTraining = false;
    if (currentModel !== null) {
        currentModel.stopTraining = true;
    }
    //Enable the batch size, epochs form.
    $("#batchSize").prop("disabled", false);
    $("#epochs").prop("disabled", false);
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

function saveModel() {
    dispatch.call("save", null, undefined);
}