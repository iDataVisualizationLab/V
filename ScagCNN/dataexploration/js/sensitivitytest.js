let model;
let plot2011 = [[0, 0], [0, 0], [0, 0], [0.04, 0.05], [0, 0.02], [0, 0], [0, 0], [0, 0], [0.07, 0.23], [0, 0], [0, 0], [0.01, 0.04], [0, 0], [0.05, 0.14], [0.02, 0.04], [0, 0.02], [0.52, 0.8], [0.01, 0.04], [0, 0], [0.03, 0.05], [0.01, 0.02], [0.02, 0.04], [0.01, 0], [0.14, 0.14], [0.09, 0.18], [0.03, 0.04], [0.01, 0.04], [0, 0.02], [0, 0], [0.02, 0.02], [0.07, 0.13], [0, 0.02], [0.07, 0.05], [0, 0], [0, 0.02], [0, 0], [0.02, 0.02], [0.02, 0.04], [0, 0.02], [0, 0], [0.01, 0.04], [0.15, 0.27], [0.01, 0], [0.02, 0.04], [0, 0], [0, 0.02], [0.12, 0.07], [0.03, 0], [0, 0], [0.04, 0.04], [0.01, 0.02], [0.06, 0.07], [0.07, 0.11], [0.04, 0.09], [0.05, 0.09], [0, 0.02], [0, 0], [0.01, 0.05], [0, 0], [0, 0], [0, 0], [0.02, 0.14], [0, 0], [0, 0], [0.18, 0.34], [0, 0], [0, 0], [0, 0], [0.01, 0.05], [0, 0], [0.69, 1], [0.05, 0.07], [0, 0], [0, 0], [0, 0], [0.28, 0.39], [0, 0.02], [0.04, 0.05], [0, 0], [0.01, 0.04], [0, 0.02], [0, 0], [0, 0], [0, 0], [0, 0], [0.31, 0.59], [0.02, 0.07], [0.31, 0.5], [0, 0], [0, 0], [0, 0], [0.01, 0.02], [0.09, 0.18], [0, 0], [0.01, 0.05], [0.01, 0.02], [0.01, 0.04], [0, 0.02], [0, 0], [0, 0], [0, 0], [0.07, 0.09], [0, 0], [0.01, 0], [0, 0], [0.07, 0.13], [0, 0], [0, 0], [0.01, 0], [0.55, 0.68], [0.06, 0.09], [0, 0.02], [0, 0], [0.01, 0], [0.03, 0.07], [1, 0.71], [0, 0], [0, 0], [0.15, 0.16], [0.01, 0.05], [0.05, 0.04], [0.02, 0.09], [0, 0], [0.26, 0.45], [0.02, 0.02], [0.01, 0.04], [0.01, 0.04], [0, 0], [0, 0], [0.37, 0.73], [0.41, 0.64]];
let plot2014 = [[0, 0], [0, 0], [0, 0], [0.04, 0.05], [0, 0.02], [0, 0], [0, 0], [0, 0], [0.07, 0.27], [0, 0], [0, 0], [0.01, 0.03], [0, 0], [0.04, 0.12], [0.02, 0.03], [0, 0], [0.55, 0.85], [0.01, 0.03], [0, 0], [0.03, 0.05], [0.02, 0.02], [0.02, 0.03], [0.01, 0], [0.13, 0.13], [0.1, 0.18], [0.03, 0.03], [0.01, 0.03], [0, 0.02], [0, 0], [0.02, 0], [0.07, 0.12], [0, 0.03], [0.06, 0.07], [0, 0], [0.01, 0.03], [0, 0], [0.02, 0.03], [0.02, 0.03], [0, 0.02], [0, 0], [0.01, 0.03], [0.14, 0.23], [0.01, 0], [0.02, 0.03], [0, 0], [0, 0.02], [0.11, 0.08], [0.02, 0], [0, 0], [0.04, 0.05], [0.01, 0.02], [0.05, 0.05], [0.05, 0.07], [0.04, 0.08], [0.04, 0.07], [0, 0.02], [0, 0], [0.01, 0.03], [0, 0], [0, 0], [0, 0], [0.03, 0.13], [0, 0], [0, 0], [0.19, 0.32], [0, 0], [0, 0], [0, 0], [0.02, 0.05], [0, 0], [0.73, 1], [0.06, 0.08], [0, 0], [0, 0], [0, 0], [0.26, 0.37], [0, 0], [0.03, 0.03], [0, 0], [0, 0.02], [0, 0], [0.01, 0], [0, 0], [0, 0], [0, 0], [0.28, 0.5], [0.02, 0.05], [0.32, 0.5], [0, 0], [0, 0], [0, 0], [0.01, 0], [0.09, 0.17], [0, 0], [0.01, 0.05], [0.01, 0.02], [0.01, 0.03], [0, 0.02], [0, 0.02], [0, 0], [0, 0], [0.07, 0.1], [0, 0], [0.01, 0], [0, 0], [0.06, 0.1], [0, 0], [0, 0], [0, 0], [0.55, 0.63], [0.06, 0.08], [0, 0.02], [0, 0], [0.01, 0], [0.03, 0.08], [1, 0.6], [0, 0], [0, 0], [0.13, 0.13], [0.01, 0.05], [0.04, 0.05], [0.01, 0.07], [0, 0], [0.23, 0.35], [0.02, 0.02], [0, 0.03], [0.01, 0.03], [0, 0], [0, 0], [0.38, 0.7], [0.35, 0.52]];

let datasets = [plot2011, plot2014];

let defaultSetIndex = 0;
// let binType = "leader";
let binType = "hexagon";

let animateTime = 20;
/*This is for the tooltip*/
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
/*End tooltip section*/

//<editor-fold desc="section for display options">
let optionsBinLeader = ["origPoints",
    //"bins",
    "triangulations", "mst", "outlyingLinks", "outlyingPoints", "noOutlyingTree", "noOutlyingPoints", "v2Corners", "obtuseV2Corners", "convexHull", "concaveHull", "v1s"];

createControlButtons("controlButtons", optionsBinLeader);
//Display variables
let dataPointRadius = 3;
//TODO: changed these for the paper display only
let pointColor = 'steelblue';
let pointStroke = "none";
let contentBoundBG = "#ddd";
// let pointColor = 'black';
// let pointStroke = "white";
// let contentBoundBG = "#fff";
let dataPointOpacity = 0.9;
let binOpacity = 0.8;
let origPoints = null;
let bins = null;
let triangulations = null;//path
let mst = null;//path
let outlyingLinks = null;//path
let outlyingPoints = null;//circle
let noOutlyingTree = null;//path
let noOutlyingPoints = null;//circle
let runtGraph = null;
let v2Corners = null;//circle
let obtuseV2Corners = null;//path
// let noOutlyingTriangulations = null;//path
let convexHull = null;//path
let concaveHull = null;//path
let v1s = null;//circle

let svgWidth = 350;
let svgHeight = 370;

let scagsvg = d3.select("#scagsvg").attr("width", svgWidth).attr("height", svgHeight),
    normalizedsvg = d3.select("#normalizedsvg").attr("width", svgWidth).attr("height", svgHeight),
    // leaveoutsvg = d3.select("#leaveoutsvg").attr("width", svgWidth).attr("height", svgHeight),
    margins = {left: 20, top: 40, right: 20, bottom: 20},
    padding = 10,
    contentWidth = +scagsvg.attr("width") - margins.left - margins.right - 2 * padding,
    contentHeight = +scagsvg.attr("height") - margins.top - margins.bottom - 2 * padding,
    scaleX = d3.scaleLinear().domain([0, 1]).range([0, contentWidth - 2 * padding]),
    // scaleY = d3.scaleLinear().domain([0, 1]).range([0, contentHeight - 2 * padding]);
    scaleY = d3.scaleLinear().domain([0, 1]).range([contentHeight - 2 * padding, 0]);
//</editor-fold>

document.getElementById("scagnostics").selectedIndex = defaultSetIndex;
changeDataset(document.getElementById("scagnostics")).then(_ => {
    //Toggle some displays
    // toggleDisplay(bins);
    toggleDisplay(triangulations);
    toggleDisplay(obtuseV2Corners);
    toggleDisplay(convexHull);
    toggleDisplay(concaveHull);
});

function predictUsingModel(points, model) {
    let X_test = tf.tensor([rectangularBinner((new Normalizer(points)).normalizedPoints)]);
    X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    let y_predicted = model.predict(X_test);
    return y_predicted.dataSync();
}

function createControlButtons(theContainer, theOptions) {
    let controlButtons = d3.select("#" + theContainer);
    theOptions.forEach(option => {
        controlButtons.append("button")
            .attr("onclick", `toggleDisplay(${option})`)
            .html("Toggle " + option);

    });
}

async function changeDataset(evt) {
    let points = datasets[evt.selectedIndex];
    let options = {
        binType: binType
    }
    let scag = new scagnostics(points, options);
    update(scag);
    //Time for loading the model
    if (!model) {
        model = await loadModel('../data/models/model3/model.json');
    }
    let scores = predictUsingModel(points, model);
    displayModelScores(scores);
}

function update(scag) {
    //Clean
    normalizedsvg.selectAll("*").remove();
    scagsvg.selectAll("*").remove();
    // leaveoutsvg.selectAll("*").remove();

    //Drawing results
    drawTitle(normalizedsvg, "Original scatter plot");
    drawTitle(scagsvg, "Bins on original");
    // drawTitle(leaveoutsvg, "Bins on leave-one-out");
    drawContentBound(normalizedsvg);
    drawContentBound(scagsvg);
    // drawContentBound(leaveoutsvg);

    drawNormalizedData(scag);
    draw(scag);
}

function drawNormalizedDataSvg(scag, theSvg, opacity) {
    //Add outliag scores as 0 for those doesn't have it
    scag.normalizedPoints.forEach(p => {
        if (!p.outliagScore) {
            p.outliagScore = 0;
        }
    });
    let outlierColor = d3.scaleSequential(d3.interpolateLab("#000", "red"))
        .domain(d3.extent(scag.normalizedPoints.map(p => (p.outliagScore > 0 ? p.outliagScore : 0))));
    let inlierColor = d3.scaleSequential(d3.interpolateLab("green", "#000"))
        .domain(d3.extent(scag.normalizedPoints.map(p => (p.outliagScore < 0 ? p.outliagScore : 0))));

    //Main container
    let g = theSvg.append("g").attr("transform", `translate(${margins.left + 2 * padding}, ${margins.top + padding})`);

    g.append("g").selectAll("circle")
        .data(scag.normalizedPoints)
        .enter()
        .append("circle")
        .attr("cx", d => scaleX(d[0]))
        .attr("cy", d => scaleY(d[1]))
        .attr("r", dataPointRadius)
        .attr("fill", pointColor)
        // .attr("fill", d => {
        //     return d.outliagScore < 0 ? inlierColor(d.outliagScore) : outlierColor(d.outliagScore);
        // })
        .attr("stroke", pointStroke)
        .attr("stroke-width", 0.1)
        .attr("opacity", opacity)
        /*This is for the tooltip section*/
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html((d.data ? (d.data.index ? d.data.index : d.data) + ': ' : '') + `[${(d.data ? (d.data.originalPoint ? d.data.originalPoint[0] : d[0]) : d[0]).toFixed(3)}, ${(d.data ? (d.data.originalPoint ? d.data.originalPoint[1] : d[1]) : d[1]).toFixed(3)}]`)
                .style("left", (d3.event.pageX - 10) + "px")
                .style("top", (d3.event.pageY - 52) + "px");
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
    // .on("click", d => {
    //     let outliag = outliagProcessor.allOutliags[d.data.index];
    //     drawLeaveOut(outliag);
    // });
    /*End of tooltip section*/
    return g;
}

function drawNormalizedData(scag) {
    drawNormalizedDataSvg(scag, normalizedsvg, dataPointOpacity);
}

//This method is called in string (creating the button using JS) so though it is displayed as unused => it is used.
function toggleDisplay(g) {
    debugger
    if (g && !g.empty()) {
        if (+d3.select(g.node()).style("opacity") != 10e-6) {
            g.transition().duration(1000).style("opacity", 10e-6).style("display", "none");
        } else {
            animateNodes(g, animateTime, 10e-6, .99);
            g.style("display", "inline");
        }
    }
}

function displayScagScores(scag) {
    d3.select('#scagBinsLengthMsg').html(scag.bins.length);
    d3.select('#outlyingUpperBoundMsg').html(scag.outlyingUpperBound.toFixed(3));
    d3.select('#outlyingScoreMsg').html(scag.outlyingScore.toFixed(3));
    d3.select('#skewedScoreMsg').html(scag.skewedScore.toFixed(3));
    d3.select('#sparseScoreMsg').html(scag.sparseScore.toFixed(3));
    d3.select('#clumpyScoreMsg').html(scag.clumpyScore.toFixed(3));
    d3.select('#striatedScoreMsg').html(scag.striatedScore.toFixed(3));
    d3.select('#convexScoreMsg').html(scag.convexScore.toFixed(3));
    d3.select('#skinnyScoreMsg').html(scag.skinnyScore.toFixed(3));
    d3.select('#stringyScoreMsg').html(scag.stringyScore.toFixed(3));
    d3.select('#monotonicScoreMsg').html(scag.monotonicScore.toFixed(3));
}

function displayModelScores(scores) {
    d3.select('#outlyingScoreMsgModel').html(scores[0].toFixed(3));
    d3.select('#skewedScoreMsgModel').html(scores[1].toFixed(3));
    d3.select('#sparseScoreMsgModel').html(scores[3].toFixed(3));//order of sparse and clumpy are switched in the score array
    d3.select('#clumpyScoreMsgModel').html(scores[2].toFixed(3));
    d3.select('#striatedScoreMsgModel').html(scores[4].toFixed(3));
    d3.select('#convexScoreMsgModel').html(scores[5].toFixed(3));
    d3.select('#skinnyScoreMsgModel').html(scores[6].toFixed(3));
    d3.select('#stringyScoreMsgModel').html(scores[7].toFixed(3));
    d3.select('#monotonicScoreMsgModel').html(scores[8].toFixed(3));
}

function animateNodes(selection, time, fromOpacity, toOpacity, onEnd) {
    recurseDisplay(selection, 0, time, fromOpacity, toOpacity, onEnd);

    function recurseDisplay(selection, i, time, fromOpacity, toOpacity) {
        let nodes = selection.nodes();
        let length = nodes.length;
        if (i < length) {
            d3.select(nodes[i]).style("opacity", fromOpacity).transition().duration(time).style("opacity", toOpacity);
            i = i + 1;
            //recurse
            setTimeout(() => {
                recurseDisplay(selection, i, time, fromOpacity, toOpacity, onEnd);
            }, time);
        } else {
            if (onEnd) {
                onEnd();
            }
        }
    }
}

function drawMst(g, scag) {
    let mstLinks = scag.mst.links.sort((a, b) => a.weight - b.weight);
    let mst = g.append("g").selectAll("path")
        .data(mstLinks)
        .enter()
        .append("line")
        .attr("x1", d => scaleX(d.source[0]))
        .attr("y1", d => scaleY(d.source[1]))
        .attr("x2", d => scaleX(d.target[0]))
        .attr("y2", d => scaleY(d.target[1]))
        .attr("stroke", "green")
        .attr("stroke-width", 1)
        .attr("opacity", 10e-6)
        .style("display", "none");
    return mst;
}

function drawOutlyingLinks(g, scag) {
    return g.append("g").selectAll("path")
        .data(scag.outlyingLinks)
        .enter()
        .append("line")
        .attr("x1", d => scaleX(d.source[0]))
        .attr("y1", d => scaleY(d.source[1]))
        .attr("x2", d => scaleX(d.target[0]))
        .attr("y2", d => scaleY(d.target[1]))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("opacity", 10e-6)
        .style("display", "none");
}

function drawOutlyingPoints(g, scag) {
    return g.append("g").selectAll("circle")
        .data(scag.outlyingPoints)
        .enter()
        .append("circle")
        .attr("cx", d => scaleX(d[0]))
        .attr("cy", d => scaleY(d[1]))
        .attr("r", dataPointRadius)
        .attr("fill", "black")
        .attr("stroke-width", 2)
        .attr("stroke", "red")
        .attr("opacity", 10e-6)
        .style("display", "none");
}

function drawNoOutlyingPoints(g, scag) {
    return g.append("g").selectAll("circle")
        .data(scag.noOutlyingTree.nodes.map(n => n.id))
        .enter()
        .append("circle")
        .attr("cx", d => scaleX(d[0]))
        .attr("cy", d => scaleY(d[1]))
        .attr("r", 3)
        .attr("fill", "black")
        .attr("fill-opacity", dataPointOpacity)
        .attr("stroke", "none")
        .attr("opacity", 10e-6)
        .style("display", "none");
}

function drawScores(g, scag) {
    return g.append("g").selectAll("text")
        .data([{type: 'Outlying score', score: scag.outlyingScore}])
        .enter()
        .append("text")
        .text(d => d.type + ": " + d.score.toFixed(3))
        .attr("x", 10)
        .attr("y", 10);
}

function draw(scag) {
    //Main container
    let g = scagsvg.append("g").attr("transform", `translate(${margins.left + 2 * padding}, ${margins.top + padding})`);
    //Original points
    origPoints = drawNormalizedDataSvg(scag, scagsvg, 0.9);
    // drawScores(g, scag);
    var color = d3.scaleSequential(d3.interpolateLab("#EEEEEE", "#000"))
        .domain(d3.extent(scag.bins.map(b => b.length)));

    if (scag.binner) {
        if (binType === "hexagon") {
            bins = g.append("g")
                .attr("class", "hexagon")
                .selectAll("path")
                .data(scag.bins)
                .enter().append("path")
                .attr("d", scag.binner.hexagon(scaleX(scag.binRadius)))
                .attr("transform", function (d) {
                    return "translate(" + scaleX(d.x) + "," + scaleY(d.y) + ")";
                })
                .attr("fill-opacity", 1)
                .attr("fill", d => color(d.length));
        } else {
            //sort the scag bins by x first then by y
            let scagBins = scag.bins.sort((a, b) => (a.x - b.x != 0) ? a.x - b.x : a.y - b.y);
            bins = g.append("g")
                .attr("class", "leader")
                .selectAll("circle")
                .data(scagBins)
                .enter().append("circle")
                // .attr("r", scaleX(scag.binRadius))
                .attr("r", d => {
                    let distances = d.map(p => distance([d.x, d.y], p));
                    let radius = d3.max(distances);
                    return radius === 0 ? dataPointRadius : scaleX(radius);
                })
                .attr("cx", d => scaleX(d.x))
                .attr("cy", d => scaleY(d.y))
                .attr("fill", d => color(d.length))
                // .attr("fill", "none")
                .attr("stroke", "black")
                .attr("opacity", binOpacity)
                .attr("display", "none")
                .attr("stroke-width", 0.5);

            function distance(a, b) {
                let dx = a[0] - b[0],
                    dy = a[1] - b[1];
                //For computer storage issue, some coordinates of the same distance may return different distances if we use long floating point
                //So take only 10 digits after the floating points=> this is precise enough and still have the same values for two different lines of the same distance
                return Math.round(Math.sqrt((dx * dx) + (dy * dy)) * Math.pow(10, 10)) / Math.pow(10, 10);
            }
        }
    }
    //Triangulating
    triangulations = g.append("g")
        .attr("class", "triangles")
        .selectAll("path")
        .data(scag.triangleCoordinates)
        .enter()
        .append("path")
        .attr("opacity", 10e-6)
        .style("display", "none")
        .call(drawTriangle);

    function drawTriangle(triangle) {
        triangle.attr("d", d => "M" + d.map(p => [scaleX(p[0]), scaleY(p[1])]).join("L") + "Z");
    }

    //Minimum spanning tree.
    mst = drawMst(g, scag);

    //Minimum spanning tree.
    //Outlying links
    outlyingLinks = drawOutlyingLinks(g, scag);
    //Outlying points
    outlyingPoints = drawOutlyingPoints(g, scag);
    //No outlying tree
    noOutlyingTree = g.append("g").selectAll("path")
        .data(scag.noOutlyingTree.links)
        .enter()
        .append("line")
        .attr("x1", d => scaleX(d.source[0]))
        .attr("y1", d => scaleY(d.source[1]))
        .attr("x2", d => scaleX(d.target[0]))
        .attr("y2", d => scaleY(d.target[1]))
        .attr("stroke", "green")
        .attr("stroke-width", 1).on("click", l => {
            if (runtGraph) runtGraph.remove();
            let rg = scag.clumpy.runtGraph(l);
            runtGraph = g.append("g").selectAll("path")
                .data(rg)
                .enter()
                .append("line")
                .attr("x1", d => scaleX(d.source[0]))
                .attr("y1", d => scaleY(d.source[1]))
                .attr("x2", d => scaleX(d.target[0]))
                .attr("y2", d => scaleY(d.target[1]))
                .attr("stroke", "red")
                .attr("stroke-width", 2);
        })
        .attr("opacity", 10e-6)
        .style("display", "none");
    noOutlyingPoints = drawNoOutlyingPoints(g, scag);
    //Striated
    //ObtuseV2Corners
    obtuseV2Corners = g.append("g").selectAll("path")
        .data(scag.obtuseV2Corners)
        .enter()
        .append("path")
        .attr("d", d => {
            //Clone the data to avoid changing it
            let d1 = d.splice(0);
            //swap since we need to start drawing from the point which is not the vertex of the corner (first point).
            let temp = d1[0];
            d1[0] = d1[1];
            d1[1] = temp;
            d1 = d1.map(d => [scaleX(d[0]), scaleY(d[1])]);
            return "M" + d1.join("L");
        })
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("opacity", 10e-6)
        .style("display", "none");

    //V2 corners
    v2Corners = g.append("g").selectAll("circle")
        .data(scag.v2Corners)
        .enter()
        .append("circle")
        .attr("cx", d => scaleX(d[0][0]))
        .attr("cy", d => scaleY(d[0][1]))
        .attr("r", 4)
        .attr("stroke", "none")
        .attr("fill", "blue")
        .attr("opacity", 10e-6)
        .style("display", "none");


    // //Triangulating
    // noOutlyingTriangulations = g.append("g")
    //     .attr("class", "triangles")
    //     .selectAll("path")
    //     .data(scag.noOutlyingTriangleCoordinates)
    //     .enter()
    //     .append("path")
    //     .call(drawTriangle)
    //     .attr("opacity", 10e-6)
    //     .style("display", "none");

    //Convex hull
    convexHull = g.append("g").selectAll("path")
        .data([scag.convexHull.map(d => [scaleX(d[0]), scaleY(d[1])])])
        .enter()
        .append("path")
        .attr("d", d => "M" + d.join("L") + "Z")
        .attr("stroke-width", 3)
        .attr("stroke", "#f0f")
        .attr("fill", "none")
        .attr("opacity", 10e-6)
        .style("display", "none");

    //Concave hull
    concaveHull = g.append("g")
        .selectAll("path")
        .data(scag.concaveHull)
        .enter()
        .append("path")
        .attr("d", d => "M" + d.map(p => [scaleX(p[0]), scaleY(p[1])]).join("L") + "Z")
        .attr("stroke-width", 2)
        .attr("stroke", "yellow")
        .attr("fill", "yellow")
        .attr("fill-opacity", 0.5)
        .attr("opacity", 10e-6)
        .style("display", "none");

    //Stringy => single degree vertices
    v1s = g.append("g")
        .selectAll("circle")
        .data(scag.v1s)
        .enter()
        .append("circle")
        .attr("cx", d => scaleX(d[0]))
        .attr("cy", d => scaleY(d[1]))
        .attr("r", 4)
        .attr("stroke", "none")
        .attr("fill", "orange")
        .attr("opacity", 10e-6)
        .style("display", "none");
    //Scagnostics messages
    displayScagScores(scag);
}

function drawLeaveOut(outliag) {
    leaveoutsvg.selectAll("*").remove();
    drawTitle(leaveoutsvg);
    drawAxis(leaveoutsvg, ["one", "two"]);
    drawContentBound(leaveoutsvg);
    //Main container
    let g = leaveoutsvg.append("g").attr("class", "leaveoutg").attr("transform", `translate(${margins.left + padding}, ${margins.top + padding})`);
    if (!outliag) {
        g.append("text").text("Skipped this calculation, please see the MST on the left").attr("x", 10).attr("y", 10);
    } else {
        let mst = drawMst(g, outliag);
        let outlyingLinks = drawOutlyingLinks(g, outliag);
        let outlyingPoints = drawOutlyingPoints(g, outliag);
        let noOutlyingPoints = drawNoOutlyingPoints(g, outliag);
        drawScores(g, outliag);
        mst.style("display", "inline");
        outlyingLinks.style("display", "inline");
        outlyingPoints.style("display", "inline");
        noOutlyingPoints.style("display", "inline");

        animateNodes(mst, animateTime, 10e-6, .8, () => {
            animateNodes(outlyingLinks, animateTime, 10e-6, .8, () => {
                animateNodes(outlyingPoints, animateTime, 10e-6, .8, () => {
                    animateNodes(noOutlyingPoints, animateTime, 10e-6, .8);
                });
            });
        });
    }
}

function drawAxis(svg, variables) {
    let v1 = variables[0];
    let v2 = variables[1];
    let x1 = +svg.attr("width") / 2;
    let y1 = +svg.attr("height") - margins.bottom / 2;
    let x2 = margins.left / 2;
    let y2 = svgHeight / 2;
    svg.append("text").text(v1).attr("font-style", "italic").attr("alignment-baseline", "middle").attr("text-anchor", "middle").attr("transform", `translate(${x1}, ${y1}) rotate(0)`);
    svg.append("text").text(v2).attr("font-style", "italic").attr("alignment-baseline", "middle").attr("text-anchor", "middle").attr("transform", `translate(${x2}, ${y2}) rotate(-90)`);
}

function drawTitle(svg, title) {
    let x = +svg.attr("width") / 2;
    let y = margins.top / 2;
    svg.append('text').text(title).attr("font-weight", "bold").attr("alignment-baseline", "middle").attr("text-anchor", "middle").attr("transform", `translate(${x}, ${y}) rotate(0)`);
}

function drawContentBound(svg) {
    let x = margins.left;
    let y = margins.top;
    let rectWidth = +svg.attr("width") - margins.left - margins.right;
    let rectHeight = +svg.attr("height") - margins.top - margins.bottom;
    svg.append("rect").attr("x", x).attr("y", y).attr("width", rectWidth).attr("height", rectHeight).attr("stroke", "black").attr("stroke-width", 1).attr("fill", contentBoundBG);
}
