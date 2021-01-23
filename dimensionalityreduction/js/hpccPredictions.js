loadData(12, processPredictions);

function mse(y_true, y_pred) {
    return d3.mean(y_true.map((yVal, i) => (yVal - y_pred[i]) * (yVal - y_pred[i])));
}

function processPredictions(processedData) {
    const startTime = new Date().getTime();
    let predCount = 0;
    const timedData = processedData.data;
    const varScalers = processedData.varScalers;
    //Try to predict the first temperature variable.
    const workTimeSteps = timedData.length;
    const numMachines = timedData[0].length;
    const predictIdx = 7;
    const minMaxScaler = varScalers[predictIdx];
    let y_true = [];
    let y_pred = [];
    for (let timeStep = 1; timeStep < workTimeSteps; timeStep++) {
        for (let machineIdx = 0; machineIdx < numMachines; machineIdx++) {
            y_true.push(minMaxScaler.invert(timedData[timeStep][machineIdx][predictIdx]));
            y_pred.push(minMaxScaler.invert(timedData[timeStep - 1][machineIdx][predictIdx]));
        }
    }
    let baselineMsg = `MSE for the baseline ${mse(y_true, y_pred)}`;

    //Prepare data for predictions
    //Create the data with missing feature
    let missingFeatureData = timedData.map(machineData => machineData.map(featureData => {
        let row = [];
        featureData.forEach((val, i) => {
            if (i !== predictIdx) row.push(val);
        });
        return row;
    }));
    y_true = [];
    y_pred = [];
    let predictingMachineIdxs = [0];
    for (let timeStep = 0; timeStep < workTimeSteps; timeStep++) {
        for (let mIdx = 0; mIdx < predictingMachineIdxs.length; mIdx++) {
            let machineIdx = predictingMachineIdxs[mIdx];
            let DData = [];
            //True value
            y_true.push(minMaxScaler.invert(timedData[timeStep][machineIdx][predictIdx]));
            timedData[timeStep].forEach((machineData, i) => {
                if (i !== machineIdx) {
                    DData.push(machineData);
                }
            });
            //Now we will do l PCA for all the points in this time step
            const lData = missingFeatureData[timeStep];
            //Do D-dim projection
            const DDimPCA = new dr.PCA(DData);
            const lDimPCA = new dr.PCA(lData);
            const DProjection = dr.projectToPCs(DDimPCA, DData, 3);
            const lProjection = dr.projectToPCs(lDimPCA, lData, 3);
            //Calculate the Su.
            //Distance of the predicting machine to other machines
            const Su = [];
            let x = [...lProjection[machineIdx]];//Set the default x to be the l projected.;
            lProjection.forEach((projectedData, mIdx) => {
                if (machineIdx !== mIdx) {
                    Su.push(distance(projectedData, lProjection[machineIdx]));
                }
            });
            let alpha = 1.0;
            let lr = 0.001;
            let iterations = 2000;
            const {
                alphaOptimized,
                xOptimized,
                losses
            } = dr.projectionOptimizer(Su, x, alpha, DProjection, lr, iterations);
            //Invert it back to original D space using DDimPCA
            const predictedDData = dr.invertToOriginalSpace(DDimPCA, [xOptimized]);
            console.log(alphaOptimized);
            console.log(losses[losses.length - 1]);
            y_pred.push(minMaxScaler.invert(predictedDData[0][predictIdx]));
            predCount += 1;
        }
    }
    const totalTime = new Date().getTime() - startTime;
    let timeMsg = `<br/> Total preds ${predCount}, total time ${totalTime / 1000}s, time per pred ${totalTime / (1000 * predCount)}s`
    let MSEMsg = `<br/>PCA Projection Optimizer ${mse(y_true, y_pred)}`;
    document.getElementById('msg').innerHTML = baselineMsg + MSEMsg + timeMsg;
}

function distance(x, y) {
    return Math.sqrt(d3.sum(x.map((xVal, i) => (xVal - y[i]) * (xVal - y[i]))));
}
