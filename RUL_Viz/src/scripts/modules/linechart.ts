/** Some ideas of this class are adopted from: https://github.com/tensorflow/playground/blob/master/src/linechart.ts*****/
import * as d3 from 'd3';

/**
 * A two dimensional x and y coordinates with the value (z).
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
    fontFamily?: string
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
    yAxisLabel?: YAxisLabel
}

export class LineChart {
    private settings: LineChartSettings = {
        showAxes: false,
        noSvg: true,
        lineWidth: 1.0,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0
    };
    private colorScale;
    private canvas;
    private canvasWidth;
    private canvasHeight;
    private svg;
    private data: LineChartTrace[];

    constructor(htmlContainer, lineChartData: LineChartTrace[], lineChartSettings: LineChartSettings) {
        this.data = lineChartData;
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
                .range(this.settings.colorScheme?this.settings.colorScheme:["#f59322", "#a0a0a0", "#0877bd"])
                .clamp(true);
            this.settings.colorScale = d3.scaleOrdinal()
                .domain(series)
                .range(series.map((sr, i) => {
                    return colorScale(i / seriesLength);
                }));

        }
        let container = d3.select(htmlContainer).append("div")
            .style("width", `${this.settings.width}px`)
            .style("height", `${this.settings.height}px`)
            .style("position", "relative")
            .style("top", `0px`)
            .style("left", `0px`);

        this.canvas = container.append("canvas")
            .attr("width", contentWidth)
            .attr("height", contentHeight)
            .style("width", (contentWidth) + "px")
            .style("height", (contentHeight) + "px")
            .style("position", "absolute")
            .style("top", `${this.settings.paddingTop}px`)
            .style("left", `${this.settings.paddingLeft}px`);

        if (!this.settings.noSvg) {
            this.svg = container.append("svg").attr("width", this.settings.width)
                .attr("height", this.settings.height)
                .style("position", "absolute")
                .style("left", "0px")
                .style("top", "0px")
                .append("g")
                .attr("transform", "translate(0, 0)");

            this.svg.append("g").attr("class", "train");
            this.svg.append("g").attr("class", "test");
        }

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
            let title = this.svg.append("g").append("text").attr("class", "graphTitle").attr("x", this.settings.paddingLeft + contentWidth / 2).attr("y", this.settings.paddingTop / 2)
                .text(this.settings.title.text).attr("alignment-baseline", "middle").attr("text-anchor", "middle").attr("font-weight", "bold");
            if (this.settings.title.fontFamily) {
                title.attr("font-family", this.settings.title.fontFamily);
            }
            if (this.settings.title.fontSize) {
                title.attr("font-size", this.settings.title.fontSize);
            }
        }
        //Show axis labels
        if(this.settings.xAxisLabel){
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate("+ (this.settings.width/2) +","+(this.settings.height)+")")  // centre below axis at the bottom
                .text(this.settings.xAxisLabel.text);
        }
        if(this.settings.yAxisLabel){
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("transform", "translate(0,"+(this.settings.height/2)+")rotate(-90)")
                .text(this.settings.yAxisLabel.text).attr("dx", "1em");//Also move right one text size.
        }
        //Show legend
        if (this.settings.legend) {
            let legendg = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${this.settings.legend.x}, ${this.settings.legend.y})`);
            this.data.forEach((trace, i) => {
                legendg.append("text").attr("fill", this.settings.colorScale(trace.series)).attr("dy", `${i}em`).node().innerHTML = `<tspan text-decoration='line-through'>&nbsp;${trace.marker ? trace.marker : " "}&nbsp;</tspan> ` + trace.series;
            });
        }
    }

    public async plot() {
        //clear the canvas
        this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        //start the drawing
        this.data.forEach(trace => {
            let x = trace.x;
            let y = trace.y;
            let color = this.settings.colorScale(trace.series);
            this.draw(x, y, this.settings.lineWidth, color, trace.marker, trace.type);

        });
    }

    public async update(newData) {
        this.data = newData;
        //TODO: we may need to recalculate the scale.
        this.plot();
    }

    private async draw(x: number[], y: number[], lineWidth: number, strokeStyle: string, marker: string, type: string) {

        //Convert data to d3 format.
        let lineData = x.map((xVal, i) => {
            return {
                x: xVal,
                y: y[i]
            }
        });


        let ctx = this.canvas.node().getContext("2d");
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
            lineData.forEach(point => {
                ctx.fillStyle = strokeStyle;
                ctx.fillText(marker, (xScale(point.x) - mkW / 2), (yScale(point.y) + mkH / 4));
            });
        }
    }
}