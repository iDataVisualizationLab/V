async function saveModelData(modelName, variableName, data) {
    return new Promise((resolve) => {
        localStorage.setItem(`${modelName}:${variableName}`, JSON.stringify(data));
    });
}

async function loadModelData(modelName, variableName) {
    return new Promise((resolve) => {
        let ret = localStorage.getItem(`${modelName}:${variableName}`);
        resolve(ret ? JSON.parse(ret) : null);
    });
}

function saveModel() {
    let modelName = $("#modelName").val(),
        epochs = $("#epochs").val(),
        batchSize = $("#batchSize").val(),
        model = currentModel;

    let valid = true;
    if (!modelName) {
        toast("Please insert snapshot name");
        valid = false;
    }
    if (valid) {
        //Save the model name
        saveModelName(modelName);
        //Save model config.
        saveModelData(modelName, "layersConfig", layersConfig);
        saveModelData(modelName, "epochs", epochs);
        saveModelData(modelName, "batchSize", batchSize);
        model.save(`localstorage://${modelName}`);
        //Save train loss data.
        saveModelData(modelName, "trainLosses", trainLosses);
        saveModelData(modelName, "testLosses", testLosses);
        saveModelData(modelName, "X_train", X_train);
        saveModelData(modelName, "y_train", y_train);
        saveModelData(modelName, "X_test", X_test);
        saveModelData(modelName, "y_test", y_test);
        toast("Saved model successfully!");
    }
}

function loadSavedModelNames() {
    let ret = localStorage.getItem("savedModels");
    return ret ? JSON.parse(ret) : [];
}

async function saveModelName(modelName) {
    return new Promise(resolve => {
        let savedModels = loadSavedModelNames();
        if (savedModels.indexOf(modelName) < 0) {
            savedModels.push(modelName);
            localStorage.setItem("savedModels", JSON.stringify(savedModels));
        }
    });
}