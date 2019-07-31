const graphWidth = 400;
const contentWidth = 1660;
const contentHeight = 1600;
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
//Add the canvas to the top layer
d3.select("#mainContent").append("canvas").attr("width", contentWidth).attr("height", contentHeight).attr("id", "topLayer");

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
    //Create divs for the models
    let modelRows = d3.select('#models').selectAll('.modelRow').data(models).enter().append("div").attr("id", (d, i) => 'model' + i + 'row').attr("class", "row");
    modelRows.append("div").attr("id", (d, i)=>'model' + i).attr("class", "col s4");
    //Add the divs for all output layer vis for each model
    modelRows.append("div").attr("id", (d, i) => 'model' + i + 'LayerOutput').attr("class", "col s4");
    //Add the divs for all the final output layer for each model
    modelRows.append("div").attr("id", (d, i) => 'model' + i + 'Output').attr("class", "col s4");

    drawModels(models, modelLayerClicked);//Trigger default input
    changeEngine(document.getElementById('engineSelection'));

    hideLoader();

    //Draw lines
    // drawLine([graphWidth+20, 0], [graphWidth+20, contentHeight], 'red');

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
    //In case of heatmap
    if (layerOutput.shape.length === 3) {
        let opts = {
            height: 250,
            width: graphWidth,
            xLabel: 'sequence',
            yLabel: 'features'
        };
        const heatmapData = {
            values: layerOutput.reshape([layerOutput.shape[1], layerOutput.shape[2]])
        };
        tfvis.render.heatmap(theDiv, heatmapData, opts);
    } else if (layerOutput.shape.length == 2) {
        const lineData = {
            values: tensor2DToPoints(layerOutput),
            series: []
        };
        if (lineData.values.length > 1) {
            let opts = {
                height: 250,
                width: graphWidth,
                xLabel: 'feature',
                yLabel: 'value'
            };

            tfvis.render.linechart(theDiv, lineData, opts);
        }
    }
}

function drawModelOutput(modelIdx) {
    let layerOutputs = modelLayerOutputs[modelIdx];
    let layerOutput = layerOutputs[layerOutputs.length - 1];
    let theDiv = document.getElementById('model' + (modelIdx) + 'Output');
    let scatterData = {
        values: [tensor2DToPoints(layerOutput).map(d => {
            return {x: engineIdx + 1, y: d.y}
        }), [{x: engineIdx + 1, y: test_RUL[engineIdx][0]}]],
        series: ['predicted', 'actual'],
    };
    tfvis.render.scatterplot(theDiv, scatterData, {
        height: 250,
        width: Math.round(graphWidth*2/3),
        xLabel: 'Engine',
        yLabel: 'RUL',
        yAxisDomain: [0, 150],
        xType: 'nominal'
    });

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
    const opts = {width: graphWidth, height: 100, xLabel: 'sequence step', yLabel: 'sensor value'};
    //Draw inputs
    for (let i = 0; i < selectedSensors.length; i++) {
        tfvis.render.linechart(document.getElementById("inputSensor" + selectedSensors[i]), {
            values: inputValues[i],
            series: ['sensor' + selectedSensors[i]]
        }, opts);
    }
}

function getVisModel(model) {
    const output_layers = model.layers.map(l => l.output);
    const input = model.input;
    const viz_model = tf.model({inputs: input, outputs: output_layers});
    return viz_model
}