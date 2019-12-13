import * as d3 from "d3";
import {PCA} from "ml-pca";
import {Title, BiplotSettings} from "./biplot";

import * as d33d from "d3-3d";

let _3d = d33d.default._3d;

export interface PCA3DSettings extends BiplotSettings {
    zScale?: any
}

export type Data3DObj = {
    objectType: string,
    data: any,
    draw?: any
}

export class PCA3D {
    private settings: PCA3DSettings = {
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
    private canvas;
    //These are for 3d processor
    private shape3d: any;
    private data3d: Data3DObj[];
    private obj3d: any;
    private alpha;
    private beta;
    private startAngle;
    constructor(htmlContainer, biplotData: number[][], pca3dSettings: PCA3DSettings) {
        let thisObject = this;
        this.data = biplotData;
        let originalDims = biplotData[0].length;
        this.originalDims = originalDims;
        this.pcaDims = 2;
        //Copy settings
        if (pca3dSettings != null) {
            for (let prop in pca3dSettings) {
                this.settings[prop] = pca3dSettings[prop];
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

        //<editor-fold desc="this section processs PCA => should separate">
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
            let vals = [...pcaUnits.data.map(d => d[i]), ...pcaData.data.map(d => d[i]), pcaZeros.data[0][i], pcaOnes.data[0][i]];
            maxValues.push(d3.max(vals));
            minValues.push(d3.min(vals));
        }
        let boxRadius = Math.min(contentWidth - this.settings.contentPaddingRight - this.settings.contentPaddingLeft, contentHeight - this.settings.contentPaddingTop - this.settings.contentPaddingBottom) / 2;
        //Scales
        if (!this.settings.xScale) {
            this.settings.xScale = d3.scaleLinear().domain([minValues[0], maxValues[0]]).range([-boxRadius, boxRadius]);
        }
        if (!this.settings.yScale) {
            this.settings.yScale = d3.scaleLinear().domain([minValues[1], maxValues[1]]).range([-boxRadius, boxRadius]);
        }
        if (!this.settings.zScale) {
            this.settings.zScale = d3.scaleLinear().domain([minValues[2], maxValues[2]]).range([-boxRadius, boxRadius]);
        }
        // @ts-ignore
        let pcaZeroPoint = [this.settings.xScale(pcaZeros.data[0][0]), this.settings.yScale(pcaZeros.data[0][1]), this.settings.zScale(pcaZeros.data[0][2])];
        // @ts-ignore
        let pcaUnitPoints = pcaUnits.data.map(d => [this.settings.xScale(d[0]), this.settings.yScale(d[1]), this.settings.zScale(d[2])]);

        //</editor-fold>


        //<editor-fold desc="Setup 3d objects.">
        this.data3d = [];
        let origin = [this.contentWidth / 2, this.contentHeight / 2], startAngle = Math.PI / 8, beta = 0, alpha = 0;
        this.alpha = alpha;
        this.beta = beta;
        this.startAngle = startAngle;
        this.canvas.call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd));

        this.shape3d = {};

        this.obj3d = _3d()
            .x(d => (d[0]))
            .y(d => (d[1]))
            .z(d => (d[2]))
            .scale(1)
            .origin(origin)
            .rotateX(startAngle)
            .rotateY(startAngle);//used for sorting purpose only

        this.shape3d['line3d'] = _3d()
            .x(d => (d[0]))
            .y(d => (d[1]))
            .z(d => (d[2]))
            .shape("LINE")
            .scale(1)
            .origin(origin)
            .rotateX(startAngle)
            .rotateY(startAngle);

        this.shape3d['point3d'] = _3d()
            .x(d => (d[0]))
            .y(d => (d[1]))
            .z(d => (d[2]))
            .scale(1)
            .origin(origin)
            .rotateX(startAngle)
            .rotateY(startAngle);


        let mouseX, mouseY, mx, my;

        //@ts-ignore
        function dragStart() {
            mx = d3.event.x;
            my = d3.event.y;
        }

        //@ts-ignore
        function dragged() {
            mouseX = mouseX || 0;
            mouseY = mouseY || 0;
            thisObject.beta = (d3.event.x - mx + mouseX) * Math.PI / 360 * (-1);
            thisObject.alpha = (d3.event.y - my + mouseY) * Math.PI / 360;
            thisObject.drawShapes(thisObject.processData());
        }

        //@ts-ignore
        function dragEnd() {
            mouseX = d3.event.x - mx + mouseX;
            mouseY = d3.event.y - my + mouseY;
        }

        //</editor-fold>


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
            let axesData = pcaUnitPoints.map(pcaUnitPoint => [pcaZeroPoint, pcaUnitPoint]);
            this.data3d.push({
                objectType: "line3d",
                data: axesData,
                draw: function (ctx) {
                    ctx.beginPath();
                    ctx.strokeStyle = "red";
                    ctx.moveTo(this[0].projected.x, this[0].projected.y);
                    ctx.lineTo(this[1].projected.x, this[1].projected.y);
                    ctx.stroke();
                }
            });
            if (this.settings.axisLabels) {
                this.settings.axisLabels.forEach((lbl, i) => pcaUnitPoints[i].text = lbl)
                this.data3d.push({
                    objectType: "point3d",
                    data: pcaUnitPoints,
                    draw: function (ctx) {
                        //This object here refers to the owner of the draw method means the 3d data object itself
                        ctx.fillStyle = "black";
                        let mt = ctx.measureText(this.text);
                        ctx.fillText(this.text, this.projected.x-mt.width/2, this.projected.y);
                    }
                });
            }
        }
        //Draw the initial shapes
        this.drawShapes(this.processData());
    }
    private processData() {
        let thisObject = this;
        let projectedData = [];
        thisObject.data3d.forEach(dataObj => {
            let projectedDataForType = thisObject.shape3d[dataObj.objectType].rotateY(thisObject.beta + thisObject.startAngle).rotateX(thisObject.alpha + thisObject.startAngle)(dataObj.data);
            //If the type is line3d then we need to add the draw method.
            projectedDataForType.forEach(d => {
                //TODO: how if we want to use the default draw method.
                d.draw = dataObj.draw
            });
            projectedData = projectedData.concat(projectedDataForType);
        });
        //sort
        projectedData.sort(thisObject.obj3d.sort);
        return projectedData;
    }
    private drawShapes(projectedData) {
        let thisObject = this;
        let ctx = this.canvas.node().getContext("2d");
        //Clear rect
        ctx.clearRect(0, 0, thisObject.contentWidth, thisObject.contentHeight);
        projectedData.forEach(d => {
            d.draw(ctx);
        });
    }
    public async plotScatter(data, originalPosition, scatterSettings) {
        let thisObject = this;
        let options = {
            size: 50,
            radius: 3,
            padding: 3,
            fill: "steelblue",
            xScale: undefined,
            yScale: undefined,
            zScale: undefined
        };
        for (let prop in scatterSettings) {
            options[prop] = scatterSettings[prop];
        }
        //@ts-ignore
        let pcaPoint = this.pca.predict([originalPosition]).data[0];
        //Take top 3 coordinates
        let x = this.settings.xScale(pcaPoint[0]);
        let y = this.settings.yScale(pcaPoint[1]);
        let z = this.settings.zScale(pcaPoint[2]);

        //create the boundary
        let boxRadius = options.size/2;
        let boundaryData = [
            [offset([1 * boxRadius, 1 * boxRadius, -1 * boxRadius]), offset([-1 * boxRadius, 1 * boxRadius, -1 * boxRadius])],
            [offset([-1 * boxRadius, -1 * boxRadius, -1 * boxRadius]), offset([1 * boxRadius, -1 * boxRadius, -1 * boxRadius])],
            [offset([1 * boxRadius, 1 * boxRadius, -1 * boxRadius]), offset([1 * boxRadius, -1 * boxRadius, -1 * boxRadius])],
            [offset([-1 * boxRadius, 1 * boxRadius, -1 * boxRadius]), offset([-1 * boxRadius, -1 * boxRadius, -1 * boxRadius])],
            [offset([1 * boxRadius, 1 * boxRadius, 1 * boxRadius]), offset([-1 * boxRadius, 1 * boxRadius, 1 * boxRadius])],
            [offset([-1 * boxRadius, -1 * boxRadius, 1 * boxRadius]), offset([1 * boxRadius, -1 * boxRadius, 1 * boxRadius])],
            [offset([1 * boxRadius, 1 * boxRadius, 1 * boxRadius]), offset([1 * boxRadius, -1 * boxRadius, 1 * boxRadius])],
            [offset([-1 * boxRadius, 1 * boxRadius, 1 * boxRadius]), offset([-1 * boxRadius, -1 * boxRadius, 1 * boxRadius])],
            [offset([-1 * boxRadius, 1 * boxRadius, 1 * boxRadius]), offset([-1 * boxRadius, 1 * boxRadius, -1 * boxRadius])],
            [offset([1 * boxRadius, 1 * boxRadius, 1 * boxRadius]), offset([1 * boxRadius, 1 * boxRadius, -1 * boxRadius])],
            [offset([-1 * boxRadius, -1 * boxRadius, 1 * boxRadius]), offset([-1 * boxRadius, -1 * boxRadius, -1 * boxRadius])],
            [offset([1 * boxRadius, -1 * boxRadius, 1 * boxRadius]), offset([1 * boxRadius, -1 * boxRadius, -1 * boxRadius])]
        ];
        this.data3d.push({
            objectType: "line3d",
            data: boundaryData,
            draw: function (ctx) {
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.moveTo(this[0].projected.x, this[0].projected.y);
                ctx.lineTo(this[1].projected.x, this[1].projected.y);
                ctx.stroke();
            }
        });
        //Now create the points.
        if(!options.xScale){
            options.xScale = d3.scaleLinear().domain(d3.extent(data.x)).range([-boxRadius + options.padding, boxRadius - options.padding])
        }
        if(!options.yScale){
            options.yScale = d3.scaleLinear().domain(d3.extent(data.y)).range([-boxRadius + options.padding, boxRadius - options.padding])
        }
        if(!options.zScale){
            options.zScale = d3.scaleLinear().domain(d3.extent(data.z)).range([-boxRadius+ options.padding, boxRadius - options.padding])
        }
        let pointData = data.x.map((xVal, i)=>offset([options.xScale(xVal), options.yScale(data.y[i]), options.zScale(data.z[i])]));

        this.data3d.push({
            objectType: "point3d",
            data:pointData,
            draw: function(ctx){
                ctx.beginPath();
                ctx.fillStyle = options.fill;
                ctx.arc(this.projected.x, this.projected.y, options.radius, 0, Math.PI*2);
                ctx.fill();
            }
        });

        thisObject.drawShapes(thisObject.processData());
        function offset(point) {
            return [x + point[0], y + point[1], z + point[2]];
        }
    }
}