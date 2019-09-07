let allSVG = [];
let pointOpacity = 0.9;
let selectedVar = 0;
let selectedScag = 0;

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
    let bins = dataS.allYearsBins[m];
    let dataPoints = bins.map(bin => {
        let item = [];
        //initialize.
        if (bin.length === 1) {
            for (let i = 0; i < dataS.Variables.length; i++) {
                item.push([bin[0][i], bin[0][i]]);//Min for the first and max for the second (both are the same).
            }
            item.data = {strokeWidth: 0.3};
        } else {
            for (let i = 0; i < dataS.Variables.length; i++) {
                item.push([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);//Min for the first and max for the second.
                item.data = {strokeWidth: 0};
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
        levelStrokeColorScheme: ['green', 'orange', 'red'],
        legend: false,
        showLevelLabels: false,
        showAxisLabels: false,
        roundStrokes: true,
        strokeWidth: (d) => d.data.strokeWidth,
        fillColor: () => 'black',
        strokeColor: () => 'black',
        showMarkers: false,
        showToolTip: false,
        fillBlobs: true,
        blobMode: true
    };
    let radarChartData = RadarChart.pointsToRadarChartBlobData(dataPoints, dataS.Variables.map((d, i) => "v" + i));
    let rc = new RadarChart(svg2.node(), radarChartData, radarChartSettings);
}