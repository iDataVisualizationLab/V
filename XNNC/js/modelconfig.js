let modelConfig = {
    input_features: ['age', 'sibsp', 'parch', 'fare', 'female', 'male', 'embark_C', 'embark_Q', 'embark_S', 'class_1', 'class_2', 'class_3'],
    layers: [{name: 'input', neurons: 12}, {name: 'sigmoid1', neurons: 8}, {
        name: 'sigmoid2',
        neurons: 6
    }, {name: 'output', neurons: 2}],
    layer_activation_mappings: {'sigmoid1': 'linear1', 'sigmoid2': 'linear2', 'output': 'linear3'},
    output: [0.7150127226, 0.28498727736]
}

function buildModelItemsAndSettings(modelConfig, modelWeights) {
    let modelVisualSettings = {
        width: 1200,
        height: 600,
        margins: {top: 100, left: 50, right: 50, bottom: 50},
        barSize: 20,
        layerLabelMargin: 30,
        axisMargin: 20,
        featureLabelMargin: 5,
        output: modelConfig.output
    }
    //Complete computation of the settings info.
    let networkWidth = modelVisualSettings.width - modelVisualSettings.margins.left - modelVisualSettings.margins.right;
    let networkHeight = modelVisualSettings.height - modelVisualSettings.margins.top - modelVisualSettings.margins.bottom;
    let layerCounts = 2 * modelConfig.layers.length - 1; //number of layers for the bars and number of layers - 1 for the weights
    let layerWidth = networkWidth / (layerCounts);
    let maxNumberOfNeurons = Math.max(...modelConfig.layers.map(layer => layer.neurons));
    let barSpace = (networkHeight - maxNumberOfNeurons * modelVisualSettings.barSize) / (maxNumberOfNeurons - 1)

    modelVisualSettings['networkWidth'] = networkWidth;
    modelVisualSettings['networkHeight'] = networkHeight;
    modelVisualSettings['layerWidth'] = layerWidth;
    modelVisualSettings['barSpace'] = barSpace;


    //Build the bars
    let bars = [];
    let features = [];
    let lines = [];
    let xAxes = [];
    let layerNames = [];
    modelConfig.layers.forEach((layer, layerIdx) => {
        let layerStartX = 2 * layerWidth * layerIdx + layerWidth / 2; //layerWidth/2 since we start at the center for positive/negative
        let layerStartY = (networkHeight - (layer.neurons * modelVisualSettings.barSize + (layer.neurons - 1) * barSpace)) / 2;


        let line = {
            id: `yAxis_${layer.name}`,
            x1: layerStartX,
            y1: layerStartY,
            x2: layerStartX,
            y2: modelVisualSettings.networkHeight - layerStartY
        };
        let xAxis = {
            x: line.x2 - layerWidth / 2,
            y: line.y2 + modelVisualSettings.axisMargin,
            id: `xAxis_${layer.name}`,
            layerName: layer.name
        }
        let layerName = {
            name: (layer.name === 'input' || layer.name === 'output') ? layer.name : modelConfig.layer_activation_mappings[layer.name],
            x: line.x1,
            y: line.y1 - modelVisualSettings.layerLabelMargin
        }

        if (layer.name === 'output') {
            line.x1 = line.x1 - layerWidth / 2;
            line.x2 = line.x2 - layerWidth / 2;
        }

        lines.push(line);
        layerNames.push(layerName);
        xAxes.push(xAxis);
        for (let neuronIdx = 0; neuronIdx < layer.neurons; neuronIdx++) {
            let bar = {
                'id': `${layer.name}_${neuronIdx}`,
                'attribution': 0,
                'height': modelVisualSettings.barSize,
                'layerName': layer.name,
                'neuronIdx': neuronIdx
            };
            bar['x'] = layerStartX;
            bar['y'] = layerStartY + neuronIdx * (modelVisualSettings.barSize + barSpace);
            bars.push(bar);
            //The labels for the feature
            let feature = {
                name: getFeatureName(layer.name, neuronIdx),
                x: bar.x - layerWidth / 2,
                y: bar.y - modelVisualSettings.featureLabelMargin,
            }
            features.push(feature);
        }
    });

    function getFeatureName(layerName, neuronIdx) {
        if (layerName === 'output') {
            return neuronIdx === 0 ? 'dead' : 'survived';
        }
        if (layerName === 'input') {
            return modelConfig.input_features[neuronIdx];
        }
        return `neuron ${neuronIdx}`;
    }

    //build the paths
    //weight scale
    let weights = [];
    d3.keys(modelWeights).forEach(k => weights = weights.concat(modelWeights[k].flat()));
    weights = weights.map(Math.abs);
    let maxWeight = d3.max(weights);
    let weightScale = d3.scaleLinear().domain([0, maxWeight]).range([0, 3])
    modelVisualSettings['weightScale'] = weightScale;
    let paths = [];
    modelConfig.layers.forEach((sourceLayer, sourceLayerIdx) => {
        if (sourceLayer.name !== 'output') {
            let nextLayer = modelConfig.layers[sourceLayerIdx + 1];
            let sourceLayerStartX = 2 * layerWidth * sourceLayerIdx + layerWidth; //layerWidth/2 since we start at the center for positive/negative
            let sourceLayerStartY = (networkHeight - (sourceLayer.neurons * modelVisualSettings.barSize + (sourceLayer.neurons - 1) * barSpace)) / 2 + modelVisualSettings.barSize / 2;
            let targetLayerStartX = sourceLayerStartX + layerWidth;
            let targetLayerStartY = (networkHeight - (nextLayer.neurons * modelVisualSettings.barSize + (nextLayer.neurons - 1) * barSpace)) / 2 + modelVisualSettings.barSize / 2;

            for (let sourceNeuronIdx = 0; sourceNeuronIdx < sourceLayer.neurons; sourceNeuronIdx++) {
                for (let targetNeuronIdx = 0; targetNeuronIdx < nextLayer.neurons; targetNeuronIdx++) {
                    let weight = modelWeights[`${modelConfig.layer_activation_mappings[nextLayer.name]}.weight`][targetNeuronIdx][sourceNeuronIdx]
                    let path = {
                        source: {
                            x: sourceLayerStartX,
                            y: sourceLayerStartY + sourceNeuronIdx * (modelVisualSettings.barSize + barSpace)
                        },
                        target: {
                            x: targetLayerStartX,
                            y: targetLayerStartY + targetNeuronIdx * (modelVisualSettings.barSize + barSpace)
                        },
                        id: `${sourceLayer.name}_${sourceNeuronIdx}_${nextLayer.name}_${targetNeuronIdx}`,
                        sourceLayerName: sourceLayer.name,
                        sourceLayerNeuronIdx: sourceNeuronIdx,
                        targetLayerName: nextLayer.name,
                        targetLayerNeuronIdx: targetNeuronIdx,
                        weight: weight
                    };
                    paths.push(path);
                }
            }
        }
    });
    return {
        'bars': bars,
        'lines': lines,
        'layerNames': layerNames,
        'paths': paths,
        'modelVisualSettings': modelVisualSettings,
        'features': features,
        'xAxes': xAxes
    };
}

function updateAttributions(activeBars, startNode, startNodeAttribution, attributionScale) {
    let mainG = d3.select('#mainG');

    mainG.selectAll('.attribution').each(function (d) {
        //We don't do anything to the outputs
        if (d.layerName === 'output') {
            return;
        }

        let bar = d3.select(this);
        //If it is the start node update its attribution to the final output
        if (d.layerName === startNode.layerName && d.neuronIdx === startNode.neuronIdx) {
            //Update its attribution
            d.attribution = startNodeAttribution;
            bar.attr('x', d => d.x - (d.attribution >= 0 ? 0 : attributionScale(-d.attribution)))
                .attr('fill', d => d.attribution >= 0 ? 'steelblue' : 'red');

            bar.transition(1000).attr('width', d => attributionScale(Math.abs(d.attribution)));
            return;
        }

        let activeItem = activeBars.find(i => i.id === d.id);
        //Do nothing for the start node

        if (activeItem) {
            //Copy the properties of the activeItem to the current data object
            d.attribution = activeItem.attribution;

            bar.attr('x', d => d.x - (d.attribution >= 0 ? 0 : attributionScale(-d.attribution)))
                .attr('fill', d => d.attribution >= 0 ? 'steelblue' : 'red');

            bar.transition(1000).attr('width', d => attributionScale(Math.abs(d.attribution)));

        } else {
            bar.attr('x', d => d.x);
            bar.transition(1000).attr('width', 0);
        }
    });
}

function updateModel(modelConfig, modelVisualSettings, attributionData, startNode, startNodeAttribution, targetLabel, attributionScale) {
    let activeBars = buildBarData(attributionData, startNode, targetLabel);
    updateAttributions(activeBars, startNode, startNodeAttribution, attributionScale);
    updateWeights(activeBars, startNode);
}

function updateWeights(activeBars, startNode) {
    //Select all weights
    d3.selectAll('.weightLine').each(function (d) {
        let weightLine = d3.select(this);

        /*d format will contain the  source  layer name + neuron and target layer name + neuron of the weights*/
        // id: "input_0_sigmoid1_0"
        // source: {x: 157.14285714285714, y: 10}
        // sourceLayerName: "input"
        // sourceLayerNeuronIdx: 0
        // targetLayerName: "sigmoid1"
        // target: {x: 314.2857142857143, y: 97.27272727272725}
        // targetLayerNeuronIdx: 0
        // weight: 0.08305900543928146

        /*activeBar item format contains*/
        //layerName: item['source_layer'],
        //neuronIdx: item['source_neuron']

        /*startNode contains*/
        //{'layerName': 'output', 'neuronIdx': 1}

        let sourceIsActive = activeBars.find(item => item.layerName === d.sourceLayerName && item.neuronIdx == d.sourceLayerNeuronIdx);
        let targetIsActive = activeBars.find(item => item.layerName === d.targetLayerName && item.neuronIdx == d.targetLayerNeuronIdx);
        let targetIsStartNode = startNode.layerName === d.targetLayerName && startNode.neuronIdx === d.targetLayerNeuronIdx;


        if (sourceIsActive && (targetIsActive || targetIsStartNode)) {
            weightLine.transition(1000).attr("opacity", 1.0);
        } else {
            weightLine.transition(1000).attr("opacity", 0.0);
        }
    });
}

function visualizeModel(modelData, attributionScale, dispatch) {
    let bars = modelData.bars, lines = modelData.lines, layerNames = modelData.layerNames, paths = modelData.paths,
        modelVisualSettings = modelData.modelVisualSettings, features = modelData.features, xAxes = modelData.xAxes;

    let link = d3.linkHorizontal()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });
    let mainSvg = d3.select('#mainSvg');
    let mainG = mainSvg.append("g").attr("id", "mainG")
        .attr("transform", `translate(${modelVisualSettings.margins.left}, ${modelVisualSettings.margins.top})`);
    //Create the lines for y-axis
    mainG.selectAll('.yAxis').data(lines, d => d.id).join('line')
        .attr('class', 'yAxis')
        .attr('x1', d => d.x1)
        .attr("y1", d => d.y1)
        .attr("x2", d => d.x2)
        .attr("y2", d => d.y2)
        .attr('stroke', 'black')
        .attr("stroke-width", 1);
    //Create layer names
    mainG.selectAll('.layerName').data(layerNames, d => d.name).join('text')
        .attr('class', 'layerName')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('text-anchor', 'middle')
        .text(d => d.name);
    //Visualize the scales (xAxis)
    let maxAttribution = attributionScale.domain()[1];
    let xAxisScale = d3.scaleLinear().domain([-maxAttribution, maxAttribution]).range([0, modelVisualSettings.layerWidth]);
    let xAxisOutputScale = d3.scaleLinear().domain([0, 1]).range([0, modelVisualSettings.layerWidth]);
    mainG.selectAll('.xAxis').data(xAxes, d => d.id).join('g')
        .attr("transform", d => `translate(${d.x}, ${d.y})`).each(function (d) {
        let theAxis = d3.select(this);
        if (d.layerName === 'output') {
            theAxis.call(d3.axisBottom().scale(xAxisOutputScale).ticks(5));
        } else {
            theAxis.call(d3.axisBottom().scale(xAxisScale).ticks(5));
        }
    });


    //Create the bars
    mainG.selectAll('.attribution').data(bars, d => d.id).join('rect')
        .attr("id", d => `${d.id}`)
        .attr('class', 'attribution')
        .attr('x', (d, i) => d.x - (i % 2) * 100)
        .attr('y', d => d.y)
        .attr('height', d => d.height)
        .attr('width', 0)
        .attr('fill', 'none');
    //Update the output bars
    modelVisualSettings.output.forEach((val, i) => {
        mainG.select(`#output_${i}`)
            .classed('output', true)
            .attr('x', d => d.x - modelVisualSettings.layerWidth / 2)
            .attr('width', val * modelVisualSettings.layerWidth).attr('fill', 'steelblue');
    });

    //Create the bounding rect
    mainG.selectAll('.attributionBorder').data(bars, d => d.id).join('rect')
        .attr('x', d => d.x - modelVisualSettings.layerWidth / 2)
        .attr('y', d => d.y)
        .attr('height', d => d.height)
        .attr('width', modelVisualSettings.layerWidth)
        .attr('fill', 'white')
        .attr("opacity", 0.1)
        .attr('stroke-dasharray', "10 5")
        .attr("stroke-width", 1.5)
        .attr('stroke', 'black')
        .on('click', d => {
            let startNode = {'layerName': d.layerName, 'neuronIdx': d.neuronIdx};
            if (d.layerName === 'output') {
                dispatch.call('changeTargetLabel', this, d.neuronIdx);
            }
            dispatch.call('startNode', this, startNode);
        })
        .on("mouseover", (d) => {
            let msg = d.layerName === 'output' ? `Proportion: ${modelVisualSettings.output[d.neuronIdx].toFixed(2)}` : `Attribution: ${d.attribution.toFixed(2)}`;
            showTip(msg);
        })
        .on("mouseout", () => {
            hideTip();
        });

    //Create the labels for the neurons
    mainG.selectAll('.featureName').data(features, d => d.name).join('text')
        .attr('class', 'featureName')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .text(d => d.name);


    //Update the weights
    mainG.selectAll(".weightLine")
        .data(paths, d => d.id).join('path')
        .attr("class", "weightLine")
        .attr("d", d => link(d))
        .attr("fill", "none")
        .attr("stroke", d => d.weight >= 0 ? 'steelblue' : 'red')
        .attr("stroke-width", d => modelVisualSettings.weightScale(d.weight))
        .on("mouseover", (d) => {
            showTip(`Current weight: ${d.weight.toFixed(2)}`);
        })
        .on("mouseout", () => {
            hideTip();
        });

}

