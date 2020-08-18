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
            neuronIdx: item['source_neuron'],
            isStartNode: false,
        }
    });
    //This item is for the start node, it needs to take the contribution to the final output
    if (startNode.layerName !== 'output') {
        //We take all the items in the layer to get its scale for the whole layer
        let startLayerItems = attributionData.filter(item => item['target_layer'] === 'output' && item['source_layer'] === startNode['layerName'] && item['target_label'] === targetLabel);
        //We take the start node item itself
        let item = startLayerItems.find(item => item['source_neuron'] === startNode['neuronIdx']); //For this specific neuron as the start item
        activeBars.push({
            id: `${item['source_layer']}_${item['source_neuron']}`,
            attribution: item['attribution'],
            individual_attributions: item['individual_attributions'],
            layerName: item['source_layer'],
            neuronIdx: item['source_neuron'],
            isStartNode: true,
            layer_individual_attributions: startLayerItems.map(d => d['individual_attributions']).flat()
        });
    }
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

function buildNeuronScales(modelConfig, neuronValues, displaySize) {
    let neuronScales = {};
    modelConfig.layers.forEach(layer => {
        neuronScales[layer.name] = [];
        for (let neuronIndex = 0; neuronIndex < layer.neurons; neuronIndex++) {
            if (layer.name === 'input') {
                //Build for input
                //Get the neuron values
                let theNeuronValues = neuronValues[layer.name].map(item => item[neuronIndex]);
                let maxVal = d3.max(theNeuronValues);
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, maxVal]).range([displaySize, 0]));
            } else if (layer.name === 'output') {
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, 1]).range([displaySize, 0]));
            } else {
                neuronScales[layer.name].push(d3.scaleLinear().domain([0, 1]).range([displaySize, 0]));
            }
        }
    });
    return neuronScales;
}

function buildAttributionScales(modelConfig, activeBars, startNode, displaySize) {
    let attributionScales = {};
    modelConfig.layers.forEach(layer => {
        if (layer.name === 'output') {
            attributionScales[layer.name] = d3.scaleLinear().domain([0, 1]).range([0, displaySize / 2]);
        } else {
            let individualAttributionsForLayer = activeBars.filter(b => b.layerName === layer.name).map(d => d.isStartNode ? d['layer_individual_attributions'] : d['individual_attributions']);
            let maxAttributionForLayer = d3.max(individualAttributionsForLayer.flat().map(d => Math.abs(d)));
            attributionScales[layer.name] = d3.scaleLinear().domain([0, maxAttributionForLayer]).range([0, displaySize / 2]);
        }
    });
    return attributionScales;
}
