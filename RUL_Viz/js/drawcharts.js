async function drawHeatmaps(data, container, selector) {
    let noOfItems = data.length;
    let noOfSteps = data[0].length;
    let noOfFeatures = data[0][0].length;
    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i);
    //Generate div for the inputs
    d3.select(`#${container}`).selectAll(`.${selector}`).data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter().append("div").attr("class", selector).attr("id", d => selector + d).style("margin-top", "10px").style("margin-bottom", "0px").style("border", "1px solid black").style("display", "inline-block");
    //Generate data.
    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let z = [];
        for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
            let row = [];
            for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
                row.push(data[itemIdx][stepIdx][featureIdx])
            }
            z.push(row);
        }
        if (!mapObjects[selector + featureIdx]) {
            //Draw the feature.
            let hm = new HeatMap(document.getElementById(selector + featureIdx), {x: x, y: y, z: z}, {
                noSvg: true,
                showAxes: false,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                borderWidth: 0,
                width: 100,
                height: 100
            });
            hm.plot();
            mapObjects[selector + featureIdx] = hm;
        } else {
            let hm = mapObjects[selector + featureIdx];
            hm.update({x: x, y: y, z: z})
        }

    }
}
async function drawLineCharts(data, normalizer, target, container, selector, lineChartSettings, noBorder) {
    let noOfItems = data.length;
    let noOfFeatures = data[0].length;
    //Generate steps
    let y = Array.from(Array(noOfItems), (yV, i) => i);
    //Generate div for the inputs
    let elms = d3.select(`#${container}`).selectAll(`.${selector}`).data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter().append("div").attr("class", selector).attr("id", d => selector + d).style("margin-top", "10px");
    if (typeof noBorder === 'undefined' || !noBorder) {
        elms.style("border", "1px solid black").style("display", "inline-block");
    }
    //Generate data.
    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let x = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            x.push(data[itemIdx][featureIdx]);
        }
        x = normalizer ? normalizer(x, -1.0, 1.0) : x;
        const lineChartData = [
            {
                x: x,
                y: y,
                series: 'output',
                marker: 'o',
                type: 'scatter'
            },
            {
                x: target,
                y: y,
                series: 'target',
                marker: 'x',
                type: 'scatter'
            }
        ];
        if (!mapObjects[selector + featureIdx]) {
            if (document.getElementById(selector + featureIdx) === null) {//In case the layer is deleted, just move on.
                console.log("continued");
                continue;
            }
            let lc = new LineChart(document.getElementById(selector + featureIdx), lineChartData, lineChartSettings);
            lc.plot();
            mapObjects[selector + featureIdx] = lc;
        } else {
            let lc = mapObjects[selector + featureIdx];
            lc.update(lineChartData);
        }

    }
}
function updateGraphTitle(graphId, newText) {
    let theNode = d3.select("#" + graphId).select(".graphTitle").node();
    theNode.innerHTML = newText;
}
function plotColorBar(theSvg, colorScale, id, width, height, orientation) {
    const domain = colorScale.domain();
    const minVal = domain[0];
    const domainSize = domain[domain.length - 1] - domain[0];
    const legend = theSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient' + id)
        .attr('x1', '0%') // left
        .attr('y1', '100%')
        .attr('x2', '100%') // to right
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
    colorScale.domain().forEach((dVal) => {
        legend.append("stop").attr("offset", Math.round((dVal - minVal) * 100 / domainSize) + "%").attr("stop-color", colorScale(dVal))
            .attr("stop-opacity", 1);
    });
    theSvg.append("g").append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", `url(#gradient${id})`)
        .attr("transform", "translate(0,0)");

    let axisG = theSvg.append("g").attr("transform", `translate(0,${height})`);
    let axisScale = d3.scaleLinear().domain(d3.extent(domain)).range([0, width]);
    let axisBottom = d3.axisBottom().scale(axisScale).ticks(5);
    axisG.call(axisBottom);
}
async function buildWeightPositionData(weightsT, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity) {
    return new Promise((resolve, reject) => {
        let weightData = weightsT.dataSync();
        let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(weightData.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
        let opacityScaler = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minOpacity, maxOpacity]);
        let lineData = [];
        let wShape = weightsT.shape;
        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;
        let noOfRightNodes = wShape[1] / noOfWeightTypes;
        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
            let leftNodeStartY = leftNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
                let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let leftNodeY = leftNodeStartY + typeIdx * spanForWeightTypes;
                    let rightNodeY = rightNodeStartY + typeIdx * spanForWeightTypes;
                    let idx = leftIdx * (wShape[1]) + typeIdx * noOfRightNodes + rightIdx;
                    let item = {
                        source: {
                            x: 0,
                            y: leftNodeY
                        },
                        target: {
                            x: weightWidth,
                            y: rightNodeY
                        },
                        idx: idx,
                        type: typeIdx,
                        weight: weightData[idx]
                    };
                    lineData.push(item);
                    // //TODO: may not break, but for now break for better performance
                    // break;
                }
            }
        }

        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScaler});
    });
}
async function buildWeightForFlattenLayer(weightsT, noOfLeftNodes) {
    return new Promise((resolve, reject) => {
        let cumulativeT = tf.tensor(weightsT.split(noOfLeftNodes).map(t => {
            let arr = t.cumsum().arraySync();
            return arr[arr.length - 1];
        }));
        resolve(cumulativeT);
    });
}
function normalizeTarget(data, min2, max2) {
    const min1 = d3.min(data);
    const max1 = d3.max(data);
    const range1 = max1 - min1;
    const range2 = max2 - min2;
    const result = data.map(d => {
        if (range1 === 0) {
            return (min2 + max2) / 2.0;
        }
        return min2 + ((d - min1) / range1) * range2;
    });
    return result;
}