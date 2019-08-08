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

export interface HeatMapSettings {
    [key: string]: any;

    showAxes?: boolean;
    noSvg?: boolean;
    width?: number;
    height?: number;
    xScale?: any;
    yScale?: any;
    colorScheme?:any;
    colorScale?: any;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    cellWidth?: number;
    cellHeight?: number;
    borderColor?: string;
    borderWidth?: number;
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
        paddingRight: 0
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
        if(this.settings.showAxes){
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
                .range(this.settings.colorScheme?this.settings.colorScheme:["#0877bd", "#e8eaeb", "#f59322"])
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
    public async update(newData){
        this.data = newData;
        //TODO: we may need to recalculate the scale.
        this.plot();
    }
    public async plotColorBar(theGroup, id, width, height, orientation){
        const cs = this.settings.colorScale;
        const domain = cs.domain();
        const minVal = domain[0];
        const domainSize = domain[domain.length-1] - domain[0];
        var legend = theGroup.append('defs')
            .append('linearGradient')
            .attr('id', 'gradient'+id)
            .attr('x1', '0%') // left
            .attr('y1', '100%')
            .attr('x2', '100%') // to right
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad');
        cs.domain().forEach((dVal)=>{
            legend.append("stop").attr("offset", Math.round((dVal-minVal)/domainSize)+"%").attr("stop-color", cs(dVal))
                .attr("stop-opacity", 1);
        });
        theGroup.append("rect")
            .attr("width", width)
            .attr("height", height - 30)
            .style("fill", `url(#gradient)${id}`)
            .attr("transform", "translate(0,10)");

    }
    private async drawRect(x: number, y: number, width: number, height: number, lineWidth: number, strokeStyle: string, fillColor: string) {
        let ctx = this.canvas.node().getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.rect(x, y, width, height);
        ctx.fill();
        if(this.settings.borderWidth!=0){
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }
}