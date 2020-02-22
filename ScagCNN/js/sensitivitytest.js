async function testsensitivity() {
    let selectedModelPath = 'data/models/model3/model.json';
    let realworldData = await d3.json("data/RealWorldData.json");

    //From these datasets, the last two are HPCC and are combined into one from this paper.
    //Note also that in the Scagnostics timing paper we only use the HPCC_Oct for the time average calculation, but it should work fine averagely.
    let datasetNameMapping = ['WUER', 'WBLE', 'WBHIV', 'NYSE', 'WBID', 'WTRSM', 'USUER', 'USENC', 'HPCC'];
    //We get the rectangular binning.
    let datasets = {};
    datasetNameMapping.forEach((name, idx) => {
        datasets[name] = realworldData[idx].map(d => d.data);
    });
    //Append the last one as HPCC too.
    datasets['HPCC'] = datasets['HPCC'].concat(realworldData[9].map(d => d.data));

    //HIV 2011 =>idx=21, 2014 idx=24
    let plot2011 = datasets['WBHIV'][21];
    let outlying2011 = predictUsingScag(plot2011);
    document.getElementById("scagnosticsYear2011").innerText = outlying2011.toFixed(3);

    let plot2014 = datasets['WBHIV'][24];
    let outlying2014 = predictUsingScag(plot2014);
    document.getElementById("scagnosticsYear2014").innerText = outlying2014.toFixed(3);


    //Time for loading the model
    model = await loadModel(selectedModelPath);

    let modelOutlying2011 = predictUsingModel(plot2011, model);
    document.getElementById("mlYear2011").innerText = modelOutlying2011.toFixed(3);


    let modelOutlying2014 = predictUsingModel(plot2014, model);
    document.getElementById("mlYear2014").innerText = modelOutlying2014.toFixed(3);

}

function predictUsingModel(points, model) {
    let X_test = tf.tensor([rectangularBinner((new Normalizer(points)).normalizedPoints)]);
    X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    let y_predicted = model.predict(X_test);
    return y_predicted.dataSync()[0];
}

function predictUsingScag(points) {
    let scag = new scagnostics(points, {binType: 'hexagon'});
    let outlying = scag.outlyingScore;
    return outlying;
}

testsensitivity();