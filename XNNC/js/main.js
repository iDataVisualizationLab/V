main(modelConfig);

async function main(modelConfig) {

    let targetLabel = 1;
    dispatch.on("changeTargetLabel", function (newLabel) {
        targetLabel = newLabel;
        d3.selectAll('.output').attr('stroke', (d, i) => i == targetLabel ? 'red' : 'black');
    });
    //Load attribution data
    let attributionData = await d3.json('data/titanic_data.json');
    let networkWeights = await d3.json('data/network_weights.json');
    let modelWeights = {};
    networkWeights.forEach(item => {
        modelWeights = Object.assign(modelWeights, item);
    });
    let modelData = buildModelItemsAndSettings(modelConfig, modelWeights);
    let modelVisualSettings = modelData.modelVisualSettings;

    let maxAttribution = Math.max(...attributionData.map(item => Math.abs(item['attribution'])));
    let attributionScale = d3.scaleLinear().domain([0, maxAttribution]).range([0, modelVisualSettings.layerWidth / 2]);
    visualizeModel(modelData, attributionScale, dispatch);

    dispatch.on("startNode", function (startNode) {
        let startNodeAttribution = findAttributionOfANodeToFinalResult(attributionData, startNode, targetLabel);
        updateModel(modelConfig, modelVisualSettings, attributionData, startNode, startNodeAttribution, targetLabel, attributionScale);
    });
    dispatch.call("changeTargetLabel", this, targetLabel);
    dispatch.call("startNode", this, {'layerName': 'output', 'neuronIdx': 1})
}

