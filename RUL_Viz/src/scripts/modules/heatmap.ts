/**Some ideas of this class are adopted from: https://github.com/tensorflow/playground/blob/master/src/heatmap.ts***/
import * as d3 from 'd3';

/**
 * A two dimensional x and y coordinates with the value (z).
 */
export type HeatMapData = {
    x: any[],
    y: any[],
    z: number[][]
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

export interface HeatMapSettings {
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
    cellWidth?: number;
    cellHeight?: number;
    borderColor?: string;
    borderWidth?: number;
    showColorBar: boolean;

    title?: Title;
    xAxisLabel?: XAxisLabel,
    yAxisLabel?: YAxisLabel,
    xTicks?: number,
    yTicks?: number
}

export class HeatMap {
    private settings: HeatMapSettings = {
        showAxes: false,
        noSvg: true,
        borderColor: 'black',
        borderWidth: 0.1,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0,
        showColorBar: false
    };
    private colorScale;
    private canvas;
    private canvasWidth;
    private canvasHeight;
    private svg;
    private data: HeatMapData;


    constructor(htmlContainer, heatMapData: HeatMapData, heatMapSettings: HeatMapSettings) {
        this.data = heatMapData;
        //Copy the settings if there are.
        if (heatMapSettings != null) {
            for (let prop in heatMapSettings) {
                this.settings[prop] = heatMapSettings[prop];
            }
        }
        if (this.settings.showAxes || this.settings.showColorBar) {
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
        //CellWidth, cellHeight
        if (!this.settings.cellWidth) {
            this.settings.cellWidth = (contentWidth) / this.data.x.length;
        }
        if (!this.settings.cellHeight) {
            this.settings.cellHeight = (contentHeight) / this.data.y.length;
        }
        //Scales
        if (!this.settings.xScale) {
            this.settings.xScale = d3.scaleBand()
                .domain(heatMapData.x)
                .range([0, contentWidth]);
        }
        if (!this.settings.yScale) {
            this.settings.yScale = d3.scaleBand()
                .domain(heatMapData.y)
                .range([0, contentHeight]);
        }

        //Color scales
        if (!this.settings.colorScale) {
            let flattenedZ = [].concat(...this.data.z);
            let minZ = d3.min(flattenedZ);
            let maxZ = d3.max(flattenedZ);
            let avgZ = (maxZ - minZ) / 2 + minZ;
            this.settings.colorScale = d3.scaleLinear<string, number>()
                .domain([minZ, avgZ, maxZ])
                .range(this.settings.colorScheme ? this.settings.colorScheme : ["#0877bd", "#e8eaeb", "#f59322"])
                .clamp(true);
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

        if (this.settings.showAxes) {
            let xAxis = d3.axisBottom()
                .scale(this.settings.xScale);
            if (this.settings.xTicks) {
                let step = Math.round(this.data.x.length / this.settings.xTicks);
                let tickValues = [];
                for (let i = 0; i < this.data.x.length; i += step) {
                    tickValues.push(this.data.x[i]);
                }
                xAxis.tickValues(tickValues);
            }

            let yAxis = d3.axisLeft()
                .scale(this.settings.yScale);

            if (this.settings.yTicks) {
                let step = Math.round(this.data.y.length / this.settings.yTicks);
                let tickValues = [];
                for (let i = 0; i < this.data.y.length; i += step) {
                    tickValues.push(this.data.y[i]);
                }
                yAxis.tickValues(tickValues);
            }

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
        if (this.settings.xAxisLabel) {
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (this.settings.width / 2) + "," + (this.settings.height) + ")")// centre below axis at the bottom
                .attr("dy", "-0.5em")
                .text(this.settings.xAxisLabel.text);
        }
        if (this.settings.yAxisLabel) {
            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("transform", "translate(0," + (this.settings.height / 2) + ")rotate(-90)")
                .text(this.settings.yAxisLabel.text).attr("dx", "1em");//Also move right one text size.
        }
        if (this.settings.showColorBar) {
            let colorBarG = this.svg.append("g")
                .attr("class", "colorBar")
                .attr("transform", `translate(${this.settings.paddingLeft + contentWidth + 5}, ${this.settings.paddingTop})`);
            this.plotColorBar(colorBarG, new Date().getTime(), 10, contentHeight, "vertical");

        }
    }

    public async plot() {
        //clear the canvas
        this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        let self = this;
        self.data.x.forEach((xVal: any, xIdx: number) => {
            self.data.y.forEach((yVal: any, yIdx: number) => {
                self.drawRect(self.settings.xScale(xVal), self.settings.yScale(yVal), self.settings.cellWidth, self.settings.cellHeight, this.settings.borderWidth, this.settings.borderColor, self.settings.colorScale(self.data.z[xIdx][yIdx]));
            });
        });
    }

    public async update(newData) {
        this.data = newData;
        //TODO: we may need to recalculate the scale.
        this.plot();
    }

    public async plotColorBar(theGroup, id, width, height, orientation) {
        const cs = this.settings.colorScale;
        const domain = cs.domain();
        const minVal = domain[0];
        const domainSize = domain[domain.length - 1] - domain[0];
        var legend = theGroup.append('defs')
            .append('linearGradient')
            .attr('id', 'gradient' + id)
            .attr('x1', '0%') // left
            .attr('y1', '0%')
            .attr('x2', '0%') // to right
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad');
        cs.domain().forEach((dVal) => {
            legend.append("stop").attr("offset", Math.round((dVal - minVal) * 100 / domainSize) + "%").attr("stop-color", cs(dVal))
                .attr("stop-opacity", 1);
        });
        theGroup.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", `url(#gradient${id})`);

        let colorAxis = d3.axisRight()
            .scale(d3.scaleLinear().domain([domain[0], domain[domain.length - 1]]).range([0, height]));

        theGroup.append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${width},0)`)
            .call(colorAxis);

    }

    private async drawRect(x: number, y: number, width: number, height: number, lineWidth: number, strokeStyle: string, fillColor: string) {
        let ctx = this.canvas.node().getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.rect(x, y, width, height);
        ctx.fill();
        if (this.settings.borderWidth != 0) {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }
}