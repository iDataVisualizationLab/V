var forceSize = 90; // Max size of force layouts at the bottom

var allSVG = [];
var pointOpacity = 0.9;
var selectedVar = 0;
var selectedScag = 0;

function updateSubLayout(m) {
    svg.selectAll(".force" + m).remove();

    var svg2 = svg.append("svg")
        .attr("class", "force" + m)
        .attr("width", forceSize)
        .attr("height", forceSize)
        .attr("x", xStep - forceSize / 2 + m * XGAP_)
        .attr("y", 26);

    allSVG.push(svg2);

    var size = 20;
    // var size = 60;//TODO: This is for the teaser only (switch back the previous one for normal page)
    var padding = 0;

    var x2 = 0;
    var y2 = 0;
    var margin = forceSize / 2 - size / 2;
    svg2.append("rect")
        .attr("class", "frame")
        .attr("x", margin)
        .attr("y", margin)
        .attr("rx", 2)
        .attr("ry", 2)
        // .attr("rx", 5)//TODO: This is for the teaser only (switch back the previous one for normal page)
        // .attr("ry", 5)//TODO: This is for the teaser only (switch back the previous one for normal page)
        .attr("width", size - padding)
        .attr("height", size - padding)
        .style("fill", function (d) {
            return colorRedBlue(dataS.YearsData[m].Scagnostics0[0]);
        })
        //.style("fill-opacity",0.9)
        .style("stroke", "#000")
        .style("stroke-width", 0.1);

    var dataPoints = [];
    for (var c = 0; c < dataS.Countries.length; c++) {
        var obj = {};
        obj.country = dataS.Countries[c];
        obj.year = m;
        for (var v = 0; v < dataS.Variables.length; v++) {
            obj["s" + v] = dataS.YearsData[m]["s" + v][c];
            obj["v" + v] = dataS.CountriesData[obj.country][m]["v" + v];
            if (v % 2 == 1) {
                var pair = Math.floor(v / 2);
                obj["Scagnostics" + pair] = dataS.YearsData[m]["Scagnostics" + pair]; // 0 is the index of Outlying
                obj["ScagnosticsLeave1out" + pair] = []; // 0 is the index of Outlying
                for (var s = 0; s < dataS.Scagnostics.length; s++) {
                    obj["ScagnosticsLeave1out" + pair].push(dataS.CountriesData[obj.country][m][dataS.Scagnostics[s]]);
                }
            }
        }
        dataPoints.push(obj);
    }

    //Filter out data points with "NaN"
    dataPoints = dataPoints.filter(d => {
        for (let i = 0; i < dataS.Variables.length; i++) {
            if (d['v' + i] === "NaN") {
                return false;
            }
        }
        if (isNaN(d["ScagnosticsLeave1out0"][0] - d["Scagnostics0"][0])) {
            return false;
        }
        return true;
    });

    let radarData = [];
    for (let i = 0; i < dataPoints.length; i++) {
        let point = {};
        point.axes = [];
        for (let j = 0; j < dataS.Variables.length; j++) {
            let item = {
                axis: 's' + j,
                value: dataPoints[i]['s' + j],
            }
            point.axes.push(item);
        }
        point.data = dataPoints[i];
        radarData.push(point);
    }

    const radarChartOptions = {
        w: 90,				//Width of the circle
        h: 90,				//Height of the circle
        levels: 5,				//How many levels or inner circles should there be drawn
        maxValue: 1, 			//What is the value that the biggest circle will represent
        labelFactor: 1.15, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, 	//The opacity of the area of the blob
        dotRadius: 2, 			//The size of the colored circles of each blog
        opacityCircles: 0.1, 	//The opacity of the circles of each blob
        strokeWidth: 1, 		//The widthue of the stroke around each blob
        strokeOpacity: 0.7,
        roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
        color: pointColor,
        format: '.1',
        unit: '',
        legend: false,
        drawContentBound: drawContentBound
    };

    let svg_radar = RadarChart(svg2, radarData, radarChartOptions);

    function pointColor(d, i) {
        return (d.data && d.data.data) ? d.data.data : 'steelblue';
    }

    function drawContentBound() {

    }
}

/////////////////////////////////////////////////////////
/////////////// Adopted from ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

const RadarChart = function RadarChart(svg, data, options) {
    const cfg = {
        w: 90,				//Width of the circle
        h: 90,				//Height of the circle
        margin: {top: 2, right: 2, bottom: 2, left: 2}, //The margins of the SVG
        levels: 3,				//How many levels or inner circles should there be drawn
        maxValue: 0, 			//What is the value that the biggest circle will represent
        labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, 	//The opacity of the area of the blob
        dotRadius: 2, 			//The size of the colored circles of each blog
        opacityCircles: 0.1, 	//The opacity of the circles of each blob
        strokeWidth: 3, 		//The width of the stroke around each blob
        strokeOpacity: 0.5,
        roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scale.ordinal(d3.schemeCategory10),	//Color function,
        format: '.2%',
        unit: '',
        legend: false
    };

    //Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }//for i
    }//if

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = 0;
    for (let j = 0; j < data.length; j++) {
        for (let i = 0; i < data[j].axes.length; i++) {
            data[j].axes[i]['id'] = data[j].name;
            if (data[j].axes[i]['value'] > maxValue) {
                maxValue = data[j].axes[i]['value'];
            }
        }
    }
    maxValue = max(cfg.maxValue, maxValue);

    const allAxis = data[0].axes.map((i, j) => i.axis),	//Names of each axis
        total = allAxis.length,					//The number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2), 	//Radius of the outermost circle
        Format = d3.format(cfg.format),			 	//Formatting
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    const rScale = d3.scale.linear()
        .range([0, radius])
        .domain([0, maxValue]);
    //Append a g element
    let g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    //Filter for the outside glow
    let filter = g.append('defs').append('filter').attr('id', 'glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    let axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter", "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "14px")
        .attr("fill", "#737373")
        .text(d => Format(maxValue * d / cfg.levels) + cfg.unit);

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

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

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    const radarLine = d3.svg.line.radial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
        // radarLine.curve(d3.curveCardinalClosed)
        // radarLine.curve(d3.curveCatmullRomClosed)
    }

    //Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function (d, i) {
            return radarLine(d.axes);
        })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(d, i))
        .style("opacity", cfg.strokeOpacity)
        .style("fill", "none")
        .style("filter", "url(#glow)")
        .on('mouseover', function (d, i) {
            //Dim all blobs
            svg.selectAll(".radarStroke")
                .transition().duration(200)
                .style("opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("opacity", 1.0)
                .style("stroke", 'yellow')
                .style("stroke-width", 2 + "px");
            // .style("filter", "none");
            d3.select(this).raise();
        })
        .on('mouseout', () => {
            //Bring back all blobs
            svg.selectAll(".radarStroke")
                .transition().duration(200)
                .style("opacity", cfg.strokeOpacity)
                .style("stroke", (d, i) => cfg.color(d, i));
        });
    return svg;
}
