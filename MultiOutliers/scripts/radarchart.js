let allSVG = [];
let pointOpacity = 0.9;
let selectedVar = 0;
let selectedScag = 0;
let blobColor = '#474747';
function updateSubLayout(m) {
    svg.selectAll(".force" + m).remove();
    let svg2 = svg.append("svg")
        .attr("class", "force" + m)
        .attr("width", forceSize)
        .attr("height", forceSize)
        .attr("x", xStep - forceSize / 2 + m * XGAP_)
        .attr("y", 26);
    allSVG.push(svg2);
    let size = snapshotSize;
    // var size = 60;//TODO: This is for the teaser only (switch back the previous one for normal page)
    let padding = 0;
    let margin = forceSize / 2 - size / 2;

    let yearData = dataS.YearsData[m];
    let dataPoints = dataS.Countries.map((country, c_i) => {
        let item = [];
        for (let v_i = 0; v_i < dataS.Variables.length; v_i++) {
            let varName = 's' + v_i;
            item.push(yearData[varName][c_i]);
        }
        item.data = {country: country};
        let yearOutlyingScore = yearData.Scagnostics0[0];
        let leaveOutScore = dataS.CountriesData[country][m].Outlying;
        item.data.outlyingDif = leaveOutScore - yearOutlyingScore;
        return item;
    });

    let outlyingPoints = dataPoints.filter(d => Math.abs(d.data.outlyingDif) >= outlyingCut);
    let normalPoints = dataPoints.filter(d => Math.abs(d.data.outlyingDif) < outlyingCut);
    //Rebin
    let binOptions = {
        startBinGridSize: 10,
        minBins: 3,
        maxBins: 7,
        incrementA: 1,
        incrementB: 5,
        decrementA: 0.9,
        decrementB: 0
    };
    let bins = [];
    if (normalPoints.length > 0) {//Rebin the normal points.
        let binner = ndleaderbin(normalPoints, binOptions);
        bins = bins.concat(binner.bins);
    }
    bins = bins.concat(outlyingPoints.map(d => [d]));//Each outlying item is one bin
    dataPoints = bins.map(bin => {
        let item = [];
        //initialize.
        if (bin.length === 1) {
            for (let i = 0; i < dataS.Variables.length; i++) {
                item.push([bin[0][i], bin[0][i]]);
            }
            item.data = {
                strokeWidth: 0.3,
                outlyingDif: bin[0].data.outlyingDif,
                itemNames: bin.map(b => b.data.country)
            };
        } else {
            for (let i = 0; i < dataS.Variables.length; i++) {
                item.push([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);//Min for the first and max for the second.
                item.data = {strokeWidth: 0, outlyingDif: 0, itemNames: bin.map(b => b.data.country)};
            }
            //For each point in bin.
            bin.forEach(point => {
                //For each variable
                for (let i = 0; i < dataS.Variables.length; i++) {
                    let val = point[i];
                    if (val < item[i][0]) { //The variable is smaller than the min
                        item[i][0] = val;
                    }
                    if (val > item[i][1]) {//The variable is greater than the max
                        item[i][1] = val;
                    }
                }
            });
        }

        item.forEach(x => {
            let m = (x[1] - x[0]) / 4;
            if (x[0] !== x[1]) {//TODO: This we are taking 0.25 to 0.75 of the band of each group (to avoid cluttering issue).
                x[0] = x[0] + m;
                x[1] = x[1] - m;
            }
        });

        return item;
    });

    let radarChartSettings = {
        width: forceSize,
        height: forceSize,
        margin: {left: 1, top: 1, right: 1, bottom: 1},
        paddingLeft: margin,
        paddingTop: margin,
        paddingRight: margin,
        paddingBottom: margin,
        showAxes: false,
        legend: false,
        showLevelLabels: false,
        showAxisLabels: false,
        roundStrokes: true,
        showRings: true,
        levels: 5,
        strokeWidth: (d) => d.data.strokeWidth + 0.01,
        fillColor: (d) => d.data.outlyingDif == 0 ? blobColor : d.data.outlyingDif < 0 ? 'red' : 'green',
        strokeColor: (d) => d.data.outlyingDif == 0 ? blobColor : d.data.outlyingDif < 0 ? 'red' : 'green',
        showMarkers: false,
        showToolTip: false,
        fillBlobs: true,
        blobMode: true
    };

    let radarChartData = RadarChart.pointsToRadarChartBlobData(dataPoints, dataS.Variables);
    svg2.node().chartData = radarChartData; //Store the data for future use.

    let rc = new RadarChart(svg2.node(), radarChartData, radarChartSettings);


    svg2.on("click", showDetails);
}

function showDetails() {
    d3.select(".d3-tip").style("background-color", "white");
    tip.html(function () {
        return "<div id='chartDetails' style='width:400px; height:400px; pointer-events: auto; opacity: 1.0; background-color: white;'>" +
            "<a href='#' class='close' onclick='tip.hide()'>" +
            "</div>"
    });

    tip.direction('s');
    tip.offset([40, 0]);
    tip.show();

    let radarChartSettings = {
        width: 400,
        height: 400,
        margin: {left: 50, top: 50, right: 50, bottom: 50},
        paddingLeft: 20,
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 20,
        showAxes: true,
        legend: false,
        showLevelLabels: false,
        showAxisLabels: true,
        roundStrokes: true,
        showRings: true,
        levels: 5,
        strokeWidth: (d) => 5*d.data.strokeWidth + 0.1,
        fillColor: (d) => d.data.outlyingDif == 0 ? blobColor : d.data.outlyingDif < 0 ? 'red' : 'green',
        strokeColor: (d) => d.data.outlyingDif == 0 ? blobColor : d.data.outlyingDif < 0 ? 'red' : 'green',
        showMarkers: false,
        showToolTip: false,
        fillBlobs: true,
        blobMode: true
    };
    new RadarChart(document.getElementById('chartDetails'), this.chartData, radarChartSettings);
}

document.onkeyup = function (e) {
    if (e.key === "Escape") {
        tip.hide();
    }
}
