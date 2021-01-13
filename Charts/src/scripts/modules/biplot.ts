import * as d3 from "d3";
import {PCA} from "ml-pca";

export type Title = {
    text: string,
    fontSize?: number,
    fontFamily?: string,
    x?: number,
    y?: number,
    textAnchor?: string,
    alignmentBaseline?: string
}

export interface BiplotSettings {
    [key: string]: any;

    showAxes: boolean;
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
    contentPaddingLeft?: number;
    contentPaddingRight?: number;
    contentPaddingTop?: number;
    contentPaddingBottom?: number;
    lineWidth?: number;
    legend?: any;
    title?: Title;
    axisLabels?: string[];
    eventHandlers?: any
}


export class Biplot {
    private settings: BiplotSettings = {
        showAxes: true,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0,
        contentPaddingLeft: 0,
        contentPaddingTop: 0,
        contentPaddingBottom: 0,
        contentPaddingRight: 0,
        contentPineWidth: 1,

    };
    private data;
    private contentWidth: number;
    private contentHeight: number;
    private pca: PCA;
    private pcaUnits;
    private pcaZeros;
    private originalDims;
    private pcaDims;
    private svg;
    private canvas;

    constructor(htmlContainer, biplotData: number[][], biplotSettings: BiplotSettings) {
        let thisObject = this;
        this.data = biplotData;
        let originalDims = biplotData[0].length;
        this.originalDims = originalDims;
        this.pcaDims = 2;
        //Copy settings
        if (biplotSettings != null) {
            for (let prop in biplotSettings) {
                this.settings[prop] = biplotSettings[prop];
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
        //content width height
        let contentWidth = this.settings.width - this.settings.paddingLeft - this.settings.paddingRight;
        let contentHeight = this.settings.height - this.settings.paddingTop - this.settings.paddingBottom;
        this.contentWidth = contentWidth;
        this.contentHeight = contentHeight;

        //Container
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
        }


        //<editor-fold desc="this section processs PCA => shoudl separate">
        const pca = new PCA(this.data);
        this.pca = pca;
        //Calculate the unit vectors
        let units = [];
        let zeros = [];
        let ones = []
        for (let i = 0; i < originalDims; i++) {
            let scag = [];
            zeros.push(0.0);
            ones.push(1.0);
            for (let j = 0; j < originalDims; j++) {
                if (i === j) {
                    scag.push(1.0);
                } else {
                    scag.push(0.0);
                }
            }
            units.push(scag);
        }

        //Predict
        let pcaData = pca.predict(this.data);
        let pcaUnits = pca.predict(units);
        let pcaZeros = pca.predict([zeros]);
        let pcaOnes = pca.predict([ones]);
        this.pcaUnits = pcaUnits;
        this.pcaZeros = pcaZeros;
        let maxValues = [];
        let minValues = [];
        for (let i = 0; i < originalDims; i++) {
            // @ts-ignore
            // let vals = [...pcaData.data.map(d => d[i])];
            let vals = [...pcaUnits.data.map(d => d[i]), ...pcaData.data.map(d => d[i]), pcaZeros.data[0][i], pcaOnes.data[0][i]];
            maxValues.push(d3.max(vals));
            minValues.push(d3.min(vals));
        }
        //</editor-fold>
        //Scales
        // let maxVal = d3.max([maxValues[0], maxValues[1]]);
        if (!this.settings.xScale) {
            // this.settings.xScale = d3.scaleLinear().domain([-maxVal, maxVal]).range([0, contentWidth]);
            this.settings.xScale = d3.scaleLinear().domain([minValues[0], maxValues[0]]).range([0 + this.settings.contentPaddingLeft, contentWidth - this.settings.contentPaddingRight]);
        }
        if (!this.settings.yScale) {
            this.settings.yScale = d3.scaleLinear().domain([minValues[1], maxValues[1]]).range([contentHeight - this.settings.contentPaddingBottom, 0 + this.settings.contentPaddingTop]);
        }
        // @ts-ignore
        let pcaZeroPoint = [this.settings.xScale(pcaZeros.data[0][0]), this.settings.yScale(pcaZeros.data[0][1])];
        // @ts-ignore
        let pcaUnitPoints = pcaUnits.data.map(d => [this.settings.xScale(d[0]), this.settings.yScale(d[1])]);

        //Color scales
        if (!this.settings.colorScale) {
            //TODO:
        }
        //Color schemes.
        if (!this.settings.colorScheme) {
            this.settings.colorScheme = new Array(this.originalDims).map(_ => "black");
        }

        //Show axes
        if (this.settings.showAxes) {
            let axesG = this.svg.selectAll(".axesG").data([1]).join("g")
                .attr("class", "axesG")
                .attr("transform", `translate(${this.settings.paddingLeft}, ${this.settings.paddingTop})`);

            axesG.selectAll(".unitLine").data(pcaUnitPoints).join('line')
                .attr("class", "unitLine")
                .attr("x1", pcaZeroPoint[0])
                .attr("y1", pcaZeroPoint[1])
                .attr("x2", d => d[0])
                .attr("y2", d => d[1])
                .attr("stroke", (d, i) => this.settings.colorScheme[i]).attr("stroke-width", 2);
            if (this.settings.axisLabels) {
                let x0 = pcaZeroPoint[0];
                let y0 = pcaZeroPoint[1];
                axesG.selectAll(".unitLabel").data(pcaUnitPoints).join('text').text((d, i) => this.settings.axisLabels[i])
                    .attr("class", "unitLabel")
                    .attr("alignment-baseline", "middle")
                    .attr("text-anchor", "middle")
                    .attr("x", d => d[0])
                    .attr("y", d => d[1])
                    .attr("dy", d => d[1] > y0 ? "1em" : "-1em")
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
    }

    public async plot(data, originalPosition, plotFunction) {

    }

    /**
     * Plot a scatter plot into this biplot
     * @param data {x: [], y: []}
     * @param originalPosition
     * @param options
     */
    public async plotScatter(data, originalPosition, scatterSettings) {
        let options = {
            width: 50,
            height: 50,
            radius: 3,
            paddingLeft: 3,
            paddingTop: 3,
            paddingRight: 3,
            paddingBottom: 3,
            fill: "steelblue",
            xScale: undefined,
            yScale: undefined
        };
        //Copy any settings over
        for (let prop in scatterSettings) {
            options[prop] = scatterSettings[prop];
        }
        let ctx = this.canvas.node().getContext("2d");
        //@ts-ignore
        let pcaPoint = this.pca.predict([originalPosition]).data[0];
        //Take top 2 coordinates
        let x = this.settings.xScale(pcaPoint[0]);
        let y = this.settings.yScale(pcaPoint[1]);
        let x0 = x - options.width / 2;
        let y0 = y - options.height / 2;

        //Create the boundary.
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.rect(x0, y0, options.width, options.height);
        ctx.stroke();
        ctx.fill();
        //Create the scatter points
        if (!options.xScale) {
            options.xScale = d3.scaleLinear().domain(d3.extent(data.x)).range([0 + options.paddingLeft, options.width - options.paddingRight]);
        }
        if (!options.yScale) {
            options.yScale = d3.scaleLinear().domain(d3.extent(data.y)).range([options.height - options.paddingBottom, 0 + options.paddingTop]);
        }
        //Draw
        ctx.beginPath();
        data.x.forEach((xVal, i) => {
            let yVal = data.y[i];
            ctx.beginPath();
            ctx.fillStyle = options.fill;
            let thePoint = offset([options.xScale(xVal), options.yScale(yVal)]);
            ctx.arc(thePoint[0], thePoint[1], options.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        /**
         * This helper allows to convert from the original scatterplot point to the point on canvas
         * @param point the point as from scatterplot to be converted into this canvas
         */
        function offset(point) {
            return [x0 + point[0], y0 + point[1]];
        }
    }
}