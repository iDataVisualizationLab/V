/**
 *
 * @param attributionData [{'target_layer': 'output', 'target_neuron': 0, 'source_layer': 'sigmoid2', 'source_neuron': 0, 'target_label': 0, 'attribution': 0.08067336}, ...]
 * @param startNode
 */
function buildBarData(attributionData, startNode, targetLabel) {
    let activeBars = attributionData.filter(item => item['target_layer'] === startNode['layerName'] && item['target_neuron'] === startNode['neuronIdx'] && item['target_label'] === targetLabel)
    //Process the bar
    activeBars = activeBars.map(item => {
        return {
            id: `${item['source_layer']}_${item['source_neuron']}`,
            attribution: item['attribution'],
            individual_attributions: item['individual_attributions'],
            layerName: item['source_layer'],
            neuronIdx: item['source_neuron']
        }
    });
    return activeBars;
}

function findAttributionOfANodeToFinalResult(attributionData, startNode, targetLabel) {
    let contribution = attributionData.find(item =>
        item['target_layer'] === 'output' &&
        item['target_neuron'] === targetLabel &&
        item['source_layer'] === startNode['layerName'] &&
        item['source_neuron'] === startNode['neuronIdx'] &&
        item['target_label'] === targetLabel
    );
    return contribution ? contribution.attribution : 0;
}

function buildNeuronYScales(modelConfig, neuronValues, height) {
    let neuronScales = {};
    modelConfig.layers.forEach(layer => {
        neuronScales[layer.name] = [];
        for (let neuronIndex = 0; neuronIndex < layer.neurons; neuronIndex++) {
            if (layer.name === 'input') {
                //Build for input
                //Get the neuron values
                let theNeuronValues = neuronValues[layer.name].map(item => item[neuronIndex]);
                let maxVal = d3.max(theNeuronValues);
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, maxVal]).range([height, 0]));
            } else if (layer.name === 'output') {
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, 1]).range([height, 0]));
            } else {
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, 1]).range([height, 0]));
            }
        }
    });
    return neuronScales;
}
