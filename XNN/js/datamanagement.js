async function saveModelData(modelName, variableName, data, obj) {
    if (obj) {
        obj[variableName] = data;
    } else {
        return new Promise((resolve) => {
            localStorage.setItem(`${modelName}:${variableName}`, JSON.stringify(data));
        });
    }
}

async function loadModelData(modelName, variableName) {
    return new Promise((resolve) => {
        let ret = localStorage.getItem(`${modelName}:${variableName}`);
        resolve(ret ? JSON.parse(ret) : null);
    });
}

function saveModelClick() {
    if (!currentModel) {
        toast("There is no current model to save.");
        return true;
    }
    saveModel(true);
}

function saveModel(toFile) {

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
        let obj = undefined;
        if (toFile) {
            obj = {};
        }

        //Save model config.
        saveModelData(modelName, "layersConfig", layersConfig, obj);
        saveModelData(modelName, "epochs", epochs, obj);
        saveModelData(modelName, "batchSize", batchSize, obj);
        //Save train loss data.
        saveModelData(modelName, "trainLosses", trainLosses, obj);
        saveModelData(modelName, "testLosses", testLosses, obj);
        saveModelData(modelName, "X_train", X_train, obj);
        saveModelData(modelName, "y_train", y_train, obj);
        saveModelData(modelName, "X_test", X_test, obj);
        saveModelData(modelName, "y_test", y_test, obj);
        //Save the model
        if (toFile) {
            currentModel.save(`downloads://${modelName}`);
            download(JSON.stringify(obj), `${modelName}_data.json`, "text/plain");
        } else {
            //Save the model name
            saveModelName(modelName);
            currentModel.save(`localstorage://${modelName}`);
            toast("Saved model successfully!");
        }
    }
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
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

async function loadModelFromFiles(theElm) {

    const fileList = theElm.files;
    //Need to know which file is which.
    //Take the model name.
    let modelName;
    if (fileList.length != 3) {
        toast("Please select the three downloaded files.");
        return;
    }
    for (let i = 0; i < 3; i++) {
        let f = fileList[i];
        if (f.name.slice(f.name.length - 10, f.name.length - 4) === "_data.") {
            modelName = f.name.slice(0, f.name.length - 10);
            break;
        }
    }
    if (modelName) {
        let dataFile;
        let modelFile;
        let weightFile;
        for (let i = 0; i < 3; i++) {
            let f = fileList[i];
            if (f.name === modelName + "_data.json") {
                dataFile = f;
            }
            if (f.name === modelName + ".json") {
                modelFile = f;
            }
            if (f.name === modelName + ".weights.bin") {
                weightFile = f;
            }
        }
        if (!dataFile) {
            toast("Invalid data file uploaded");
            return;
        }
        if (!modelFile) {
            toast("Invalid model file uploaded");
            return;
        }
        if (!weightFile) {
            toast("Invalid weight file uploaded");
            return;
        }
        closeDialog("loadModelDialog");
        showLoader();
        //Now loading
        let model = await tf.loadLayersModel(tf.io.browserFiles(
            [modelFile, weightFile]));

        let reader = new FileReader();
        reader.onload = function (e) {
            let modelData = JSON.parse(e.target.result);
            let layersConfig_ = loadModelDataFromObj(modelData, "layersConfig");
            let epochs_ = loadModelDataFromObj(modelData, "epochs");
            let batchSize_ = loadModelDataFromObj(modelData, "batchSize");
            let trainLosses_ = loadModelDataFromObj(modelData, "trainLosses");
            let testLosses_ = loadModelDataFromObj(modelData, "testLosses");
            let X_train_ = loadModelDataFromObj(modelData, "X_train");
            let y_train_ = loadModelDataFromObj(modelData, "y_train");
            let X_test_ = loadModelDataFromObj(modelData, "X_test");
            let y_test_ = loadModelDataFromObj(modelData, "y_test");
            populateModelGUIFromData(trainLosses_, testLosses_, X_train_, y_train_, X_test_, y_test_, layersConfig_, model, epochs_, batchSize_);
            hideLoader();

        };
        reader.readAsText(dataFile);
    }
}

function loadModelDataFromObj(obj, variable) {
    return obj[variable];
}

async function loadModelFromLocalStorage(modelName) {
    let layersConfig_ = await loadModelData(modelName, "layersConfig");
    let epochs_ = await loadModelData(modelName, "epochs");
    let batchSize_ = await loadModelData(modelName, "batchSize");
    let trainLosses_ = await loadModelData(modelName, "trainLosses");
    let testLosses_ = await loadModelData(modelName, "testLosses");
    let X_train_ = await loadModelData(modelName, "X_train");
    let y_train_ = await loadModelData(modelName, "y_train");
    let X_test_ = await loadModelData(modelName, "X_test");
    let y_test_ = await loadModelData(modelName, "y_test");
    let model = await tf.loadLayersModel(`localstorage://${modelName}`);
    $("#epochs").val(epochs_);
    $("#batchSize").val(batchSize_);
    populateModelGUIFromData(trainLosses_, testLosses_, X_train_, y_train_, X_test_, y_test_, layersConfig_, model, epochs_, batchSize_);
}