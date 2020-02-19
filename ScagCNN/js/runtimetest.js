async function testruntime() {
    let selectedModelPath = 'data/models/model3/model.json';
    let realworldData = await d3.json("data/RealWorldData.json");
    //From these datasets, the last two are HPCC and are combined into one from this paper.
    //Note also that in the Scagnostics timing paper we only use the HPCC_Oct for the time average calculation, but it should work fine averagely.
    let datasetNameMapping = ['WUER', 'WBLE', 'WBHIV', 'NYSE', 'WBID', 'WTRSM', 'USUER', 'USENC', 'HPCC'];
    //We get the rectangular binning.
    let datasets = {};
    datasetNameMapping.forEach((name, idx) => {
        datasets[name] = realworldData[idx].map(d => d.rectangularBins);
    });
    //Append the last one as HPCC too.
    datasets['HPCC'] = datasets['HPCC'].concat(realworldData[9].map(d => d.rectangularBins));

    //Time for loading the model
    let startTime;
    let endTime;
    let loadModelTime = [];
    for (let i = 0; i < 31; i++) {
        startTime = new Date().getTime();
        model = await loadModel(selectedModelPath);
        endTime = new Date().getTime();
        loadModelTime.push(endTime - startTime);
    }
    console.log(`Average model time ${d3.mean(loadModelTime)} ms`);

    //Do one for the first call to initialize the model (get compiled is very slow => https://github.com/tensorflow/tfjs/tree/master/tfjs-converter)
    //So we just get one random dataset and do it for the first time.
    let initialCallTime = [];
    let plot = [datasets[datasetNameMapping[0]][0]];
    for (let i = 0; i < 31; i++) {
        startTime = new Date().getTime();
        let X_test = tf.tensor(plot);
        X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
        let y_predicted = model.predict(X_test);
        endTime = new Date().getTime();
        initialCallTime.push(endTime - startTime);
    }
    console.log(`Time for initial call ${d3.mean(initialCallTime)}`);


    //Now we do the calculation for each of them
    // Per dataset, per plot
    let timePerDataSetPerPlot = {};
    //Initialize
    datasetNameMapping.forEach(name => {
        timePerDataSetPerPlot[name] = [];
    });
    let perPlotTime = [];
    datasetNameMapping.forEach(name => {
        let data = datasets[name];
        data.forEach(plot => {
            plot = [plot];
            startTime = new Date().getTime();
            let X_test = tf.tensor(plot);
            X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
            let y_predicted = model.predict(X_test);
            endTime = new Date().getTime();
            timePerDataSetPerPlot[name].push(endTime - startTime);
            perPlotTime.push(endTime - startTime);
        });
    });
    console.log(perPlotTime);
    console.log(`Time per plot ${d3.mean(perPlotTime)}`);

    //
    let predictionTimeForTheWholeBatch = [];
    let wholeBatch = [];
    datasetNameMapping.forEach(name => {
        let data = datasets[name];
        wholeBatch = wholeBatch.concat(data);
    });
    let wholeBatchTime = [];
    for (let i = 0; i < 31; i++) {
        startTime = new Date().getTime();
        let X_test = tf.tensor(wholeBatch);
        X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
        let y_predicted = model.predict(X_test);
        endTime = new Date().getTime();
        wholeBatchTime.push(endTime - startTime);
    }
    console.log(`Whole batch time ${d3.mean(wholeBatchTime) / wholeBatch.length}`);

}

testruntime();