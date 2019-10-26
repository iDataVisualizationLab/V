/**Some ideas of this class are adopted from: https://gist.github.com/mthh/7e17b680b35b83b49f1c22a3613bd89f***/
import * as d3 from 'd3';

export interface RadarChartSettings {
    [key: string]: any;

    width?: number,				        //Width of the circle
    height?: number,			        //Height of the circle
    margin?: any,                       //The margins of the SVG
    showAxes?: boolean,
    levels?: number,			        //How many levels or inner circles should there be drawn
    levelStrokeColorScheme?: any,       //Use to color the circles of the levels
    showRings?: boolean,                 //
    maxValue?: number, 			        //What is the value that the biggest circle will represent
    labelFactor?: number, 	            //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth?: number, 		        //The number of pixels after which a label needs to be given a new line
    opacityArea?: number, 	            //The opacity of the area of the blob
    dotRadius?: number, 		        //The size of the colored circles of each blog
    opacityCircles?: number, 	        //The opacity of the circles of each blob
    strokeWidth?: any, 		        //The width of the stroke around each blob
    roundStrokes?: boolean,	            //If true the area and stroke will follow a round path (cardinal-closed)
    fillBlobs?: boolean,                //If true will create a fill for the blobs
    fillColor?: any,	                //Color function (d)=>color, for the data item blob color (or "none" to not fill)
    strokeColor?: any,	                //Color function (d)=>color, for the data item stroke color
    showMarkers?: boolean,
    format?: string,                    //Format of the level labels (using d3.format)
    unit?: string,                      //Unit to be concatenated to the level labels
    legend?: boolean,                   //Toggle legend
    paddingLeft?: number,               //Padding
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    showLevelLabels?: boolean,          //Level Labels
    showAxisLabels?: boolean,           //Axis Labels
    showToolTip?: boolean,
    blobMode?: boolean,
}

export type RadarChartItemDimension = {
    axis: string,
    value: number
}
export type RadarChartItem = {
    axes: RadarChartItemDimension[]
    data?: any
}

export class RadarChart {
    private settings: RadarChartSettings = {
        width: 600,
        height: 600,
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        paddingLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        showAxes: true,
        showRings: true,
        levels: 3,
        maxValue: 0,
        labelFactor: 1.25,
        wrapWidth: 60,
        opacityArea: 0.35,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        strokeColor: () => "steelblue",
        fillColor: () => "steelblue",
        fillBlobs: true,
        showMarkers: true,
        format: '.2',
        unit: '',
        legend: false,
        showLevelLabels: true,
        showAxisLabels: true,
        showToolTip: false,
        blobMode: false,
    };
    private readonly wrap = (text, width) => {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    };//wrap
    private data;
    private canvasWidth;
    private canvasHeight;
    private svg;
    private dims;

    constructor(htmlContainer, radarChartData: RadarChartItem[], radarChartSettings: RadarChartSettings) {
        let thisObj = this;
        //Some constant
        const max = Math.max;
        const min = Math.min;
        const sin = Math.sin;
        const cos = Math.cos;
        const HALF_PI = Math.PI / 2;

        ////////////////////////////////////////////////////////
        //////////// Some housekeeping tasks /////////////
        /////////////////////////////////////////////////////////
        //<editor-fold desc="Some housekeeping tasks">
        this.data = radarChartData;
        this.dims = this.data[0].axes.length;
        //Copy the settings if there are
        if (radarChartSettings != null) {
            for (let prop in radarChartSettings) {
                this.settings[prop] = radarChartSettings[prop];
            }
        }
        //If strokewidth is a number, change it to a function
        if (typeof (this.settings.strokeWidth) === "number") {
            this.settings.strokeWidth = () => this.settings.strokeWidth;
        }
        //If some values of the margin are not defined set them as 0.
        this.settings.margin.left = this.settings.margin.left ? this.settings.margin.left : 0;
        this.settings.margin.top = this.settings.margin.top ? this.settings.margin.top : 0;
        this.settings.margin.right = this.settings.margin.right ? this.settings.margin.right : 0;
        this.settings.margin.bottom = this.settings.margin.bottom ? this.settings.margin.bottom : 0;
        //Find width and height
        if (!this.settings.width) {
            this.settings.width = htmlContainer.getBoundingClientRect().width;
        }
        if (!this.settings.height) {
            this.settings.height = htmlContainer.getBoundingClientRect().height;
        }

        //contentWidth
        let contentWidth = this.settings.width - this.settings.paddingLeft - this.settings.paddingRight - this.settings.margin.left - this.settings.margin.right;
        let contentHeight = this.settings.height - this.settings.paddingTop - this.settings.paddingBottom - this.settings.margin.top - this.settings.margin.bottom;
        this.canvasWidth = contentWidth;
        this.canvasHeight = contentHeight;

        //Scale
        let maxValue = 0;
        for (let j = 0; j < this.data.length; j++) {
            for (let i = 0; i < this.data[j].axes.length; i++) {
                this.data[j].axes[i]['id'] = this.data[j].name;
                let val = this.settings.blobMode ? this.data[j].axes[i]['value'].max : this.data[j].axes[i]['value'];
                if (val > maxValue) {
                    maxValue = val;
                }
            }
        }

        maxValue = max(this.settings.maxValue, maxValue);

        const allAxis = this.data[0].axes.map(i => i.axis),	//Names of each axis
            total = allAxis.length,					//The number of different axes
            radius = min(this.canvasWidth / 2, this.canvasHeight / 2), 	//Radius of the outermost circle
            Format = d3.format(this.settings.format),			 	//Formatting
            angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
        //Scale for the radius
        const rScale = d3.scaleLinear()
            .range([radius/5, radius])
            .domain([0, maxValue]);
        //</editor-fold>


        ////////////////////////////////////////////////////////
        //////////// Create the container SVG and g /////////////
        /////////////////////////////////////////////////////////
        //<editor-fold desc="Create the container SVG and g">
        const parent = d3.select(htmlContainer);
        //Remove whatever chart with the same id/class was present before
        parent.select("svg").remove();
        //Initiate the radar chart SVG
        let svg = parent.append("svg")
            .attr("width", this.settings.width)
            .attr("height", this.settings.height)
            .attr("class", "radar");

        //Append a g element
        let g = svg.append("g")
            .attr("transform", "translate(" + (this.settings.width / 2) + "," + (this.settings.height / 2) + ")");
        //</editor-fold>


        /////////////////////////////////////////////////////////
        ////////// Glow filter for some extra pizzazz ///////////
        /////////////////////////////////////////////////////////
        //<editor-fold desc="Glow filter for some extra pizzazz">
        //Filter for the outside glow
        let filter = g.append('defs').append('filter').attr('id', 'glow'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
        //</editor-fold>


        if (this.settings.showAxes) {
            /////////////////////////////////////////////////////////
            /////////////// Draw the Circular grid //////////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the Circular grid">
            //Wrapper for the grid & axes
            let axisGrid = g.append("g").attr("class", "axisWrapper");

            //Draw the background circles
            axisGrid.selectAll(".levels")
                .data(d3.range(1, (this.settings.levels + 1)).reverse())
                .enter()
                .append("circle")
                .attr("class", "gridCircle")
                .attr("r", d => radius / this.settings.levels * d)
                .style("fill", "#CDCDCD")
                .style("stroke-width", (this.settings.showRings) ? 1 : 0)
                .style("stroke", (d, i) => this.settings.levelStrokeColorScheme ? this.settings.levelStrokeColorScheme[this.settings.levels - 1 - i] : "#CDCDCD")//Need to -1 - i since the levels circles are reversed (display from outside in)
                .style("fill-opacity", this.settings.opacityCircles)
                .style("filter", "url(#glow)");

            //Text indicating at what % each level is
            if (this.settings.showLevelLabels) {
                axisGrid.selectAll(".axisLabel")
                    .data(d3.range(1, (this.settings.levels + 1)).reverse())
                    .enter().append("text")
                    .attr("class", "axisLabel")
                    .attr("x", 4)
                    .attr("y", d => -d * radius / this.settings.levels)
                    .attr("dy", "0.4em")
                    .style("font-size", "10px")
                    .attr("fill", "#737373")
                    .text(d => Format(maxValue * d / this.settings.levels) + this.settings.unit);
            }
            //</editor-fold>

            /////////////////////////////////////////////////////////
            //////////////////// Draw the axes //////////////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the axes">
            //Create the straight lines radiating outward from the center
            var axis = axisGrid.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");
            //Append the lines
            axis.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI))
                .attr("y2", (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI))
                .attr("class", "line")
                .style("stroke", "white")
                .style("stroke-width", "2px");
            if (this.settings.showAxisLabels) {
                //Append the labels at each axis
                axis.append("text")
                    .attr("class", "legend")
                    .style("font-size", "11px")
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.35em")
                    .attr("x", (d, i) => rScale(maxValue * this.settings.labelFactor) * cos(angleSlice * i - HALF_PI))
                    .attr("y", (d, i) => rScale(maxValue * this.settings.labelFactor) * sin(angleSlice * i - HALF_PI))
                    .text(d => d)
                    .call(this.wrap, this.settings.wrapWidth);
            }
            //</editor-fold>

        }

        //Create a wrapper for the blobs
        const blobWrapper = g.selectAll(".radarWrapper")
            .data(this.data)
            .enter().append("g")
            .attr("class", "radarWrapper");

        //interpolation
        let interpolation = this.settings.roundStrokes ? d3.curveCardinalClosed.tension(0.5) : d3.curveLinearClosed;
        if (!this.settings.blobMode) {
            /////////////////////////////////////////////////////////
            ////////// Draw the radar chart using lines //////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the radar chart using line">
            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart blobs ////////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the radar chart blobs">
            //The radial line function
            const radarLine = d3.radialLine()
                // .curve(this.settings.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
                .curve(interpolation)
                .radius(d => rScale(d.value))
                .angle((d, i) => i * angleSlice);

            //Append the backgrounds
            if (this.settings.fillBlobs) {
                blobWrapper
                    .append("path")
                    .attr("class", "radarArea")
                    .attr("d", d => radarLine(d.axes))
                    .style("fill", d => this.settings.fillColor(d))
                    .style("fill-opacity", this.settings.opacityArea)
                    .on('mouseover', function (d, i) {
                        //Dim all blobs
                        parent.selectAll(".radarArea")
                            .transition().duration(200)
                            .style("fill-opacity", 0.1);
                        //Bring back the hovered over blob
                        d3.select(this)
                            .transition().duration(200)
                            .style("fill-opacity", 0.7);
                    })
                    .on('mouseout', () => {
                        //Bring back all blobs
                        parent.selectAll(".radarArea")
                            .transition().duration(200)
                            .style("fill-opacity", this.settings.opacityArea);
                    });
            }
            //</editor-fold>

            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart outlines /////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the radar chart outlines">
            //Create the outlines
            blobWrapper.append("path")
                .attr("class", "radarStroke")
                .attr("d", function (d) {
                    return radarLine(d.axes);
                })
                .style("stroke-width", d => this.settings.strokeWidth(d) + "px")
                .style("stroke", (d) => this.settings.strokeColor(d))
                .style("fill", "none")
                .style("filter", "url(#glow)");

            if (this.settings.showMarkers) {
                //Append the circles
                blobWrapper.selectAll(".radarCircle")
                    .data(d => d.axes)
                    .enter()
                    .append("circle")
                    .attr("class", "radarCircle")
                    .attr("r", this.settings.dotRadius)
                    .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
                    .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
                    .style("fill", (d) => this.settings.strokeColor(d))
                    .style("fill-opacity", 0.8);
            }
            //</editor-fold>

            /////////////////////////////////////////////////////////
            //////// Append invisible circles for tooltip ///////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Append invisible circles for tooltip">
            if (this.settings.showMarkers && this.settings.showToolTip) {
                //Wrapper for the invisible circles on top
                const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
                    .data(this.data)
                    .enter().append("g")
                    .attr("class", "radarCircleWrapper");

                //Append a set of invisible circles on top for the mouseover pop-up
                blobCircleWrapper.selectAll(".radarInvisibleCircle")
                    .data(d => d.axes)
                    .enter().append("circle")
                    .attr("class", "radarInvisibleCircle")
                    .attr("r", this.settings.dotRadius * 1.5)
                    .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
                    .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
                    .style("fill", "none")
                    .style("pointer-events", "all")
                    .on("mouseover", function (d, i) {
                        tooltip
                            .attr('x', this.cx.baseVal.value - 10)
                            .attr('y', this.cy.baseVal.value - 10)
                            .transition()
                            .style('display', 'block')
                            .text(Format(d.value) + thisObj.settings.unit);
                    })
                    .on("mouseout", function () {
                        tooltip.transition()
                            .style('display', 'none').text('');
                    });

                const tooltip = g.append("text")
                    .attr("class", "tooltip")
                    .attr('x', 0)
                    .attr('y', 0)
                    .style("font-size", "12px")
                    .style('display', 'none')
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.35em");
            }
            //</editor-fold>
            //</editor-fold>
        } else {
            /////////////////////////////////////////////////////////
            ////////// Draw the radar chart using blobs //////////////
            /////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart blobs ////////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the radar chart blobs">
            //The radial line function
            const radarLine0 = d3.radialLine()
                .curve(interpolation)
                .radius(d => rScale(d.value.min))
                .angle((d, i) => (this.dims - i - 1) * angleSlice);//Need to reverse the angle too, since we reversed the order of the path inside to create a hole.
            const radarLine1 = d3.radialLine()
                .curve(interpolation)
                .radius(d => rScale(d.value.max))
                .angle((d, i) => i * angleSlice);
            //Append the backgrounds
            if (this.settings.fillBlobs) {
                blobWrapper
                    .append("path")
                    .attr("class", "radarArea")
                    .attr("d", d => {
                        return radarLine1(d.axes) + radarLine0(d.axes.map(d => Object.assign({}, d)).reverse());
                    })
                    .style("fill", d => this.settings.fillColor(d))
                    .style("fill-opacity", this.settings.opacityArea)
                    .on('mouseover', function (d, i) {
                        //Dim all blobs
                        parent.selectAll(".radarArea")
                            .transition().duration(200)
                            .style("fill-opacity", 0.1);
                        //Bring back the hovered over blob
                        d3.select(this)
                            .transition().duration(200)
                            .style("fill-opacity", 0.7);
                    })
                    .on('mouseout', () => {
                        //Bring back all blobs
                        parent.selectAll(".radarArea")
                            .transition().duration(200)
                            .style("fill-opacity", this.settings.opacityArea);
                    });
            }
            //</editor-fold>
            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart outlines /////////////
            /////////////////////////////////////////////////////////
            //<editor-fold desc="Draw the radar chart outlines">
            //Create the outlines
            blobWrapper.append("path")
                .attr("class", "radarStroke")
                .attr("d", function (d) {
                    return radarLine1(d.axes) + radarLine0(d.axes.map(d => Object.assign({}, d)).reverse());
                })
                .style("stroke-width", d => this.settings.strokeWidth(d) + "px")
                .style("stroke", (d) => this.settings.strokeColor(d))
                .style("fill", "none")
                .style("filter", "url(#glow)");

            if (this.settings.showMarkers) {
                //Append the circles
                let enterCircles = blobWrapper.selectAll(".radarCircle")
                    .data(d => d.axes)
                    .enter();
                enterCircles.append("circle")//min circles
                    .attr("class", "radarCircle")
                    .attr("r", this.settings.dotRadius)
                    .attr("cx", (d, i) => rScale(d.value.min) * cos(angleSlice * i - HALF_PI))
                    .attr("cy", (d, i) => rScale(d.value.min) * sin(angleSlice * i - HALF_PI))
                    .style("fill", (d) => this.settings.strokeColor(d))
                    .style("fill-opacity", 0.8);
                enterCircles.append("circle")//max circles
                    .attr("class", "radarCircle")
                    .attr("r", this.settings.dotRadius)
                    .attr("cx", (d, i) => rScale(d.value.max) * cos(angleSlice * i - HALF_PI))
                    .attr("cy", (d, i) => rScale(d.value.max) * sin(angleSlice * i - HALF_PI))
                    .style("fill", (d) => this.settings.strokeColor(d))
                    .style("fill-opacity", 0.8);
            }
            //</editor-fold>
        }
    }

    //<editor-fold desc="utils">
    /**
     * Can use this helper method to convert points and axes to radar chart data.
     * @param points in form of [[val1, val2, val3, ...], ...] array of array of number of dimensions
     * @param axes in form of ['axis1', 'axis2', 'axis3', ...] number of dimensions
     */
    public static pointsToRadarChartData(points, axes) {
        return points.map(point => {
            let item = {};
            if (point.data) {
                item['data'] = point.data;
            }
            item['axes'] = axes.map((axis, i) => {
                return {
                    axis: axis,
                    value: point[i]
                }
            });
            return item;
        });
    }

    /**
     * Can use this helper method to convert points and axes to radar chart blob mode data.
     * @param points in form of [[[val1Min, val1Max], [val2Min, val2Max], [val3Min, val3Max] ...], ...] array of array of number of dimensions
     * @param axes in form of ['axis1', 'axis2', 'axis3', ...] number of dimensions
     */
    public static pointsToRadarChartBlobData(points, axes) {
        return points.map(point => {
            let item = {};
            if (point.data) {
                item['data'] = point.data;
            }
            item['axes'] = axes.map((axis, i) => {
                return {
                    axis: axis,
                    value: {min: point[i][0], max: point[i][1]}
                }
            });
            return item;
        });
    }

    //</editor-fold>
}