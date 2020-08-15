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
