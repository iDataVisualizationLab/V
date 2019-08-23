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

function saveModel(modelName, epoch, model) {
    model.save(`localstorage://${modelName}:${epoch}`);
}

async function loadModel(modelName) {
    let layersConfig_ = await loadModelData(modelName, "layersConfig");
    let epochs_ = await loadModelData(modelName, "epochs");
    let batchSize_ = await loadModelData(modelName, "batchSize");
    let trainLosses_ =  await loadModelData(modelName, "trainLosses");
    let testLosses_ =  await loadModelData(modelName, "testLosses");
    //Clear prev gui
    clearMiddleLayerGUI();
    layersConfig = layersConfig_;
    createTrainingGUI(layersConfig);
    debugger;
    // saveModel(modelName, epoch, model);
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