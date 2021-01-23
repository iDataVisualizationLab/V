async function loadData(workTimeSteps, processData, normalize = true) {
    const fileName = 'data/employment.json';
    d3.json(fileName).then((data) => {
        //Work for a few time steps.
        const copiedData = [];
        for (let i = 0; i < workTimeSteps; i++) {
            copiedData[i] = data[i];
        }
        const numMachines = copiedData[0].length;
        const numVars = copiedData[0][0].length;
        // Build the scalers for the data, note that we need to scale for the whole set of data
        // otherwise, same value in different time steps would be scaled to different values
        // e.g., both steps with 58F but due to different scalers two steps may have different values
        let varScalers = [];
        if (normalize) {
            for (let varIdx = 0; varIdx < numVars; varIdx++) {
                let valueExtent = d3.extent(copiedData.flat().map(machine => machine[varIdx]));
                let minMaxScaler = d3.scaleLinear().domain(valueExtent).range([0, 1]);
                varScalers.push(minMaxScaler);
            }
            for (let timeStep = 0; timeStep < copiedData.length; timeStep++) {
                for (let varIdx = 0; varIdx < numVars; varIdx++) {
                    const minMaxScaler = varScalers[varIdx];
                    for (let machineIdx = 0; machineIdx < numMachines; machineIdx++) {
                        copiedData[timeStep][machineIdx][varIdx] = minMaxScaler(copiedData[timeStep][machineIdx][varIdx]);
                    }
                }
            }
        }
        let results = {
            'varScalers': varScalers,
            'data': copiedData
        }
        processData(results);
    });
}
