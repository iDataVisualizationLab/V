let booleanTicks = {
    tickValues: [0, 1],
    tickFormat: (d) => d == 0 ? "false" : "true"
};
let modelConfig = {
    input_features: ['age', 'sibsp', 'parch', 'fare', 'female', 'male', 'embark_C', 'embark_Q', 'embark_S', 'class_1', 'class_2', 'class_3'],
    input_types: {
        'age': {
            tickValues: [0, 40, 80]
        },
        'sibsp': {
            tickValues: [0, 4, 8]
        },
        'parch': {
            tickValues: [0, 2, 4]
        },
        'fare': {
            tickValues: [0, 100, 200]
        },
        'female': booleanTicks,
        'male': booleanTicks,
        'embark_C': booleanTicks,
        'embark_Q': booleanTicks,
        'embark_S': booleanTicks,
        'class_1': booleanTicks,
        'class_2': booleanTicks,
        'class_3': booleanTicks
    },
    layers: [{name: 'input', neurons: 12}, {name: 'sigmoid1', neurons: 8}, {
        name: 'sigmoid2',
        neurons: 6
    }, {name: 'output', neurons: 2}],
    layer_activation_mappings: {'sigmoid1': 'linear1', 'sigmoid2': 'linear2', 'output': 'linear3'},
    output: [0.7150127226, 0.28498727736]
}

function buildModelItemsAndSettings(modelConfig, modelWeights, neuronValues) {
    let modelVisualSettings = {
        width: 1600,
        height: 900,
        margins: {top: 100, left: 50, right: 50, bottom: 50},
        layerLabelMargin: 30,
        axisMargin: 20,
        featureLabelMargin: 5,
        output: modelConfig.output,
        size: 40,
        scatter: {
            radius: 2,
            margins: {top: 5, left: 0, right: 0, bottom: 5}
        },

    }
    //Compute the instance color scheme.
    let probColorScale = d3.interpolateRdYlGn;
    modelVisualSettings['surviveColorScheme'] = getColorForSurviveProb;

    function getColorForSurviveProb(instanceIdx) {
        return probColorScale(neuronValues.output[instanceIdx][1]);
    }

    //Complete computation of the settings info.
    let networkWidth = modelVisualSettings.width - modelVisualSettings.margins.left - modelVisualSettings.margins.right;
    let networkHeight = modelVisualSettings.height - modelVisualSettings.margins.top - modelVisualSettings.margins.bottom;
    let layerCounts = 2 * modelConfig.layers.length - 1; //number of layers for the bars and number of layers - 1 for the weights
    let layerWidth = networkWidth / (layerCounts);
    let maxNumberOfNeurons = Math.max(...modelConfig.layers.map(layer => layer.neurons));
    let space = (networkHeight - maxNumberOfNeurons * modelVisualSettings.size) / (maxNumberOfNeurons - 1)

    modelVisualSettings['networkWidth'] = networkWidth;
    modelVisualSettings['networkHeight'] = networkHeight;
    modelVisualSettings['layerWidth'] = layerWidth;

    //Margin for the scatter
    modelVisualSettings.scatter.displayHeight = modelVisualSettings.size - modelVisualSettings.scatter.margins.top - modelVisualSettings.scatter.margins.bottom;
    //The scales for the scatter
    let neuronYScales = buildNeuronScales(modelConfig, neuronValues, modelVisualSettings.scatter.displayHeight);
    //Also do the sorting for the outputs here.
    let deadArgSort = argsort(neuronValues['output'].map(d => d[0]));
    let outputOrder = [];
    deadArgSort.forEach((v, i) => {
        outputOrder[v] = i;
    })
    //Build the bars
    let bars = [];
    let features = [];
    let lines = [];
    let xAxes = [];
    let layerNames = [];
    let scatterPoints = [];
    let inputValueAxes = [];
    let inputNeurons = modelConfig.layers[0].neurons;
    for (let inputIdx = 0; inputIdx < inputNeurons; inputIdx++) {
        let inputAxis = {
            id: `inputAxis_${inputIdx}`,
            inputIdx: inputIdx,
            x: 0,
            y: inputIdx * (modelVisualSettings.size + space) + modelVisualSettings.scatter.margins.top,
            scale: neuronYScales['input'][inputIdx]
        };
        inputValueAxes.push(inputAxis);
    }

    let outputXAxisScaleForInstances = d3.scaleLinear().domain([0, neuronValues['output'].length]).range([0, layerWidth]);
    modelConfig.layers.forEach((layer, layerIdx) => {
        let layerStartX = 2 * layerWidth * layerIdx + layerWidth / 2; //layerWidth/2 since we start at the center for positive/negative
        let layerStartY = (networkHeight - (layer.neurons * modelVisualSettings.size + (layer.neurons - 1) * space)) / 2;


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
                'height': modelVisualSettings.size,
                'layerName': layer.name,
                'neuronIdx': neuronIdx
            };
            bar['x'] = layerStartX;
            bar['y'] = layerStartY + neuronIdx * (modelVisualSettings.size + space);
            bars.push(bar);
            //The labels for the feature
            let feature = {
                name: getFeatureName(layer.name, neuronIdx),
                x: bar.x - layerWidth / 2,
                y: bar.y - modelVisualSettings.featureLabelMargin,
            }
            features.push(feature);
            //Scatter points for the individual attributions of this feature

            //Build the yScale
            let yScale = neuronYScales[layer.name][neuronIdx];
            let scatterX = bar.x;//TODO: the margins should come here
            let scatterY = bar.y + modelVisualSettings.scatter.margins.top; //TODO: the margins should come here

            for (let instanceIdx = 0; instanceIdx < neuronValues[layer.name].length; instanceIdx++) {
                let scatterPoint = {
                    layerName: layer.name,
                    neuronIdx: neuronIdx,
                    instanceIdx: instanceIdx,
                    scatterX: scatterX,
                    scatterY: scatterY,
                    x: scatterX + (layer.name === 'output' ? outputXAxisScaleForInstances(outputOrder[instanceIdx]) - layerWidth / 2 : 0), //This is now the same as the base, but will be updated when there is attribution
                    y: scatterY + yScale(neuronValues[layer.name][instanceIdx][neuronIdx]),
                    value: neuronValues[layer.name][instanceIdx][neuronIdx],
                    attribution: 0,
                    color: 'steelblue',
                    radius: modelVisualSettings.scatter.radius,
                    id: `${layer.name}_${neuronIdx}_${instanceIdx}`
                };
                scatterPoints.push(scatterPoint);
            }

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
            let sourceLayerStartY = (networkHeight - (sourceLayer.neurons * modelVisualSettings.size + (sourceLayer.neurons - 1) * space)) / 2 + modelVisualSettings.size / 2;
            let targetLayerStartX = sourceLayerStartX + layerWidth;
            let targetLayerStartY = (networkHeight - (nextLayer.neurons * modelVisualSettings.size + (nextLayer.neurons - 1) * space)) / 2 + modelVisualSettings.size / 2;

            for (let sourceNeuronIdx = 0; sourceNeuronIdx < sourceLayer.neurons; sourceNeuronIdx++) {
                for (let targetNeuronIdx = 0; targetNeuronIdx < nextLayer.neurons; targetNeuronIdx++) {
                    let weight = modelWeights[`${modelConfig.layer_activation_mappings[nextLayer.name]}.weight`][targetNeuronIdx][sourceNeuronIdx]
                    let path = {
                        source: {
                            x: sourceLayerStartX,
                            y: sourceLayerStartY + sourceNeuronIdx * (modelVisualSettings.size + space)
                        },
                        target: {
                            x: targetLayerStartX,
                            y: targetLayerStartY + targetNeuronIdx * (modelVisualSettings.size + space)
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
        'xAxes': xAxes,
        'scatterPoints': scatterPoints,
        'inputValueAxes': inputValueAxes
    };
}

function updateModel(modelConfig, modelVisualSettings, attributionData, startNode, targetLabel) {
    let activeBars = buildBarData(attributionData, startNode, targetLabel);
    let attributionScales = buildAttributionScales(modelConfig, activeBars, startNode, modelVisualSettings.layerWidth);
    updateAttributions(activeBars, startNode, attributionScales);
    updateIndividualAttributions(activeBars, startNode, attributionScales);
    updateWeights(activeBars, startNode);
}

function updateIndividualAttributions(activeBars, startNode, attributionScales) {

    let mainG = d3.select("#mainG");

    mainG.selectAll('.individual_attribution').each(function (d) {
        //We don't do anything to the outputs
        if (d.layerName === 'output') {
            return;
        }

        let scatterPoint = d3.select(this);

        let activeItem = activeBars.find(i => i.id === `${d.layerName}_${d.neuronIdx}`);

        if (activeItem) {
            //Copy the properties of the activeItem to the current data object
            d.attribution = activeItem['individual_attributions'][d.instanceIdx];
            scatterPoint.attr('cx', d => d.x + (d.attribution >= 0 ? attributionScales[d.layerName](d.attribution) : -attributionScales[d.layerName](-d.attribution)))
                .attr('opacity', 1.0);

        } else {
            scatterPoint.transition(1000).attr('opacity', 0);
        }
    });
}

function updateAttributions(activeBars, startNode, attributionScales) {
    let mainG = d3.select('#mainG');

    mainG.selectAll('.attribution').each(function (d) {
        //We don't do anything to the outputs
        if (d.layerName === 'output') {
            return;
        }
        let bar = d3.select(this);
        let activeItem = activeBars.find(i => i.id === d.id);

        if (activeItem) {
            //Copy the properties of the activeItem to the current data object
            d.attribution = activeItem.attribution;

            bar.attr('x', d => d.x - (d.attribution >= 0 ? 0 : attributionScales[d.layerName](-d.attribution)))
                .attr('fill', 'none')
                .attr("stroke-width", 1.0)
                .attr("stroke", 'black');

            bar.transition(1000).attr('width', d => attributionScales[d.layerName](Math.abs(d.attribution)));

        } else {
            bar.attr('x', d => d.x);
            bar.transition(1000).attr('width', 0);
        }
    });

    //Update the scales.
    mainG.selectAll('.attributionAxis').each(function (d) {
        let theAxis = d3.select(this);
        if (d.layerName === 'output') {
            return;
        } else {
            // Visualize the scales (xAxis)
            // attributionScale ranging from 0 to maxAttribution, and 0 to layerWidth/2.
            // However, for xAxis we are ranging from -maxAttribution to +maxAttribution and layerWidth, to have 0 at the center
            let maxAttribution = attributionScales[d.layerName].domain()[1];
            let layerWidth = 2 * attributionScales[d.layerName].range()[1];
            let xAxisScale = d3.scaleLinear().domain([-maxAttribution, maxAttribution]).range([0, layerWidth]);
            theAxis.call(d3.axisBottom().scale(xAxisScale).ticks(5));
        }
    });
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
        modelVisualSettings = modelData.modelVisualSettings, features = modelData.features, xAxes = modelData.xAxes,
        scatterPoints = modelData.scatterPoints, inputValueAxes = modelData.inputValueAxes;

    let link = d3.linkHorizontal()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });
    let mainSvg = d3.select('#mainSvg');
    mainSvg.attr("width", modelVisualSettings.width).attr("height", modelVisualSettings.height);

    let mainG = mainSvg.append("g").attr("id", "mainG")
        .attr("class", 'mainG')
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
        .attr('font-size', '20')
        .text(d => d.name);

    // Visualize the scales (xAxis)
    // attributionScale ranging from 0 to maxAttribution, and 0 to layerWidth/2.
    // However, for xAxis we are ranging from -maxAttribution to +maxAttribution and layerWidth, to have 0 at the center
    let maxAttribution = attributionScale.domain()[1];
    let xAxisScale = d3.scaleLinear().domain([-maxAttribution, maxAttribution]).range([0, modelVisualSettings.layerWidth]);
    let xAxisOutputScale = d3.scaleLinear().domain([0, 1]).range([0, modelVisualSettings.layerWidth]);
    mainG.selectAll('.attributionAxis').data(xAxes, d => d.id).join('g')
        .attr('class', 'attributionAxis')
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
    //For the survive
    let deadProp = modelVisualSettings.output[0]
    mainG.select(`#output_${0}`)
        .classed('output', true)
        .attr('x', d => d.x - modelVisualSettings.layerWidth / 2 + (1 - deadProp) * modelVisualSettings.layerWidth)
        .attr('width', deadProp * modelVisualSettings.layerWidth).attr('fill', 'none')
        .attr("stroke-width", 1)
        .attr("stroke", "black");

    let surviveProb = modelVisualSettings.output[1];
    mainG.select(`#output_${1}`)
        .classed('output', true)
        .attr('x', d => d.x - modelVisualSettings.layerWidth / 2)
        .attr('width', surviveProb * modelVisualSettings.layerWidth).attr('fill', 'none')
        .attr("stroke-width", 1)
        .attr("stroke", "black");


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
        });
    // .on("mouseover", (d) => {
    //     let msg = d.layerName === 'output' ? `Proportion: ${modelVisualSettings.output[d.neuronIdx].toFixed(2)}` : `Attribution: ${d.attribution.toFixed(2)}`;
    //     showTip(msg);
    // })
    // .on("mouseout", () => {
    //     hideTip();
    // });


    //Visualize the scatter points for the attributions
    mainG.selectAll('.individual_attribution').data(scatterPoints, d => d.id).join('circle')
        .attr('class', 'individual_attribution')
        .attr('id', d => d.id)
        .attr('cx', d => d.x) //This will be updated by the attribution
        .attr('cy', d => d.y) //Will visualize the position of the output now since it is fixed.
        .attr('r', d => d.radius)
        .attr('fill', d => modelVisualSettings.surviveColorScheme(d.instanceIdx))
        .attr('fill-opacity', 1.0);


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

    //Visualize the input value axes
    mainG.selectAll(".inputValueAxis").data(inputValueAxes, d => d.id).join('g')
        .attr("class", 'inputValueAxis')
        .attr("id", d => d.id)
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .each(function (d) {
            let theAxisG = d3.select(this);
            let theAxis = d3.axisLeft().scale(d.scale);
            let inputType = modelConfig.input_types[modelConfig.input_features[d.inputIdx]];
            if(inputType.tickValues){
                theAxis.tickValues(inputType.tickValues);
            }
            if(inputType.tickFormat){
                theAxis.tickFormat(inputType.tickFormat);
            }
            theAxisG.call(theAxis);
        });


}
