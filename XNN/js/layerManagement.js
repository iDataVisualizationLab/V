let layersConfig = [];

function createDefaultLayers() {
    createLayer("lstm", 4, "default", 0);
    // createLayer("lstm", 8, "default", 1);
    // createLayer("dense", 8, "relu", 2);
    createLayer("dense", 4, "relu", 3);
}


/**
 * Used to create a layer in the background, push it to the array of layersConfig and return it.
 * @param layerType
 * @param units
 * @param activation
 * @returns {{layerType: *, id: string, units: *, activation: *}}
 */
function createLayer(layerType, units, activation, timeStamp) {
    if (timeStamp === undefined) {
        timeStamp = new Date().getTime();
    }
    let idVal = "layer" + timeStamp;
    let layerInfo = {
        id: idVal,
        timeStamp: timeStamp,
        layerType: layerType,
        units: units,
        activation: activation
    };
    //if the input layer already exists (add it before that).
    if (layersConfig.find(l => l.id === "output")) {
        layersConfig.splice(layersConfig.length - 1, 0, layerInfo);
    } else {
        layersConfig.push(layerInfo);
    }
    return layerInfo;
}

/**
 * Used to create GUI for the layer
 * @param layerInfo
 */
function createLayerGUI(layerInfo) {
    let colNum = getCSSVariable("--colNum");
    colNum += 1;
    setCSSVariable("--colNum", colNum);
    let layerInfoStr = displayLayerInfo(layerInfo);
    let idVal = layerInfo.id;
    //Create the div.
    let div = $(`<div class='grid-item' id="${idVal}">
                    <a class="btn-small btn-floating"><i class="material-icons grey" onclick="deleteLayer('${idVal}')">delete</i></a> ${layerInfoStr}
                    <div class="divider" style="margin-bottom: 5px;"></div>
                    <div class="row">
                        <svg style="overflow: visible; margin-left: 10px;" height="25">
                            <g id="colorScale${layerInfo.timeStamp}"></g>
                        </svg>
                    </div>
                    <div class="divider" style="margin-bottom: 10px; margin-top: 5px;"></div>
                    <div class="row">
                        <div class="col s6 layerContainer" id="layerContainer${layerInfo.timeStamp}" ></div>
                        <div class="col s6 weightsContainer">
                            <svg id="weightsContainer${layerInfo.timeStamp}" width="100" style="overflow: visible"></svg>
                        </div>
                    </div>
                 </div>`);
    div.insertBefore($("#layerOutput"));
}

function clearMiddleLayerGUI() {
    $(".grid-item").each((i, elm) => {
        if (elm.id !== "layerInput" && elm.id !== "layerOutput") {
            removeLayerGUI(elm.id);
        } else if (elm.id === "layerInput") {
            let layer0WeightContainer = d3.select("#" + getWeightsContainerId(0));
            layer0WeightContainer.selectAll("g").remove();
            layer0WeightContainer.selectAll("weightLine").remove();
        }
    });
}

function displayLayerInfo(layerInfo) {
    let result = "";
    if (layerInfo.layerType === "lstm") {
        result = `<b>LSTM (${layerInfo.units} units)</b><br/>x-axis: output sequences<br/>y-axis: engines`;
    } else if (layerInfo.layerType === "dense") {
        result = `<b>Dense (${layerInfo.units} units)</b><br/>x-axis: output values<br/>y-axis: engines`
    }
    return result;
}

function removeLayerGUI(id) {
    let colNum = getCSSVariable("--colNum");
    colNum -= 1;
    setCSSVariable("--colNum", colNum);
    $(`#${id}`).remove();
}

function deleteLayer(id, onSuccess) {
    layersConfig = layersConfig.filter(l => l.id !== id);
    removeLayerGUI(id);
    if (onSuccess) {
        onSuccess();
    }
    dispatch.call("change", null, undefined);
}
