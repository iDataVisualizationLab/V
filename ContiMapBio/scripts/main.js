/**Read the notes for the architecture of this main**/
const colorSchemes = {
    'GENE_FOLD_LOG2': d3.interpolateSpectral,
    'GENE_FOLD': d3.interpolateSpectral,
    'GENE_VALUE_NORMALIZED': d3.interpolateSpectral,
    'GENE_VALUE_AVERAGED_NORMALIZED': d3.interpolateSpectral,
    'GENE_VALUE_AVERAGED_NORMALIZED_DIFF': d3.piecewise(d3.interpolateRgb, ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac']),
};

//Info div
let settingDiv = document.getElementById('settingDiv');
let calculationTbl = document.getElementById('calculationTbl');
let settingTblStr = createTableStr([[{innerHTML: 'Number of neighbors (k)'}, {innerHTML: NUM_OF_NEIGHBORS}]]);
addInfoHTML(settingDiv, settingTblStr);

//Time records
let startTime = new Date(),
    donePreprocess, doneResampling, doneSimilarityCalc, doneOrdering;
let timeLineSettings = {};
let timeLineSettingsDiff = {};
let gap = 20;
let heatmapStrokeWidth = 0.1;

async function main() {
    let targets;
    let upregulated;
    let downregulated;
    let updownregulated;


    timeLineSettings.tickLabelFormat = tickLabelFormatGene;
    timeLineSettings.minDistance = 0;
    timeLineSettings.textAnchor = "start";
    timeLineSettings.labelMarginBottom = -10;
    timeLineSettings.labelMarginLeft = 15;
    timeLineSettings.labelRotation = -15;
    timeLineSettings.margins = margins;

    timeLineSettingsDiff.tickLabelFormat = tickLabelFormatGeneDiff;
    timeLineSettingsDiff.minDistance = 0;
    timeLineSettingsDiff.textAnchor = "start";
    timeLineSettingsDiff.labelMarginBottom = -10;
    timeLineSettingsDiff.labelMarginLeft = 15;
    timeLineSettingsDiff.labelRotation = -15;
    timeLineSettingsDiff.margins = {left: 0, right: 0};

    let machineTimeObjectDiff;
    await d3.csv('data/STOP1_targets.csv').then(data => {
        targets = data.map(d => d['target.at_id']);
    });
    await d3.csv('data/Targets_differentially_expressed.csv').then(data => {
        upregulated = data.map(d => d['TARGETS|upregulated']).filter(d => d !== "");
        downregulated = data.map(d => d['TARGETS|downregulated']).filter(d => d !== "");
        updownregulated = data.map(d => d['TARGETS|up|down']).filter(d => d !== "");
    });
    let timeStepsDiff;
    await d3.json('data/processed_gene_data_averaged_normalized_diff.json').then(data => {
        const nestedByMachines = d3.nest().key(d => d[FIELD_MACHINE_ID]).entries(data);
        machineTimeObjectDiff = _.object(nestedByMachines.map(d => [d.key, d.values]));
        timeStepsDiff = Array.from(new Set(data.map(d => d[FIELD_TIME_STAMP])));
    });

    d3.json('data/' + FILE_NAME).then(data => {
        //<editor-fold desc="filter data">
        //Filter zero base or treatment
        // data = data.filter(d => d.base_value !== 0 && d.treatment_value !== 0);

        //Bin the data.
        if (BINNED) {
            let range = 1 / NUM_OF_RANGES;
            let halfRange = range / 2;
            let thresholds = [];
            for (let i = 0; i < NUM_OF_RANGES; i++) {
                thresholds.push(i * range);
            }
            //Now do the binning
            data.forEach(item => {
                for (let i = 0; i < NUM_OF_RANGES; i++) {
                    let itemVal = item[VARIABLES[0]];
                    let threshold = thresholds[i];
                    if (itemVal >= threshold && itemVal < threshold + range) {
                        item[VARIABLES[0]] = threshold + halfRange;
                        break
                    }
                }
            });
        }


        // Filter for the target only.
        if (thisPage === "targets" && targets) {
            data = data.filter(d => targets.indexOf(d[FIELD_MACHINE_ID]) >= 0);
        }

        //Filter upregulated
        if (thisPage === "up" && upregulated) {
            data = data.filter(d => upregulated.indexOf(d[FIELD_MACHINE_ID]) >= 0);
        }

        //Filter downregulated
        if (thisPage === "down" && downregulated) {
            data = data.filter(d => downregulated.indexOf(d[FIELD_MACHINE_ID]) >= 0);
        }

        //Filter up/downregulated
        if (thisPage === 'updown' && updownregulated) {
            data = data.filter(d => updownregulated.indexOf(d[FIELD_MACHINE_ID]) >= 0);
        }
        //</editor-fold>

        const nestedByMachines = d3.nest().key(d => d[FIELD_MACHINE_ID]).entries(data);

        //Sort the data by time_stamp
        data.sort((a, b) => a[FIELD_TIME_STAMP] - b[FIELD_TIME_STAMP]);
        const timeSteps = Array.from(new Set(data.map(d => d[FIELD_TIME_STAMP])));

        const machines = Array.from(new Set(data.map(d => "" + d[FIELD_MACHINE_ID])));//Convert to string to use the autocomplete search box.
        //Add autocomplete box to search for
        // //This section is to set the autocomplete word
        autocomplete(document.getElementById("theWord"), machines, (theTextField) => {
            //TODO
        });

        let orders = [];

        //Get the size and set the sizes

        // width = Math.max(Math.round(window.innerWidth * 1 / 3), timeSteps.length);
        width = document.getElementById("main-part").getBoundingClientRect().width - margins.left - margins.right - gap;
        let widthDiff = width / 3;
        width = width - widthDiff;

        // width = 300;

        height = machines.length * pixelsPerRow;
        if (thisPage === "all") {
            heatmapStrokeWidth = 0;//Do not draw this since when compressed it makes the map blacken.
        }

        pixelsPerColumn = Math.ceil(width / timeSteps.length);


        fisheyeX = fisheye.scale(d3.scaleIdentity).domain([0, width]).focus(width / 2);
        fisheyeY = fisheye.scale(d3.scaleIdentity).domain([0, height]).focus(height / 2);

        svgWidth = widthDiff + width + margins.left + margins.right + gap;
        svgHeight = VARIABLES.length * height + margins.top + margins.bottom;
        //Now we can draw the timeLine.

        let timeLineWidth = svgWidth - widthDiff;
        //Add the SVG for the timeline
        let timeLineSvg = d3.select('#timeLineDiv').append("svg").attr('width', svgWidth).attr('height', timeLineHeight);
        //Add a rect for the background
        timeLineSvg.append("rect").attr("x", 0).attr("y", 0).attr("width", svgWidth).attr("height", timeLineHeight).attr("fill", "white");
        //Add a line at the bottom
        timeLineSvg.append('line').attr('x1', 0).attr('y1', timeLineHeight - 1).attr('x2', timeLineWidth + widthDiff).attr('y2', timeLineHeight - 1)
            .attr('stroke', 'black').attr('stroke-width', 1);
        //Add a group to display the timeline to
        let timeLineG = timeLineSvg.append("g").attr("id", "timeLineG").attr("transform", `translate(${margins.left}, ${timeLineHeight - 1})`);//-1 is for the bottom line
        timeLineSettings.timeLineWidth = timeLineWidth;
        timeLineSettings.timeLineHeight = timeLineHeight;
        timeLineSettings.fisheyeX = undefined;
        drawTimeLine(timeSteps, timeLineSettings, timeLineG);

        //Draw timeline for the diff.
        let timeLineGDiff = timeLineSvg.append("g").attr("id", "timeLineGDiff").attr("transform", `translate(${timeLineWidth}, ${timeLineHeight - 1})`);//-1 is for the bottom line
        let timeLineWidthDiff = widthDiff;
        timeLineSettingsDiff.timeLineWidth = timeLineWidthDiff;
        timeLineSettingsDiff.timeLineHeight = timeLineHeight;
        timeLineSettingsDiff.fisheyeX = undefined;

        drawTimeLine(timeStepsDiff, timeLineSettingsDiff, timeLineGDiff);

        //Add svg and the groups for the contour plots of the variables.
        let mainSvg = d3.select(`#contourDiv`).append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
        let mainGroup = mainSvg
            .append("g").attr("transform", `translate(${margins.left},${margins.top})`);
        let diffGroup = mainSvg
            .append("g").attr("transform", `translate(${margins.left + width + gap},${margins.top})`);
        //Add the groups
        mainGroup.selectAll('.contourPlot').data(VARIABLES).enter().append("g")
            .attr('class', 'contourPlot').attr('id', (d, i) => `contourPlot${i}`)
            .attr("transform", (d, i) => `translate(0, ${i * height})`);
        //Add labels for the groups
        mainGroup.selectAll('.contourPlotVariable').data(VARIABLES).enter().append("g")
            .attr('class', 'contourPlotVariable').attr('id', (d, i) => `contourPlotVariable${i}`)
            .attr("transform", (d, i) => `translate(0, ${i * height})`).append('text').text(d => d).attr("dy", '1.2em').attr('dx', '0.5em');

        //Add the groups for the differences
        diffGroup.selectAll('.contourPlotDiff').data(VARIABLES_DIFF).enter().append("g")
            .attr('class', 'contourPlotDiff').attr('id', (d, i) => `contourPlotDiff${i}`)
            .attr("transform", (d, i) => `translate(0, ${i * height})`);
        //Add labels for the groups
        diffGroup.selectAll('.contourPlotVariableDiff').data(VARIABLES_DIFF).enter().append("g")
            .attr('class', 'contourPlotVariableDiff').attr('id', (d, i) => `contourPlotVariableDiff${i}`)
            .attr("transform", (d, i) => `translate(0, ${i * height})`).append('text').text(d => d).attr("dy", '1.2em').attr('dx', '0.5em');


        //Display number of machines
        addInfoRow(calculationTbl, [{innerHTML: 'Machines'}, {
            innerHTML: machines.length,
            styles: [{key: 'textAlign', value: 'right'}]
        }]);
        //Display number of time-steps
        addInfoRow(calculationTbl, [{innerHTML: 'Time-steps'}, {
            innerHTML: timeSteps.length,
            styles: [{key: 'textAlign', value: 'right'}]
        }]);
        //Sort the machines so we can gurantee the naming order from source to target (source always < target)
        machines.sort();


        //Convert into object for faster accessing.
        const machineTimeObject = _.object(nestedByMachines.map(d => [d.key, d.values]));

        //For time logging purpose.
        donePreprocess = new Date();
        addInfoRow(calculationTbl, [{innerHTML: 'Pre-processing'}, {
            innerHTML: (donePreprocess - startTime) + "ms",
            styles: [{key: 'textAlign', value: 'right'}]
        }]);

        onCompleteResampling(machineTimeObject);

        function onCompleteResampling(machineTimeObject) {
            //Process all the rSqared
            let similarityResults = [];
            let similarityParts = [];
            for (let i = 0; i < maxWorkers; i++) {
                similarityParts.push([]);
            }
            let similarityCounter = 0;

            /**This is one to n others**/
            //<editor-fold desc="This is one to n others">
            //Add average value to the machineTimeObj
            orders = VARIABLES.map(v => {
                //Avg variable name
                let avgV = 'avg' + v;
                //Add average value
                d3.keys(machineTimeObject).forEach(mc => {
                    if (typeof ORDER_AVERAGE_STEPS !== "undefined" && ORDER_AVERAGE_STEPS.length > 0) {
                        let theStepValues = ORDER_AVERAGE_STEPS.map(step => {
                            return machineTimeObject[mc][step][v];
                        });
                        machineTimeObject[mc][avgV] = d3.mean(theStepValues);
                    } else {
                        machineTimeObject[mc][avgV] = d3.mean(machineTimeObject[mc].map(d => d[v]));
                    }
                });
                //Copy
                let vOrder = machines.slice();
                vOrder.sort((a, b) => machineTimeObject[a][avgV] - machineTimeObject[b][avgV]);
                return vOrder;
            });

            if (typeof ORDER_AVERAGE_ONLY !== "undefined" && ORDER_AVERAGE_ONLY) {
                //Skip calculation for links to be calculated
                //Skip similarity calculation
                //Skip ordering
                let totalDraws = VARIABLES.length;
                let drawingResultCounter = 0;
                orders.forEach((order, i) => {
                    let orderResults = {
                        variable: VARIABLES[i],
                        order: order,
                    }
                    processOrder(orderResults, drawingResultCounter, totalDraws);
                });
                return;//Skip all the rest
            }


            //Get the links to be calculated
            let linksToBeCalculated = {};
            VARIABLES.forEach((v, i) => {
                //For all prev => add its next n.
                let mcLength = orders[i].length;
                for (let j = 0; j < mcLength; j++) {
                    let keyJ = orders[i][j];
                    let valuesJ = machineTimeObject[keyJ];
                    for (let k = 1; k <= NUM_OF_NEIGHBORS; k++) {
                        if (j + k < mcLength) {
                            let keyK = orders[i][j + k];
                            let key = (keyJ < keyK) ? keyJ + "," + keyK : keyK + "," + keyJ;
                            //If not exists yet in the links to be calculated then add
                            if (!linksToBeCalculated[key]) {
                                linksToBeCalculated[key] = {};//This is just a dummy object to check if exists or not condition => we don't need to store value for this.
                                let valuesK = machineTimeObject[keyK];
                                let sd = {x1: valuesJ, x2: valuesK};
                                similarityParts[similarityCounter % maxWorkers].push(sd);
                                similarityCounter++;
                            }
                        }
                    }
                }
            });
            //</editor-fold>
            /**End of n others section**/

            let similarityResultCounter = 0;
            //Now start a worker for each of the part
            similarityParts.forEach((part, i) => {
                startWorker(similarityWorkerPath, part, onSimilarityResult, i);
            });

            function onSimilarityResult(evt) {
                similarityResultCounter += 1;
                similarityResults = similarityResults.concat(evt);
                if (similarityResultCounter === similarityParts.length) {
                    resetWorkers();
                    onCompleteSimilarityCal(similarityResults);

                    doneSimilarityCalc = new Date();
                    addInfoRow(calculationTbl, [{innerHTML: 'Done similarity calculation'}, {
                        innerHTML: numberWithCommas(doneSimilarityCalc - doneResampling) + 'ms',
                        styles: [{key: 'textAlign', value: 'right'}]
                    }]);
                }
            }

        }

        function processOrder(orderResults, drawingResultCounter, totalDraws) {
            let startDrawing = new Date();
            let theVar = orderResults.variable;
            let theGroup = d3.select(`#contourPlot${VARIABLES.indexOf(theVar)}`);
            let contiMapData = processContiMapData(orderResults, machineTimeObject, colorSchemes[theVar], true, smooth, width, height, NUM_OF_RANGES);
            let colorScale = contiMapData.colorScale;
            //Store it for future use
            allColorScales[theVar] = colorScale;
            let contours = contiMapData.contours;
            //This section store the contours for area calculation later-on.
            contours.forEach((ct, i) => {
                    let dt = {
                        variable: theVar,
                        layerIndex: i,
                        coordinates: ct.coordinates,
                        layerValue: ct.value
                    }
                    allContours.push(dt);
                }
            );

            //Save it to use later when mouseover.
            theGroup.node().contourData = contiMapData;
            if (!HEAT_MAP) {
                plotContour(theGroup, contiMapData, width, height, onDrawingCompleted);
            } else {
                let heatmapData = {
                    timeSteps: timeSteps,
                    machines: contiMapData.y,
                    data: contiMapData.z,
                    colorScale: colorScale,
                    thresholds: contiMapData.thresholds
                };
                plotHeatmap(theGroup, heatmapData, width, height, () => {
                }, true, heatmapStrokeWidth);
            }

            //After all, process the sticky now here (since once done display we will have the offset information.
            setupScrollStickyTimeLine();

            let doneDrawing = new Date();
            //Hide the loader
            hideLoader();
            addInfoRow(calculationTbl, [{innerHTML: `Done drawing ${theVar}`}, {
                innerHTML: numberWithCommas(doneDrawing - startDrawing) + 'ms',
                styles: [{key: 'textAlign', value: 'right'}]
            }]);

            //</editor-fold desc="these lines are for the differences">
            function onDrawingCompleted(theVar) {
                //Done all drawing, start processing the contour area calculation.
                let totalPolygonLayerCount = allContours.length;
                let polygonLayerResultCounter = 0;
                let allContourAreas = [];
                if (totalDraws === drawingResultCounter + 1) {//Still + 1 here in the local (since the global is 1 step late)
                    //Start calculating from here
                    allContours.forEach((cl, i) => {
                        startWorker(areaWorkerPath, cl, onLayerAreaResult, i);
                    });
                    //Also we only setup the svg mouse move when all the drawings are done
                    if (fisheyeEnabled) {
                        setupMouseMove();
                    }
                }

                /**
                 *
                 * @param result result will have this format {variable: theVar, layerIndex: layerIndex, 'areas': results, layerValue: layerValue}
                 */
                function onLayerAreaResult(result) {
                    allContourAreas.push(result);
                    polygonLayerResultCounter += 1;
                    if (polygonLayerResultCounter === totalPolygonLayerCount) {
                        resetWorkers();
                        //Display contour info area.
                        displayContourAreasInfo(allContourAreas);
                    }
                }
            }

            let theGroupDiff = d3.select(`#contourPlotDiff${VARIABLES.indexOf(theVar)}`);
            let orderResultsDiff = {};
            orderResultsDiff.order = orderResults.order;
            let theVarDiff = VARIABLES_DIFF[VARIABLES.indexOf(theVar)];
            orderResultsDiff.variable = theVarDiff;

            let contiMapDataDiff = processContiMapData(orderResultsDiff, machineTimeObjectDiff, colorSchemes[theVarDiff], true, smooth, widthDiff, height, NUM_OF_RANGES_DIFF);
            let colorScaleDiff = contiMapDataDiff.colorScale;
            if (!HEAT_MAP) {
                plotContour(theGroupDiff, contiMapDataDiff, widthDiff, height, () => {
                }, undefined, undefined, false);
            } else {
                let heatmapData = {
                    timeSteps: timeStepsDiff,
                    machines: contiMapDataDiff.y,
                    data: contiMapDataDiff.z,
                    colorScale: colorScaleDiff,
                    thresholds: contiMapDataDiff.thresholds
                };
                plotHeatmap(theGroupDiff, heatmapData, widthDiff, height, () => {
                }, false, heatmapStrokeWidth);
            }
            //</editor-fold>
        }

        function onCompleteSimilarityCal(similarityResults) {
            let orderParts = VARIABLES.map((theVar) => {
                return similarityResults.map(similarity => {
                    return {
                        source: similarity.source,
                        target: similarity.target,
                        weight: similarity.weights[theVar]
                    }
                });
            });

            orderParts.forEach((part, i) => {
                //Build the best order.
                startWorker(orderWorkerPath, {
                    theVar: VARIABLES[i],
                    machines: orders[i],
                    links: part
                }, onOrderResult, i);
            });

            let orderingResultCounter = 0;
            let totalDraws = VARIABLES.length;
            let drawingResultCounter = 0;

            function onOrderResult(orderResults) {
                orderingResultCounter += 1;
                if (orderingResultCounter === orderParts.length) {
                    doneOrdering = new Date();
                    addInfoRow(calculationTbl, [{innerHTML: 'Done ordering'}, {
                        innerHTML: numberWithCommas(doneOrdering - doneSimilarityCalc) + 'ms',
                        styles: [{key: 'textAlign', value: 'right'}]
                    }]);
                    resetWorkers();
                }
                processOrderResults(orderResults);
            }

            function processOrderResults(orderResults) {
                processOrder(orderResults, drawingResultCounter, totalDraws);
                drawingResultCounter += 1;
            }
        }

        function setupMouseMove() {
            function setFocus(groupIndex, fisheyeX, fisheyeY) {
                let contourPlot = d3.select(`#contourPlot${groupIndex}`);
                plotContour(contourPlot, contourPlot.node().contourData, width, height, () => {
                }, fisheyeX, fisheyeY);
                //Redraw timeline
                timeLineSettings.fisheyeX = fisheyeX;
                drawTimeLine(timeSteps, timeLineSettings, timeLineG);
            }

            //Setup mouseover on the svg.
            mainSvg.on("mousemove", function () {
                let mouse = d3.mouse(this);
                let mouseX = mouse[0] - margins.left;
                let mouseY = mouse[1] - margins.top;
                //If out of bound simply reset
                if (mouseX <= 0 || mouseX >= width || mouseY <= 0 || mouseY >= VARIABLES.length * height) {
                    return;
                }
                //Check which group
                let groupIndex = Math.floor(mouseY / height);
                mouseY = mouseY - groupIndex * height;
                fisheyeX.focus(mouseX);
                fisheyeY.focus(mouseY);
                //First element
                setFocus(groupIndex, fisheyeX, fisheyeY);
            });
            mainSvg.on("mouseout", function () {
                //Rest the contour (without having fish eye.
                VARIABLES.forEach((v, i) => {
                    setFocus(i, undefined, undefined);
                });
            });
        }
    });
};
main();


function displayContourAreasInfo(allContourAreas) {
    let theTbl = document.getElementById('contourTbl');
    allContourAreas.sort((a, b) => {
        return a.variable !== b.variable ? a.variable.localeCompare(b.variable) : a.layerIndex - b.layerIndex;
    });
    let nestedByVariable = d3.nest().key(d => d.variable).entries(allContourAreas);

    nestedByVariable.forEach(variable => {
        variable.values.forEach((vl, i) => {
            let row = [];
            if (i === 0) {
                //Variable name is expanded in all rows + 1 for the total
                row.push({
                    innerHTML: vl.variable,
                    attributes: [{key: 'rowspan', value: variable.values.length + 1}]
                });
                //Label is extended in all rows
                row.push({
                    innerHTML: 'Layer value',
                    attributes: [{key: 'rowspan', value: variable.values.length}]
                });
            }
            row.push({
                innerHTML: numberWithCommas(Math.round(vl.layerValue)),
                styles: [{
                    key: 'backgroundColor',
                    value: allColorScales[vl.variable](vl.layerValue)
                }, {key: 'textAlign', value: 'right'}]
            })
            if (i == 0) {
                //Label is extended in all rows
                row.push({
                    innerHTML: 'Blob count',
                    attributes: [{key: 'rowspan', value: variable.values.length}]
                });
            }
            row.push({
                innerHTML: vl.areas.length,
                styles: [{
                    key: 'backgroundColor',
                    value: allColorScales[vl.variable](vl.layerValue)
                }, {key: 'textAlign', value: 'right'}]
            });
            if (i == 0) {
                //Label is extended in all rows
                row.push({
                    innerHTML: 'Area subtotal',
                    attributes: [{key: 'rowspan', value: variable.values.length}]
                });
            }
            row.push({
                innerHTML: numberWithCommas(Math.round(d3.sum(vl.areas))),
                styles: [{
                    key: 'backgroundColor',
                    value: allColorScales[vl.variable](vl.layerValue)
                }, {key: 'textAlign', value: 'right'}]
            });
            addInfoRow(theTbl, row);
        });
        //Add row for the total
        let totalR = [];
        //Total layers
        totalR.push({innerHTML: 'Ranges count', styles: [{key: 'font-weight', value: 'bold'}]});
        totalR.push({innerHTML: variable.values.length, styles: [{key: 'textAlign', value: 'right'}]});
        //Total Area count
        totalR.push({innerHTML: 'Total', styles: [{key: 'font-weight', value: 'bold'}]});
        totalR.push({
            innerHTML: d3.sum(variable.values.map(vl => vl.areas.length)),
            styles: [{key: 'textAlign', value: 'right'}]
        });
        //Total Area count
        totalR.push({innerHTML: 'Total', styles: [{key: 'font-weight', value: 'bold'}]});
        totalR.push({
            innerHTML: numberWithCommas(d3.sum(variable.values.map(vl => Math.round(d3.sum(vl.areas))))),
            styles: [{key: 'textAlign', value: 'right'}]
        });
        addInfoRow(theTbl, totalR);
    });
}

function setupScrollStickyTimeLine() {
    window.onscroll = processScroll;
    let timeLine = document.getElementById("timeLineDiv");
    let sticky = timeLine.offsetTop;

    function processScroll() {
        if (window.pageYOffset >= sticky) {
            timeLine.classList.add("sticky")
        } else {
            timeLine.classList.remove("sticky");
        }
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
