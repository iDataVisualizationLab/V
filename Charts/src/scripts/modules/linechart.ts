/** Some ideas of this class are adopted from: https://github.com/tensorflow/playground/blob/master/src/linechart.ts*****/
import * as d3 from 'd3';
import {color} from 'd3-color';

/**
 * A two dimensional x and y coordinates with the value (z).
 * x    {Array}: x values (for x axis)
 * y    {Array}: y values (for each of the x value)
 * series   string: "Name of the series"
 * marker   letter: used to mark the point
 * tye  ["scatter", "line"]: used to control whether it is a scatter plot or a line chart
 */
export type LineChartTrace = {
    x: number[],
    y: number[],
    series: string,
    marker?: string,
    type?: string
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
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    lineWidth?: number;
    legend?: any;
    title?: Title;
    xAxisLabel?: XAxisLabel,
    yAxisLabel?: YAxisLabel,
    eventHandlers?: any,
    markerHighlightOpacity?: number,
    markerFadeOpacity?: number
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
    };
    private colorScale;
    private canvas;
    private canvasWidth;
    private canvasHeight;
    private svg;
    private contentSvg;
    private data: LineChartTrace[];
    private markersToHighlight = [];

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
            let x = [];
            this.data.forEach(trace => {
                x = x.concat(trace.x);
            });
            this.settings.xScale = d3.scaleLinear()
                .domain(d3.extent(x))
                .range([0, contentWidth]);
        }
        if (!this.settings.yScale) {
            let yValues = [];
            this.data.forEach(trace => {
                yValues = yValues.concat(trace.y);
            });
            this.settings.yScale = d3.scaleLinear()
                .domain(d3.extent(yValues))
                .range([contentHeight, 0]);
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
                    return colorScale(i / seriesLength);
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

            this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(${this.settings.paddingLeft},${this.settings.height - this.settings.paddingBottom})`)
                .call(xAxis);

            this.svg.append("g")
                .attr("class", "y axis")
                .attr("transform", `translate(${this.settings.paddingLeft},${this.settings.paddingTop})`)
                .call(yAxis);
        }

        //Show title
        if (this.settings.title) {
            if (this.settings.title.x === undefined) {
                this.settings.title.x = this.settings.paddingLeft + contentWidth / 2;
            }
            if (this.settings.title.y === undefined) {
                this.settings.title.y = this.settings.paddingTop / 2;
            }
            if(this.settings.title.alignmentBaseline===undefined){
                this.settings.title.alignmentBaseline = "middle";
            }
            if(this.settings.title.textAnchor === undefined){
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
    }

    public async plot() {
        //clear the canvas
        this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        //start the drawing
        this.data.forEach((trace, traceIdx) => {
            this.draw(this.settings.lineWidth, traceIdx);
        });
    }

    public async update(newData) {
        this.data = newData;
        //TODO: we may need to recalculate the scale.
        this.plot();
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

    public async highlightLines(lines, highlightOpacity, fadeOpacity) {

    }

    private async draw(lineWidth: number, traceIdx) {
        let trace = this.data[traceIdx];
        let x = trace.x;
        let y = trace.y;
        let strokeStyle = this.settings.colorScale(trace.series);
        let marker = trace.marker;
        let type = trace.type;
        //Convert data to d3 format.
        let lineData = x.map((xVal, i) => {
            return {
                x: xVal,
                y: y[i]
            }
        });

        let ctx = this.canvas.node().getContext("2d");
        //TODO: Shall we update the scales when updating the data?
        let xScale = this.settings.xScale;
        let yScale = this.settings.yScale;

        if (type !== 'scatter') {
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
                ctx.fillText(marker, (xScale(point.x) - mkW / 2), (yScale(point.y) + mkH / 4));
            });

        }


    }
}
