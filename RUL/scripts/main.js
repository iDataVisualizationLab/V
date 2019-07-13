const numberOfEngines = 100;
const selectedSensors = [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21];
const sequenceLength = 200;
const numberOfSensors = selectedSensors.length;
let test_FD = null;
let test_RUL = null;
const modelPaths = ['data/models/lstmmodel/model.json', 'data/models/cnnmodel/model.json'];
let models = [];
let visModels = [];
let layerIdxs = [];
let modelLayerOutputs = [];
let engineIdx = 0;

async function main() {
    //Load data
    test_FD = await d3.json('data/test_FD001.json');
    test_RUL = await d3.json('data/test_RUL_FD001.json');
    //Load models
    models = await Promise.all(modelPaths.map(thePath => tf.loadLayersModel(thePath, {strict: false})));
    debugger;
    //Set the default layer index to draw
    models.forEach(model => {
        //Set 1 as default layer index for every item
        layerIdxs.push(1);
    });
    //Get the vis model
    visModels = models.map(model => getVisModel(model));
}

main().then(() => {
    //Populate engine ids.
    populateEngineIds(numberOfEngines);
    drawModels(models, modelLayerClicked);
    //Add the divs for all output layer vis for each model
    d3.select('#layerOutput').selectAll('div').data(models).enter().append("div").attr("id", (d, i) => 'model' + i + 'LayerOutput');
    //Add the divs for all the final output layer for each model
    d3.select('#modelOutput').selectAll('div').data(models).enter().append("div").attr("id", (d, i) => 'model' + i + 'Output');

    //Trigger default input
    changeEngine(document.getElementById('engineSelection'));
    hideLoader();
});

function changeEngine(engineSelection) {
    engineIdx = engineSelection.selectedIndex;
    const engineData = test_FD[engineIdx];
    drawInputs(engineData);
    //Create tensor for the engineData
    const tsEngineX = tf.tensor3d([engineData], [1, sequenceLength, numberOfSensors]);
    //Get output layers for all models.
    modelLayerOutputs = visModels.map(viz_model => {
        const layerOutputs = viz_model.predict(tsEngineX);
        return layerOutputs;
    });
    //Draw the output for all layers.
    models.forEach((model, modelIdx) => {
        //Take the displaying layer of the model
        let layerIdx = layerIdxs[modelIdx];
        drawLayerOutput(modelLayerOutputs[modelIdx][layerIdx], document.getElementById('model' + (modelIdx) + 'LayerOutput'));
        drawModelOutput(modelIdx);
    });

}

function populateEngineIds(numberOfEngines) {
    const engineSelection = d3.select("#engineSelection");
    for (let i = 0; i < numberOfEngines; i++) {
        engineSelection.append("option").attr("value", i).node().innerHTML = "Engine " + (i + 1);
    }
}

function drawModels(models, modelLayerClicked) {
    //Create divs for the models
    d3.select('#modelDiv').selectAll('div').data(models).enter().append("div").attr("id", (d, i) => 'model' + i);
    //Draw models
    models.forEach((model, i) => {
        //Show model
        let theDiv = document.getElementById('model' + i);
        tfvis.show.modelSummary(theDiv, model);
        //Set hoverable
        d3.select(theDiv).selectAll("tr").classed("hoverable", true)
            .on("click", function () {
                let modelIdx = +this.parentElement.parentElement.parentElement.id.split('model')[1];
                let layerIdx = this.rowIndex - 1;
                if (layerIdx >= 0) {
                    modelLayerClicked(modelIdx, layerIdx);
                }
            });
    });
}

function modelLayerClicked(modelIdx, layerIdx) {
    layerIdxs[modelIdx] = layerIdx;//Set the currently displaying layer for this model
    //Draw the model output
    drawLayerOutput(modelLayerOutputs[modelIdx][layerIdx], document.getElementById('model' + (modelIdx) + 'LayerOutput'));
}

function drawLayerOutput(layerOutput, theDiv) {
    //Incase of heatmap
    if (layerOutput.shape.length === 3) {
        const heatmapData = {
            values: layerOutput.reshape([layerOutput.shape[1], layerOutput.shape[2]])
        };
        tfvis.render.heatmap(theDiv, heatmapData, {height: 250, width: 400});
    } else if (layerOutput.shape.length == 2) {
        const lineData = {
            values: tensor2DToPoints(layerOutput),
            series: []
        };
        if (lineData.values.length > 1) {
            tfvis.render.linechart(theDiv, lineData);
        }
    }
}

function drawModelOutput(modelIdx) {
    let layerOutputs = modelLayerOutputs[modelIdx];
    let layerOutput = layerOutputs[layerOutputs.length - 1];
    let theDiv = document.getElementById('model' + (modelIdx) + 'Output');
    let scatterData = {
        values: [tensor2DToPoints(layerOutput).map(d=>{return {x: engineIdx+1, y: d.y}}), [{x: engineIdx+1, y: test_RUL[engineIdx][0]}]],
        series: ['predicted', 'actual']
    };
    tfvis.render.scatterplot(theDiv, scatterData, {height: 250, width: 400, xLabel: 'Engine', yLabel: 'RUL', xType: 'nominal', yAxisDomain: [0, 150]});

}

/**
 *
 * @param tf2d Note that 1d is for the batch, so another 1d is for the data
 * @returns {*}
 */
function tensor2DToPoints(tf2d) {
    let results = [];
    tf2d.dataSync().forEach((v, i) => {
        results.push({x: i, y: v});
    });
    return results;
}

function drawInputs(engineData) {
    const inputValues = [];
    const inputSeries = [];
    for (let sensorIdx = 0; sensorIdx < numberOfSensors; sensorIdx++) {
        inputSeries.push('sensor' + selectedSensors[sensorIdx]);
        let sensorValues = [];
        for (let sequenceIdx = 0; sequenceIdx < sequenceLength; sequenceIdx++) {
            sensorValues.push({x: sequenceIdx, y: engineData[sequenceIdx][sensorIdx]})
        }
        inputValues.push(sensorValues);
    }
    //Add the divs for inputs
    d3.select("#inputDiv").selectAll(".inputSensor").data(selectedSensors).enter().append("div").attr("id", (d, i) => "inputSensor" + d);
    //Draw inputs
    for (let i = 0; i < selectedSensors.length; i++) {
        tfvis.render.linechart(document.getElementById("inputSensor" + selectedSensors[i]), {
            values: inputValues[i],
            series: ['sensor' + selectedSensors[i]]
        }, {width: 400, height: 100, xLabel: 'sequence step', yLabel: 'sensor value'});
    }
}

function getVisModel(model) {
    const output_layers = model.layers.map(l => l.output);
    const input = model.input;
    const viz_model = tf.model({inputs: input, outputs: output_layers});
    return viz_model
}