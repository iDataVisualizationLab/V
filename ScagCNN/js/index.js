async function main() {
    // let selectedModelPath = 'data/models/model2/model.json';
    // XArr = await d3.json("data/X_test.json");
    // yArr = await d3.json("data/y_test.json");

    let selectedModelPath = 'data/models/model3/model.json';
    XArr = await d3.json("data/X_test3.json");
    yArr = await d3.json("data/y_test3.json");

    model = await loadModel(selectedModelPath);
    let X_test = tf.tensor(XArr);
    X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    let y_test = tf.tensor(yArr);
    let y_predicted = model.predict(X_test);

    let arrPredicted = y_predicted.transpose().arraySync();//Keep the original order
    let arrActual = y_test.transpose().arraySync();//Keep the original order

    //Set the size for the menu bar
    d3.select("#menu")
        .style("width", `${predictionChartWidth}px`)
        .style("height", `${imageSize}px`)
        .style("padding-left", `${lineChartPaddings.paddingLeft}px`);

    //Create divs for the scores.
    let scoreDiv = d3.select("#scores");
    scoreDiv.style("width", `${predictionChartWidth + 10 * (imageMargins.left + imageSize) + 20}px`);
    scoreDiv.selectAll(".scoreDiv").data(typeList, d => d).join("div").attr("id", d => "scoreDiv" + d).classed("scoreDiv", true).classed("row", true)
        .attr("id", type => `scoreDiv${type}`);
    drawEvaluations(arrActual, arrPredicted).then(() => {
        findTop10DifferencesEachType(arrActual, arrPredicted).then((top10DifferencesEachType) => {
            drawTop10DifferencesEachType(top10DifferencesEachType);
        });
        findTop10Differences(arrActual, arrPredicted).then((top10differences) => {
            drawTop10Differences(top10differences);
        });
    });
}

main().then(_ => {
    hideLoader();
});

