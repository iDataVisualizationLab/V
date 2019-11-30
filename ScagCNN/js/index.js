async function main() {
    // let selectedModelPath = 'data/models/model1/model.json';

    let selectedModelPath = 'data/models/model2/model.json';
    model = await loadModel(selectedModelPath);

    // let testdata = await d3.json("data/RealWorldData.json");
    // XArr = testdata.flat().map(d => d.rectangularBins);
    // yArr = testdata.flat().map(d => d.scagnostics);
    XArr = await d3.json("data/X_test.json");
    yArr = await d3.json("data/y_test.json");

    let X_test = tf.tensor(XArr);
    X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    let y_test = tf.tensor(yArr);
    let y_predicted = model.predict(X_test);
    debugger
    let arrPredicted = y_predicted.transpose().arraySync();//Transposed so that they are going to have a row for a type of data.
    let arrActual = y_test.transpose().arraySync();
    drawEvaluations(arrActual, arrPredicted);
}

main();
