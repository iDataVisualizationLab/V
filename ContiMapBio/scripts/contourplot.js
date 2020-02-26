
function processContiMapData(orderResults, machineTimeObject, colorScheme, reversedColorScheme, smooth, width, height, numOfRanges = 5) {
    let order = orderResults.order;
    let theVar = orderResults.variable;
    let y = order;
    let z = [];
    order.forEach(machine => {
        z.push(machineTimeObject[machine].map(st => st[theVar]));
    });
    let flatZ = z.flat();
    let flatZWithUndefined = flatZ.map(d => (d === NULL_VALUE) ? undefined : d);
    let min = d3.min(flatZWithUndefined);
    let max = d3.max(flatZWithUndefined);
    let extent = (max - min);
    let range = (max - min) / numOfRanges;

    let thresholds = [];
    for (let i = 0; i < numOfRanges; i++) {
        thresholds.push(min + i * range);
    }

    let colors = thresholds.map(v => colorScheme((v - min) / extent));
    if (reversedColorScheme) {
        colors.reverse();
    }
    let colorScale = d3.scaleOrdinal().domain(thresholds).range(colors);
    //Keep null so that it is considered as 0 in calculation => so it will bring the absent points together, but convert back to undefined so will not plot it (if not undefined it will plot as 0).
    let contours = d3.contours().thresholds(thresholds).size([z[0].length, z.length]).smooth(smooth)(flatZWithUndefined);

    let scaleX = width / z[0].length;
    let scaleY = height / z.length;

    //Store complete set of contour data.
    let contourData = {
        contours: contours,
        scaleX: scaleX,
        scaleY: scaleY,
        colorScale: colorScale,
        variable: theVar,
        y: y,
        z: z,
        thresholds: thresholds
    };
    return contourData;
}


function plotHeatmap(theGroup, heatmapData, width, height, onPlotHeatmapComplete, plotYAxis = true) {

    let timeSteps = heatmapData.timeSteps,
        machines = heatmapData.machines,
        data = heatmapData.data,
        colorScale = heatmapData.colorScale,
        thresholds = heatmapData.thresholds;
    let cellWidth = width / timeSteps.length,
        cellHeight = height / machines.length;

    //Draw the cells.
    machines.forEach((machine, mcI) => {
        timeSteps.forEach((timeStep, tsI) => {
            let value = data[mcI][tsI];
            if (value !== undefined && value !== null) {
                debugger
                theGroup.append('rect')
                    .attr("x", tsI * cellWidth)
                    .attr("y", mcI * cellHeight)
                    .attr("width", cellWidth)
                    .attr("height", cellHeight)
                    .attr("stroke", 'black')
                    .attr('stroke-width', 0.1)
                    .attr("fill", colorScale(valueToThreshold(value)));
            }
        });
    });

    if (plotYAxis) {
        drawYAxis(theGroup, machines, width, height);
    }


    function valueToThreshold(value) {
        return thresholds[d3.bisectLeft(thresholds, value) - 1];
    }
}

function plotContour(theGroup, data, width, height, onPlotContourComplete, fisheyeX, fisheyeY, plotYAxis = true) {

    let scaleX = data.scaleX;
    let scaleY = data.scaleY;
    let colorScale = data.colorScale;
    let contours = data.contours;

    //Building the path
    // var path = d3.geoPath().projection(scale(scaleX, scaleY, fisheyeX, fisheyeY));
    var path = d3.geoPath().projection(scale(scaleX, scaleY, fisheyeX, fisheyeY));
    theGroup.selectAll("path").data(contours).join("path").attr("d", path)
        .attr("fill", d => colorScale(d.value));

    //Draw the y axis
    if (plotYAxis) {
        drawYAxis(theGroup, data.y, width, height, fisheyeY);
    }

    //Draw one line at the end.
    // //Todo: This might overwrite the first element of the next variable
    // theGroup.append('line').attr('x1', 0).attr("y1", height).attr("x2", width).attr('y2', height)
    //     .attr("stroke-width", 1).attr("stroke", 'black');
    onPlotContourComplete(data.variable);
}

function scale(scaleX, scaleY, fisheyeX, fisheyeY) {
    return d3.geoTransform({
        point: function (x, y) {
            if (fisheyeX && fisheyeY) {
                this.stream.point(fisheyeX(x * scaleX), fisheyeY(y * scaleY));
            } else {
                this.stream.point(x * scaleX, y * scaleY);
            }
        }
    });
}

function drawTimeLine(timeSteps, settings, timeLineG) {
    let timeLineWidth = settings.timeLineWidth,
        timeLineHeight = settings.timeLineHeight,
        fisheyeX = settings.fisheyeX,
        tickLabelFormat = settings.tickLabelFormat,
        minDistance = settings.minDistance,
        textAnchor = settings.textAnchor,
        labelMarginLeft = settings.labelMarginLeft,
        labelMarginBottom = settings.labelMarginBottom,
        labelRotation = settings.labelRotation;

    if (typeof textAnchor === "undefined") {
        textAnchor = "middle";
    }
    if (typeof labelMarginLeft === "undefined") {
        labelMarginLeft = 0;
    }
    if (typeof labelMarginBottom === "undefined") {
        labelMarginBottom = 0;
    }
    if (typeof labelRotation === "undefined") {
        labelRotation = 0;
    }

    let extent = d3.extent(timeSteps);
    let xScale = d3.scaleLinear().domain([extent[0], extent[1] + 1]).range([0, timeLineWidth - settings.margins.left - settings.margins.right]);
    let timeStepData = [];
    let prevX = 0;
    let x;
    //Todo: We may need to spread from the center to two other ways=> since using this may not guarantee the one in the current mouse is displayed.
    timeSteps.forEach(ts => {
        x = fisheyeX ? fisheyeX(xScale(ts)) : xScale(ts);
        if (x - prevX >= minDistance) {
            timeStepData.push({x: x, tick: ts});
            prevX = x;
        }
    });

    let tickSelection = timeLineG.selectAll('.tickG').data(timeStepData, d => d.tick);
    let enterGroups = tickSelection.enter().append('g').attr('class', 'tickG');
    enterGroups.append('line').attr('stroke', 'black').attr("stroke-width", 1).attr('y2', -9);
    enterGroups.append('text').text(d => {
        if (tickLabelFormat) {
            return tickLabelFormat(d);
        } else {
            return d.tick;
        }

    }).attr("text-anchor", textAnchor).attr('y', '-1em')
        .attr("transform", `translate(${labelMarginLeft}, ${-labelMarginBottom}) rotate(${labelRotation})`);
    tickSelection.exit().remove();
    //Merge then Update
    tickSelection.merge(enterGroups).attr("transform", d => `translate(${d.x}, 0)`);
}

function drawYAxis(theGroup, machines, contourWidth, yAxisHeight, fisheyeY) {
    let yScale = d3.scaleBand().domain(machines).range([0, yAxisHeight]).paddingInner(0);
    let machineData = [];
    let minDistance = 30;
    let prevY = 0;
    let y;
    machines.forEach(mc => {
        y = fisheyeY ? fisheyeY(yScale(mc)) : yScale(mc);
        if (y - prevY >= minDistance) {
            machineData.push({y: y, tick: mc});
            prevY = y;
        }
    });

    let yAxisG = theGroup.selectAll('.yAxis').data([true]).join('g').attr('class', 'yAxis').attr("transform", `translate(0, 0)`);
    let tickSelection = yAxisG.selectAll('.tickG').data(machineData, d => d.tick);
    let enterGroups = tickSelection.enter().append('g').attr('class', 'tickG');
    enterGroups.append('line').attr('stroke', 'black').attr("stroke-width", 1).attr('x2', -9);
    enterGroups.append('text').text(d => d.tick).attr('text-anchor', 'end').attr('alignment-baseline', 'middle').attr("x", -12);
    tickSelection.exit().remove();
    //Merge then update
    tickSelection.merge(enterGroups).attr('transform', d => `translate(0, ${d.y})`);
}