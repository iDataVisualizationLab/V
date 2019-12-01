async function main() {
    // let selectedModelPath = 'data/models/model1/model.json';
    let selectedModelPath = 'data/models/model2/model.json';
    model = await loadModel(selectedModelPath);
    XArr = await d3.json("data/X_test.json");
    yArr = await d3.json("data/y_test.json");

    let X_test = tf.tensor(XArr);
    X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    let y_test = tf.tensor(yArr);
    let y_predicted = model.predict(X_test);

    let arrPredicted = y_predicted.transpose().arraySync();//Keep the original order
    let arrActual = y_test.transpose().arraySync();//Keep the original order
    //Create divs for the scores.
    d3.select("#scores").selectAll(".scoreDiv").data(typeList, d => d).join("div").attr("id", d => "scoreDiv" + d).classed("scoreDiv", true)
        .attr("id", type => `scoreDiv${type}`)
        .style("overflow", "hidden")
        .style("display", "inline").style("white-space", "nowrap");
    drawEvaluations(arrActual, arrPredicted).then(() => {
        findTop10DifferencesEachType(arrActual, arrPredicted).then((top10DifferencesEachType) => {
            drawTop10DifferencesEachType(top10DifferencesEachType);
        });
    });
}

main();
