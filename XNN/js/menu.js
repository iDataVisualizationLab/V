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
dispatch.on("changeWeightFilter", () => {
    let weightFilter = +$("#weightFilter").val();
    onWeightFilterChanged(weightFilter);
});

function loadModelChange(theElm) {
    let modelName = theElm.value;
    isTraining = false;
    showLoader();
    loadModelFromLocalStorage(modelName);
    closeDialog("loadModelDialog");
}

function populateModelGUIFromData(trainLosses_, testLosses_, X_train_, y_train_, X_test_, y_test_, layersConfig_, model, epochs_, batchSize_) {
    trainLosses = trainLosses_;
    testLosses = testLosses_;
    //clear current map object (so we will redraw instead of updating)
    mapObjects = {};
    //Clear prev input
    d3.select("#inputContainer").selectAll("*").remove();
    //Clear prev output and test
    d3.select("#outputContainer").selectAll("*").remove();
    d3.select("#testContainer").selectAll("*").remove();
    //Clear also the training/testing loss chart.
    d3.select("#trainTestLoss").selectAll("*").remove();
    processData(X_train_, y_train_, X_test_, y_test_, () => {
        //Clear prev gui
        clearMiddleLayerGUI();
        reviewMode = true;
        layersConfig = layersConfig_;
        createTrainingGUI(layersConfig);

        //Draw the color scales for the intermediate outputs
        drawColorScales(layersConfig);
        trainModel(model, X_train, y_train, X_test, y_test, epochs_, batchSize_, true);

    });
    return layersConfig;
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

//Save model dialog
function displaySaveModelDialog() {
    if (!currentModel) {
        toast("There is no new model to save!");
        return;
    }
    displayDialog("saveModelDialog");
}

function displayLoadModelDialog() {
    dispatch.call("change", null, undefined);
    // Clean-up and repopulate the selection options.
    let dd = $("#modelsFromLocalStorage");
    dd.empty();
    dd.append($('<option value="" disabled selected>Choose your model</option>'));
    let savedModelNames = loadSavedModelNames();
    if (savedModelNames.length > 0) {
        savedModelNames.forEach(modelName => {
            dd.append($(`<option value='${modelName}'>${modelName}</option>`));
        });
    }
    //Need to reinitialize
    let selectElems = document.querySelectorAll('select');
    let selectInstances = M.FormSelect.init(selectElems);
    displayDialog("loadModelDialog");
}

function displayDialog(dialogId) {
    let theElm = document.getElementById(dialogId);
    let dlg = M.Modal.getInstance(theElm);
    dlg.open();
}

function closeDialog(dialogId) {
    let theElm = document.getElementById(dialogId);
    let dlg = M.Modal.getInstance(theElm);
    dlg.close();
}
