/** Some ideas of this class are adopted from: https://github.com/tensorflow/playground/blob/master/src/linechart.ts*****/
import * as d3 from 'd3';
import {color} from 'd3-color';
import {quantile} from "simple-statistics";

/**
 * A two dimensional x and y coordinates with the value (z).
 * x    {Array}: x values (for x axis)
 * y    {Array}: y values (for each of the x value)
 * series   string: "Name of the series"
 * marker   letter: used to mark the point
 * tye  ["scatter", "line"]: used to control whether it is a scatter plot or a line chart
 */
export type LineAnnotation = {
    x0: any,
    y0: any,
    x1: any,
    y1: any,
    color?: any,
    strokeWidth?: number,
    valueType?: string, //'paper': means pixel coordinate, 'value' means original value of x, y need to be converted using scalers, 'index' means index of the items.
}
export type XLineAnnotation = {
    x: any,
    color?: any,
    strokeWidth?: number,
    valueType?: string, //'paper': means pixel coordinate, 'value' means original value of x, y need to be converted using scalers, 'index' means index of the items.
}
export type YLineAnnotation = {
    y: any,
    color?: any,
    strokeWidth?: number,
    valueType?: string, //'paper': means pixel coordinate, 'value' means original value of x, y need to be converted using scalers, 'index' means index of the items.
}

export type Annotations = {
    'line'?: LineAnnotation,
    'xLine'?: XLineAnnotation,
    'yLine'?: YLineAnnotation,
}

export type LineChartTrace = {
    [key: string]: any;
    x: number[],
    y: number[],
    series: string,
    marker?: string,
    type?: string,
    abstractLevel?: AbstractLevel,
    colorScale?: any,
}
export type Legend = {
    x: number,
    y: number
}
export type Title = {
    text: string,
    fontSize?: number,
    fontFamily?: string,
    x?: number,
    y?: number,
    textAnchor?: string,
    alignmentBaseline?: string
}
export type XAxisLabel = {
    text: string
}
export type YAxisLabel = {
    text: string
}
export type AbstractLevelOptions = {
    numOfBins?: number,
    curve?: any
    bandOpacity?: number,
    bandColor?: any,
    lowerQuantile?: number
    upperQuantile?: number,
}
export type AbstractLevel = {
    type: string,
    options?: AbstractLevelOptions
}

export type StepSettings = {
    chartSize: number, //Chart height for the vertical step and chart width for the horizontal step
    stepSize?: number,
    stepScale?: any,
    basePositions?: any,
    stepHandle?: any,
}


export interface LineChartSettings {
    [key: string]: any;

    showAxes?: boolean;
    noSvg?: boolean;
    width?: number;
    height?: number;
    xScale?: any;
    yScale?: any;
    colorScheme?: any;
    colorScale?: any;
    colorCategory?: any
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    lineWidth?: number;
    legend?: any;
    title?: Title;
    xAxisLabel?: XAxisLabel;
    yAxisLabel?: YAxisLabel;

    xTickValues?: any;
    yTickValues?: any;
    xTickLabels?: any;
    yTickLabels?: any;

    eventHandlers?: any;
    markerHighlightOpacity?: number;
    markerFadeOpacity?: number;
    stepMode?: StepSettings;
    annotations?: Annotations;
    orientation?: string;
    smoothen?: any;
}

export type TraceToHighlight = {
    traceIdx?: any,
    color?: any,
}

export class LineChart {
    private settings: LineChartSettings = {
        showAxes: false,
        noSvg: true,
        lineWidth: 1.0,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0,
        eventHandlers: {},
    };
    private colorScale;
    private canvas;
    private canvasWidth;
    private canvasHeight;
    private svg;
    private data: LineChartTrace[];
    private markersToHighlight = [];
    private traceToHighlight: TraceToHighlight = {};


    constructor(htmlContainer, lineChartData: LineChartTrace[], lineChartSettings: LineChartSettings) {
        this.data = lineChartData;

        let thisObject = this;
        //Copy the settings if there are.
        if (lineChartSettings != null) {
            for (let prop in lineChartSettings) {
                this.settings[prop] = lineChartSettings[prop];
            }
        }
        if (this.settings.showAxes || this.settings.title || this.settings.legend) {
            this.settings.noSvg = false;
        }
        //Find width and height
        if (!this.settings.width) {
            this.settings.width = htmlContainer.getBoundingClientRect().width;
        }
        if (!this.settings.height) {
            this.settings.height = htmlContainer.getBoundingClientRect().height;
        }
        //contentWidth
        let contentWidth = this.settings.width - this.settings.paddingLeft - this.settings.paddingRight;
        let contentHeight = this.settings.height - this.settings.paddingTop - this.settings.paddingBottom;
        this.canvasWidth = contentWidth;
        this.canvasHeight = contentHeight;
        //Scales


        if (!this.settings.xScale) {
            this.updateXScale();
        }

        if (!this.settings.yScale) {
            this.updateYScale();
        }

        if (this.settings.stepMode) {
            if (!this.settings.stepMode.stepScale) {
                this.updateStepScale();
            }
            this.calculateBases();
            this.calculateStepTickPosAndLabels();
        }

        //Color scales

        if (!this.settings.colorScale) {
            let series = this.data.map(trace => {
                return trace.series;
            });
            let seriesLength = series.length;
            let colorScale = d3.scaleLinear<number, string>()
                .domain([0, 0.5, 1])
                .range(this.settings.colorScheme ? this.settings.colorScheme : ["#f59322", "#a0a0a0", "#0877bd"])
                .clamp(true);

            this.settings.colorScale = d3.scaleOrdinal()
                .domain(series)
                .range(series.map((_, i) => {
                    return thisObject.settings.colorCategory ? thisObject.settings.colorCategory[i] : colorScale(i / seriesLength);
                }));
        }


        let container = d3.select(htmlContainer).append("div")
            .style("width", `${this.settings.width}px`)
            .style("height", `${this.settings.height}px`)
            .style("position", "relative")
            .style("top", `0px`)
            .style("left", `0px`);
        if (!this.settings.noSvg) {
            this.svg = container.append("svg").attr("width", this.settings.width)
                .attr("height", this.settings.height)
                .style("position", "absolute")
                .style("left", "0px")
                .style("top", "0px")
                .append("g")
                .attr("transform", "translate(0, 0)");
        }
        let arrBisector = d3.bisector((d, x) => d - x).left;

        this.canvas = container.append("canvas")
            .attr("width", contentWidth)
            .attr("height", contentHeight)
            .style("width", (contentWidth) + "px")
            .style("height", (contentHeight) + "px")
            .style("position", "absolute")
            .style("top", `${this.settings.paddingTop}px`)
            .style("left", `${this.settings.paddingLeft}px`);
        Object.keys(this.settings.eventHandlers).forEach(event => {
            thisObject.canvas.on(event, function () {
                let point = d3.mouse(this);
                let info = getClosestPointsInfo(point);
                info['pageX'] = d3.event.pageX;
                info['pageY'] = d3.event.pageY;
                thisObject.settings.eventHandlers[event](info);
            });
        });

        //Show axes
        if (this.settings.showAxes) {
            let xAxis = d3.axisBottom()
                .scale(this.settings.xScale);

            let yAxis = d3.axisLeft()
                .scale(this.settings.yScale);

            if (this.settings.xTickValues) {
                xAxis.tickValues(this.settings.xTickValues);
            }
            if (this.settings.xTickLabels) {
                xAxis.tickFormat((d, i) => this.settings.xTickLabels[i]);
            }

            if (this.settings.yTickValues) {
                yAxis.tickValues(this.settings.yTickValues);
            }
            if (this.settings.yTickLabels) {
                yAxis.tickFormat((d, i) => this.settings.yTickLabels[i]);
            }

            let xAxisG = this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(${this.settings.paddingLeft},${this.settings.height - this.settings.paddingBottom})`)
                .call(xAxis);

            let yAxisG = this.svg.append("g")
                .attr("class", "y axis")
                .attr("transform", `translate(${this.settings.paddingLeft},${this.settings.paddingTop})`)
                .call(yAxis);

            //if it is in stepMode we should also add the stepScale.
            if (this.settings.stepMode) {
                let thisObj = this;
                let minChartSize = 30;
                if (this.settings.orientation === 'vertical') {
                    let stepAxis = d3.axisTop().scale(this.settings.stepMode.stepScale).ticks(Math.min(Math.max(2, Math.floor(this.settings.stepMode.chartSize / 20)), 5));
                    let stepAxisG = this.svg.append("g")
                        .attr("class", "step axis")
                        .attr("transform", `translate(${this.settings.paddingLeft},${this.settings.paddingTop})`)
                        .call(stepAxis);
                    //<editor-fold desc="This section is for the drag of the step size">
                    if (thisObj.settings.stepMode.stepHandle) {
                        let prevHandleFill;
                        let stepHandleMargins = {top: -13, left: 20};
                        let drag = d3.drag()
                            .on("start", function (d) {
                                let thisHandle = d3.select(this);
                                prevHandleFill = thisHandle.attr("fill");
                                thisHandle.attr("fill", "red");
                            })
                            .on("drag", function (d) {
                                d3.select(this)
                                    .attr("cx", d.x = Math.min(Math.max(d3.event.x, stepHandleMargins.left + minChartSize), thisObj.canvasWidth))
                                    .attr("cy", d.y);
                                thisObj.settings.stepMode.chartSize = d.x - stepHandleMargins.left;
                                thisObj.settings.stepMode.stepScale.range([0, thisObj.settings.stepMode.chartSize]);//Update step scale
                                //Recalculate bases for the graph positions for all the elements
                                thisObj.calculateBases();
                                // Need to update the step locations and this is related to these two functions.
                                thisObj.calculateStepTickPosAndLabels();
                                xAxis.tickValues(thisObj.settings.xTickValues);
                                xAxis.tickFormat((d, i) => thisObj.settings.xTickLabels[i]);
                                xAxisG.call(xAxis);
                                thisObj.plot();//Update
                                //Update also the stepScale axis
                                stepAxisG.call(stepAxis);
                            })
                            .on("end", function () {
                                d3.select(this).attr("fill", prevHandleFill);
                            });
                        let handle = [{
                            x: this.settings.stepMode.chartSize + stepHandleMargins.left,
                            y: stepHandleMargins.top
                        }];
                        let handleContainer = this.svg.append("g")
                            .attr("class", "stepHandleContainer")
                            .attr('transform', `translate(${this.settings.paddingLeft},${this.settings.paddingTop})`)
                        let handleCircle = handleContainer.append("g")
                            .attr("class", "dot")
                            .selectAll('circle')
                            .data(handle)
                            .enter().append("circle")
                            .attr("r", 5)
                            .attr("cx", function (d) {
                                return d.x;
                            })
                            .attr("cy", function (d) {
                                return d.y;
                            })
                            .attr("fill", "steelblue")
                            .on("mouseover", function (d) {
                                d3.select(this).raise().attr("stroke", "black");
                            })
                            .on("mouseout", function (d) {
                                d3.select(this).raise().attr("stroke", null);
                            })
                            .style('cursor', 'col-resize')
                            .call(drag);
                    }

                    //</editor-fold>
                } else {
                    let reverseStepScale = d3.scaleLinear().domain(this.settings.stepMode.stepScale.domain().slice()).range(this.settings.stepMode.stepScale.range().slice().reverse());
                    let stepAxis = d3.axisRight().scale(reverseStepScale).ticks(Math.min(Math.max(2, Math.floor(this.settings.stepMode.chartSize / 20)), 5));
                    let stepAxisG = this.svg.append("g")
                        .attr("class", "step axis")
                        .attr("transform", `translate(${this.settings.width - this.settings.paddingRight},${this.settings.height - this.settings.paddingBottom - this.settings.stepMode.chartSize})`)
                        .call(stepAxis);

                    //<editor-fold desc="This section is for the drag of the step size">
                    if (this.settings.stepMode.stepHandle) {
                        let prevHandleFill;
                        let stepHandleMargins = {top: 15, left: 20};

                        let drag = d3.drag()
                            .on("start", function (d) {
                                let thisHandle = d3.select(this);
                                prevHandleFill = thisHandle.attr("fill");
                                thisHandle.attr("fill", "red");
                            })
                            .on("drag", function (d) {
                                console.log(d3.event.y);
                                d3.select(this)
                                    .attr("cx", d.x)
                                    .attr("cy", d.y = Math.min(Math.max(d3.event.y, -thisObj.canvasHeight - stepHandleMargins.top), -minChartSize));
                                thisObj.settings.stepMode.chartSize = -d.y - stepHandleMargins.top;

                                //Recalculate bases for the graph positions for all the elements
                                thisObj.calculateBases();
                                // Need to update the step locations and this is related to these two functions.
                                thisObj.calculateStepTickPosAndLabels();
                                yAxis.tickValues(thisObj.settings.yTickValues);
                                yAxis.tickFormat((d, i) => thisObj.settings.yTickLabels[i]);
                                yAxisG.call(yAxis);
                                thisObj.plot();//Update
                                //Update also the stepScale axis
                                //Recalculate the step scale
                                thisObj.settings.stepMode.stepScale.range([0, thisObj.settings.stepMode.chartSize]);//Update step scale
                                let reverseStepScale = d3.scaleLinear().domain(thisObj.settings.stepMode.stepScale.domain().slice()).range(thisObj.settings.stepMode.stepScale.range().slice().reverse());
                                let stepAxis = d3.axisRight().scale(reverseStepScale).ticks(Math.min(Math.max(2, Math.floor(thisObj.settings.stepMode.chartSize / 20)), 5));
                                //Also need to retranslate it
                                stepAxisG.attr("transform", `translate(${thisObj.settings.width - thisObj.settings.paddingRight},${thisObj.settings.height - thisObj.settings.paddingBottom - thisObj.settings.stepMode.chartSize})`)
                                stepAxisG.call(stepAxis);
                            })
                            .on("end", function () {
                                d3.select(this).attr("fill", prevHandleFill);
                            });
                        let handle = [{
                            x: stepHandleMargins.left,
                            y: -thisObj.settings.stepMode.chartSize - stepHandleMargins.top
                        }];
                        let handleContainer = this.svg.append("g")
                            .attr("class", "stepHandleContainer")
                            .attr('transform', `translate(${this.settings.width - this.settings.paddingRight},${this.settings.height - this.settings.paddingBottom})`)
                        let handleCircle = handleContainer.append("g")
                            .attr("class", "dot")
                            .selectAll('circle')
                            .data(handle)
                            .enter().append("circle")
                            .attr("r", 5)
                            .attr("cx", function (d) {
                                return d.x;
                            })
                            .attr("cy", function (d) {
                                return d.y;
                            })
                            .attr("fill", "steelblue")
                            .on("mouseover", function (d) {
                                d3.select(this).raise().attr("stroke", "black");
                            })
                            .on("mouseout", function (d) {
                                d3.select(this).raise().attr("stroke", null);
                            })
                            .style('cursor', 'row-resize')
                            .call(drag);
                    }
                    //</editor-fold>

                }

            }

        }

        //Show title
        if (this.settings.title) {
            if (this.settings.title.x === undefined) {
                this.settings.title.x = this.settings.paddingLeft + contentWidth / 2;
            }
            if (this.settings.title.y === undefined) {
                this.settings.title.y = this.settings.paddingTop / 2;
            }
            if (this.settings.title.alignmentBaseline === undefined) {
                this.settings.title.alignmentBaseline = "middle";
            }
            if (this.settings.title.textAnchor === undefined) {
                this.settings.title.textAnchor = "middle";
            }
            let title = this.svg.append("g").append("text").attr("class", "graphTitle").attr("x", this.settings.title.x).attr("y", this.settings.title.y)
                .text(this.settings.title.text).attr("alignment-baseline", this.settings.title.alignmentBaseline).attr("text-anchor", this.settings.title.textAnchor).attr("font-weight", "bold");
            if (this.settings.title.fontFamily) {
                title.attr("font-family", this.settings.title.fontFamily);
            }
            if (this.settings.title.fontSize) {
                title.attr("font-size", this.settings.title.fontSize);
            }
        }
        //Show axis labels
        if (this.settings.xAxisLabel) {
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (this.settings.width / 2) + "," + (this.settings.height) + ")")  // centre below axis at the bottom
                .text(this.settings.xAxisLabel.text);
        }
        if (this.settings.yAxisLabel) {
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("transform", "translate(0," + (this.settings.height / 2) + ")rotate(-90)")
                .text(this.settings.yAxisLabel.text).attr("dx", "1em");//Also move right one text size.
        }
        //Show legend
        if (this.settings.legend) {
            let legendg = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${this.settings.legend.x}, ${this.settings.legend.y})`);
            this.data.forEach((trace, i) => {
                legendg.append("text").attr("fill", this.settings.colorScale(trace.series)).attr("dy", `${i}em`).node().innerHTML = `<tspan text-decoration=${trace.type === "scatter" ? 'none' : 'line-through'}>&nbsp;${trace.marker ? trace.marker : " "}&nbsp;</tspan> ` + trace.series;
            });
        }


        //Closest point for all traces (the indexes not the actual values)
        function getClosestIndicesForTraces(point) {
            let x = point[0];
            // console.log(point);
            let xVal = thisObject.settings.xScale.invert(x);
            let results = thisObject.data.map(trace => {
                let idx = arrBisector(trace.x, xVal);
                return idx;
            });
            return results;
        }

        //Closest point (traceIdx, xIdx, yIdx)
        function getClosestPointsInfo(point) {
            let cps = getClosestIndicesForTraces(point);
            let x = thisObject.settings.xScale(thisObject.data[0].x[cps[0]]);
            let y = thisObject.settings.yScale(thisObject.data[0].y[cps[0]]);
            let closestPointIdx = cps[0];
            let closestTraceIdx = 0;
            let closestDistance = distance([x, y], point);
            let closestPoint = [x, y];
            for (let i = 1; i < cps.length; i++) {
                x = thisObject.settings.xScale(thisObject.data[i].x[cps[i]]);
                y = thisObject.settings.yScale(thisObject.data[i].y[cps[i]]);
                let d = distance([x, y], point);
                if (d < closestDistance) {
                    closestDistance = d;
                    closestPointIdx = cps[i];
                    closestTraceIdx = i;
                    closestPoint = [x, y];
                }
            }
            return {
                closestDistance: closestDistance,
                closestPointIdx: closestPointIdx,
                closestTraceIdx: closestTraceIdx,
                closestPoint: closestPoint,
                closestIndicesForTraces: cps,
            }
        }

        function distance(p1, p2) {
            return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
        }


    }

    calculateStepTickPosAndLabels() {
        //Change tick labels
        //Calculate the tick values and tick labels for steps
        if (this.settings.stepMode) {
            if (this.settings.orientation === 'vertical') {
                this.settings.xTickValues = this.settings.stepMode.basePositions.map(basePos => this.settings.xScale.invert(basePos));
                this.settings.xTickLabels = this.data.map(d => d.series);
            } else {
                this.settings.yTickValues = this.settings.stepMode.basePositions.map(basePos => this.settings.yScale.invert(basePos));
                this.settings.yTickLabels = this.data.map(d => d.series);
            }
        }
    }

    updateXScale() {
        let thisObject = this;
        let x = [];
        thisObject.data.forEach(trace => {
            x = x.concat(trace.x);
        });
        thisObject.settings.xScale = d3.scaleLinear()
            .domain(d3.extent(x))
            .range([0, thisObject.canvasWidth]);
    }

    updateYScale() {
        let thisObject = this;
        let yValues = [];
        thisObject.data.forEach(trace => {
            yValues = yValues.concat(trace.y);
        });

        thisObject.settings.yScale = d3.scaleLinear()
            .domain(d3.extent(yValues))
            .range([thisObject.canvasHeight, 0]);
    }

    updateStepScale() {
        let thisObject = this;
        let yValues = [];
        thisObject.data.forEach(trace => {
            yValues = yValues.concat(trace.y);
        });

        thisObject.settings.stepMode.stepScale = d3.scaleLinear()
            .domain(d3.extent(yValues))
            .range([0, thisObject.settings.stepMode.chartSize]);

        ///when updating step Scale we also need to update the step positions.
    }

    private calculateBases() {
        //Calculate the stepSize
        this.settings.stepMode.basePositions = [];
        let canvasSize = this.settings.orientation === 'horizontal' ? this.canvasHeight : this.canvasWidth; //canvasWidth for vertical and canvasHeight for horizontal
        this.settings.stepMode.stepSize = this.data.length > 1 ? (canvasSize - this.settings.stepMode.chartSize) / (this.data.length - 1) : 0;
        this.data.forEach((_, traceIdx) => {
            let basePos = 0;
            if (this.settings.orientation === "vertical") {
                basePos = canvasSize - (traceIdx) * this.settings.stepMode.stepSize - this.settings.stepMode.chartSize;
            } else {
                basePos = canvasSize - (this.data.length - 1 - traceIdx) * this.settings.stepMode.stepSize;
            }
            this.settings.stepMode.basePositions.push(basePos);
        });


    }

    private async updateSteps() {
        if (this.settings.orientation === 'vertical') {
            this.svg.select('.x.axis').selectAll('text').data(this.data.map(d => d.series)).text(d => d);
        } else {
            this.svg.select('.y.axis').selectAll('text').data(this.data.map(d => d.series)).text(d => d);
        }
    }

    public async plotDrawLine(x0, y0, x1, y1, color, strokeWidth) {
        let ctx = this.canvas.node().getContext("2d");
        ctx.beginPath();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = color;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    }

    public async plot() {
        //clear the canvas
        this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        //start the drawing
        this.data.forEach((trace, traceIdx) => {
            this.draw(this.settings.lineWidth, traceIdx);
        });
        //Also draw annotations if there is.
        if (this.settings.annotations) {
            let lineAnnotation = this.settings.annotations['line'];
            if (lineAnnotation) {
                let x0 = (lineAnnotation.valueType !== 'value') ? lineAnnotation.x0 : this.settings.xScale(lineAnnotation.x0);
                let x1 = (lineAnnotation.valueType !== 'value') ? lineAnnotation.x1 : this.settings.xScale(lineAnnotation.x1);
                let y0 = (lineAnnotation.valueType !== 'value') ? lineAnnotation.y0 : this.settings.xScale(lineAnnotation.y0);
                let y1 = (lineAnnotation.valueType !== 'value') ? lineAnnotation.y1 : this.settings.xScale(lineAnnotation.y1);
                let color = lineAnnotation.color ? lineAnnotation.color : 'black';
                let strokeWidth = lineAnnotation.strokeWidth ? lineAnnotation.strokeWidth : 1;

                this.plotDrawLine(x0, y0, x1, y1, color, strokeWidth);
            }

            let xLineAnnotation = this.settings.annotations['xLine'];
            if (xLineAnnotation) {
                let x0 = (xLineAnnotation.valueType !== 'value') ? xLineAnnotation.x : this.settings.xScale(xLineAnnotation.x);
                let x1 = x0;
                let y0 = 0;
                let y1 = this.canvasHeight;
                let color = xLineAnnotation.color ? xLineAnnotation.color : 'black';
                let strokeWidth = xLineAnnotation.strokeWidth ? xLineAnnotation.strokeWidth : 1;

                this.plotDrawLine(x0, y0, x1, y1, color, strokeWidth);
            }

            let yLineAnnotation = this.settings.annotations['yLine'];
            if (yLineAnnotation) {
                let x0 = 0;
                let x1 = this.canvasWidth;
                let y0 = (yLineAnnotation.valueType !== 'value') ? yLineAnnotation.y : this.settings.yScale(yLineAnnotation.y);
                let y1 = y0;
                let color = yLineAnnotation.color ? yLineAnnotation.color : 'black';
                let strokeWidth = yLineAnnotation.strokeWidth ? yLineAnnotation.strokeWidth : 1;
                this.plotDrawLine(x0, y0, x1, y1, color, strokeWidth);
            }

        }
    }

    public async updateAnnotations(annotations: Annotations) {
        this.settings.annotations = annotations;
    }

    public async update(newData, updateScales) {
        this.data = newData;
        if (updateScales) {
            this.updateXScale();
            this.updateYScale();
        }
        this.plot();
        //if stepping then also update step
        if (this.settings.stepMode) {
            this.updateSteps();
        }
    }

    /**
     * Highlight the markers for each trace
     * @param markersToHighlight
     * @param higlightOpacity
     * @param fadeOpacity
     */
    public async highlightMarkers(markersToHighlight, highlightOpacity, fadeOpacity) {
        //Initialize
        if (highlightOpacity !== undefined) {
            this.settings.markerHighlightOpacity = highlightOpacity;
        }
        if (fadeOpacity !== undefined) {
            this.settings.markerFadeOpacity = fadeOpacity;
        }
        this.markersToHighlight = markersToHighlight;
        //Plot
        this.plot();

    }

    public async highlightTraceIdx(traceIdx, color) {
        this.traceToHighlight.traceIdx = traceIdx;
        this.traceToHighlight.color = color;
        this.plot();
    }

    public async highlightTraceSeries(series, color) {
        this.traceToHighlight.traceIdx = this.data.map(d => d.series).indexOf(series);
        this.traceToHighlight.color = color;
        this.plot();
    }

    public async highlightLines(lines, highlightOpacity, fadeOpacity) {

    }

    private async draw(lineWidth: number, traceIdx) {
        let trace = this.data[traceIdx];
        let x = trace.x;
        let y = trace.y;
        let type = trace.type;
        //TODO: Shall we update the scales when updating the data?
        let xScale = this.settings.xScale;
        let yScale = this.settings.yScale;
        //Check for option
        let binData;
        let normalItemIdxs = [];
        if (trace.abstractLevel) {
            let abstraction = trace.abstractLevel;
            if (abstraction.type === "bin") {
                //Upper and lower quantiles
                abstraction.options.lowerQuantile = abstraction.options.lowerQuantile ? abstraction.options.lowerQuantile : 0.25;
                abstraction.options.upperQuantile = abstraction.options.upperQuantile ? abstraction.options.upperQuantile : 0.75;
                //Initialize bins as empty arrays
                let numOfBins = abstraction.options.numOfBins + 1;
                let bins = [];
                //Initialization.
                for (let i = 0; i < numOfBins; i++) {
                    bins[i] = [];
                }
                //Note, we scale as x already scaled since we may need to do binning like with dates
                //And the x may not guarantee equal distances every step
                let binStep = this.canvasWidth / (numOfBins - 1);
                for (let i = 0; i < x.length; i++) {
                    bins[Math.floor(xScale(x[i]) / binStep)].push(i);
                }
                //Now y values for each bins
                let binYValues = bins.map(bin => {
                    let yValues = bin.map(idx => y[idx]);
                    return yValues;
                });
                //Bounds for each bean [lowerBound, upperBound]
                let binYQuantiles = binYValues.map(binYs => {
                    return [quantile(binYs, abstraction.options.lowerQuantile), quantile(binYs, 0.5), quantile(binYs, abstraction.options.upperQuantile)];
                });
                //Now resetup the bin data.
                binData = bins.map((binItemIdxs, binIdx) => {
                    let quantiles = binYQuantiles[binIdx];
                    let upperItemIdxs = [];
                    let normalItemIdxs = [];
                    let lowerItemIdxs = [];
                    binItemIdxs.forEach(binItemIdx => {
                        if (y[binItemIdx] < quantiles[0]) {
                            lowerItemIdxs.push(binItemIdx);
                        } else if (y[binItemIdx] > quantiles[2]) {
                            upperItemIdxs.push(binItemIdx);
                        } else {
                            normalItemIdxs.push(binItemIdx);
                        }
                    });
                    return {
                        quantiles: quantiles,
                        upperItemIdxs: upperItemIdxs,
                        normalItemIdxs: normalItemIdxs,
                        lowerItemIdxs: lowerItemIdxs,
                        binX: binIdx * binStep,
                        binLowerY: yScale(quantiles[2]),
                        binUpperY: yScale(quantiles[0])
                    };
                });
                //Now filter the normal items.
                normalItemIdxs = binData.map(bin => bin.normalItemIdxs).flat();

                //Move the x to the center (except for the last bin)
                for (let i = 0; i < binData.length - 1; i++) {
                    binData[i].binX += binStep / 2;
                }
                //Add one to the fist.
                let firstBin = Object.assign({}, binData[0]);
                firstBin.binX -= binStep / 2;
                binData.unshift(firstBin);
                //Fort the last bin => (this is what we added) take the previous step.
                binData[binData.length - 1].binLowerY = binData[binData.length - 2].binLowerY;
                binData[binData.length - 1].binUpperY = binData[binData.length - 2].binUpperY;

            }
        }


        let strokeStyle = this.settings.colorScale(trace.series);
        let marker = trace.marker;

        //Convert data to d3 format.
        let lineData = x.map((xVal, i) => {
            return {
                x: xVal,
                y: y[i]
            }
        });


        let ctx = this.canvas.node().getContext("2d");

        if (trace.abstractLevel !== undefined && trace.abstractLevel.type == "bin") {
            //Try the band
            let area = d3.area().x(d => d.binX).y0(d => d.binLowerY).y1(d => d.binUpperY).context(ctx);
            if (trace.abstractLevel.options.curve) {
                area.curve(trace.abstractLevel.options.curve);
            }
            ctx.beginPath();
            //Todo: This part is for the stroke (may need to have option to enable this).
            ctx.lineWidth = 0;
            // ctx.lineWidth = lineWidth;
            trace.abstractLevel.options.bandColor = trace.abstractLevel.options.bandColor ? trace.abstractLevel.options.bandColor : strokeStyle;
            ctx.strokeStyle = trace.abstractLevel.options.bandColor;

            let c = color(trace.abstractLevel.options.bandColor);
            c.opacity = trace.abstractLevel.options.bandOpacity;
            ctx.fillStyle = c;
            area(binData);
            ctx.fill();
            ctx.stroke();
        }


        if (type === 'area') {
            let area;

            if (this.settings.orientation === 'vertical') {
                area = d3.area().y(d => yScale(d.y)).x0(d => xScale(0)).x1(d => xScale(d.x)).context(ctx);
            } else {//Default is horizontal
                area = d3.area().x(d => xScale(d.x)).y0(d => yScale(0)).y1(d => yScale(d.y)).context(ctx);
            }
            let gradient;
            if (this.settings.stepMode) {
                let stepScale = this.settings.stepMode.stepScale;
                let basePos = this.settings.stepMode.basePositions[traceIdx];
                if(typeof basePos === "undefined"){
                    return ;
                }
                if (this.settings.orientation === 'vertical') {
                    //We also need to reverse the display order
                    try {
                        gradient = ctx.createLinearGradient(basePos, 0, basePos + this.settings.stepMode.chartSize, 0);
                    } catch (e) {
                        debugger
                        console.log(basePos);
                    }

                    //If we do pass individual color scale then use it.
                    if (this.data[traceIdx].colorScale) {
                        this.data[traceIdx].colorScale.forEach(item => {
                            gradient.addColorStop(item[0], item[1]);
                        });
                    } else {
                        gradient.addColorStop(0, 'black');
                        gradient.addColorStop(1, strokeStyle);
                    }
                    area = d3.area().y(d => yScale(d.y)).x0(d => basePos).x1(d => basePos + stepScale(d.x)).context(ctx);
                } else {
                    try {
                        gradient = ctx.createLinearGradient(0, basePos, 0, basePos - this.settings.stepMode.chartSize);
                    } catch (e) {
                        debugger
                        console.log(basePos);
                    }

                    //If we do pass individual color scale then use it.
                    if (this.data[traceIdx].colorScale) {
                        this.data[traceIdx].colorScale.forEach(item => {
                            gradient.addColorStop(item[0], item[1]);
                        });
                    } else {
                        gradient.addColorStop(0, 'black');
                        gradient.addColorStop(1, strokeStyle);
                    }
                    area = d3.area().x(d => xScale(d.x)).y0(d => basePos).y1(d => basePos - stepScale(d.y)).context(ctx);
                }

            }
            if (this.settings.smoothen) {
                area.curve(d3.curveCardinal);
            }
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.fillStyle = (traceIdx === this.traceToHighlight.traceIdx) ? this.traceToHighlight.color : gradient;
            ctx.strokeStyle = (traceIdx === this.traceToHighlight.traceIdx) ? this.traceToHighlight.color : gradient;
            if (traceIdx === this.traceToHighlight.traceIdx) {
                ctx.fillStyle = this.traceToHighlight.color;
                ctx.strokeStyle = this.traceToHighlight.color;
            }

            area(lineData);
            ctx.fill();
            ctx.stroke();

        } else if (type !== 'scatter') {
            //If type is abstraction => filter the x, y items which are inside the bound
            let line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)).context(ctx);
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            line(lineData);
            ctx.stroke();
        }
        //Marker
        if (marker) {
            let fontSize = 12;
            ctx.font = `${fontSize}px Monospace`;
            let mkW = ctx.measureText(marker).width;
            let mkH = fontSize;
            lineData.forEach((point, i) => {
                let c = color(strokeStyle);
                if (this.markersToHighlight.flat().length > 0) {
                    if (this.markersToHighlight[traceIdx].indexOf(i) >= 0) {
                        c.opacity = this.settings.markerHighlightOpacity;
                        ctx.fillStyle = c;
                        if (this.settings.highlightWithBar) {
                            let recX = xScale(point.x - 10);
                            let recY = yScale(point.y);
                            ctx.fillRect(recX, recY, 10, this.canvasHeight - recY);
                        }
                    } else {
                        c.opacity = this.settings.markerFadeOpacity;
                        ctx.fillStyle = c;
                    }
                } else {
                    c.opacity = 1.0;
                    ctx.fillStyle = c;
                }
                //Also if there are normal items (they are hidden)
                if (normalItemIdxs.length > 0 && normalItemIdxs.indexOf(i) >= 0) {
                    c.opacity = 0;
                    ctx.fillStyle = c;
                }
                ctx.fillText(marker, (xScale(point.x) - mkW / 2), (yScale(point.y) + mkH / 4));
            });
        }
    }
}
