async function testruntime() {
    //Data processing
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

    let wholeBatch = [];
    datasetNameMapping.forEach(name => {
        let data = datasets[name];
        wholeBatch = wholeBatch.concat(data);
    });

    //Start the time testing.
    let startTime;
    let endTime;

    let scagnosticsTime = [];
    realworldData.forEach(data => {
        data.forEach(dt => {
            let plot = dt.data;
            startTime = new Date().getTime();
            let scag = new scagnostics(plot, {binType: 'hexagon'});
            let outlying = scag.outlyingScore;
            endTime = new Date().getTime();
            scagnosticsTime.push(endTime - startTime);
        });
    });



    document.getElementById("totalNumberOfPlots").innerText = wholeBatch.length;
    document.getElementById("averageScagnosticsTimePerPlot").innerText = ss.mean(scagnosticsTime).toFixed(3);
    document.getElementById("scagnosticsTimePerPlotStandardDeviation").innerText = ss.standardDeviation(scagnosticsTime).toFixed(3);


    //Time for loading the model
    let loadModelTime = [];
    for (let i = 0; i < 31; i++) {
        startTime = new Date().getTime();
        model = await loadModel(selectedModelPath);
        endTime = new Date().getTime();
        loadModelTime.push(endTime - startTime);
    }
    document.getElementById("modelLoadingTime").innerText = ss.mean(loadModelTime).toFixed(3);

    //Do one for the first call to initialize the model (get compiled is very slow => https://github.com/tensorflow/tfjs/tree/master/tfjs-converter)
    //So we just get one random dataset and do it for the first time.
    let initialCallTime = [];
    let plot = datasets[datasetNameMapping[0]][0];

    for (let i = 0; i < 31; i++) {
        startTime = new Date().getTime();
        //Normalize
        let normalizedPoints = (new Normalizer(plot)).normalizedPoints;
        //Binning
        let binnedData = [rectangularBinner(normalizedPoints)];

        let X_test = tf.tensor(binnedData);
        X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
        let y_predicted = model.predict(X_test);
        endTime = new Date().getTime();
        initialCallTime.push(endTime - startTime);
    }
    document.getElementById("averageInitialPrediction").innerText = ss.mean(initialCallTime).toFixed(3);


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
            //Do the binning here
            let binnedPlot = [rectangularBinner(new Normalizer(plot).normalizedPoints)];
            startTime = new Date().getTime();
            let X_test = tf.tensor(binnedPlot);
            X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
            let y_predicted = model.predict(X_test);
            endTime = new Date().getTime();
            timePerDataSetPerPlot[name].push(endTime - startTime);
            perPlotTime.push(endTime - startTime);
        });
    });
    document.getElementById("averageModelTimePerPlot").innerText = ss.mean(perPlotTime).toFixed(3);
    document.getElementById("modelTimePerPlotStandardDeviation").innerText = ss.standardDeviation(perPlotTime).toFixed(3);


    // let wholeBatchTime = [];
    // for (let i = 0; i < 31; i++) {
    //     startTime = new Date().getTime();
    //     let X_test = tf.tensor(wholeBatch.map(d => rectangularBinner(d)));
    //     X_test = X_test.reshape([X_test.shape[0], X_test.shape[1], X_test.shape[2], 1]);
    //     let y_predicted = model.predict(X_test);
    //     //To be fair we also add a time to get back the results in form of array.
    //     y_predicted = y_predicted.dataSync();
    //     endTime = new Date().getTime();
    //     wholeBatchTime.push((endTime - startTime) / (wholeBatch.length));
    // }
    // console.log(`Whole batch mean time ${ss.mean(wholeBatchTime)}`);
    // console.log(`Whole batch time standard deviation ${ss.standardDeviation(wholeBatchTime)}`);


}

testruntime();