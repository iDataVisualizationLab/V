async function saveModelData(modelName, variableName, data) {
    return new Promise((resolve) => {
        localStorage.setItem(`${modelName}:${variableName}`, JSON.stringify(data));
    });
}

function saveModel(modelName, epoch, model) {
    model.save(`localstorage://${modelName}:${epoch}`);
}