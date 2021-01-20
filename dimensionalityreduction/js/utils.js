async function loadData(workTimeSteps, processData, normalize = true) {
    const fileName = 'data/influxdbThus21Mar_1400_1630.json';
    d3.json(fileName).then((data) => {
        const timeSteps = data['timespan'].length;
        delete data['timespan'];
        const numMachines = Object.keys(data).length;
        const variableGroups = ['arrCPU_load', 'arrFans_health', 'arrMemory_usage', 'arrPower_usage', 'arrTemperature'];
        const numVars = 10;
        const timedData = Array(timeSteps);
        for (let timeStep = 0; timeStep < timeSteps; timeStep++) {
            timedData[timeStep] = Array(timeSteps);
            for (let machineIdx = 0; machineIdx < numMachines; machineIdx++) {
                timedData[timeStep][machineIdx] = Array(numVars);
                for (let varIdx = 0; varIdx < numVars; varIdx++) {
                    //Initialize data to null
                    timedData[timeStep][machineIdx][varIdx] = null;
                }
            }
        }

        //Loop through data objects and take the appropriate value.
        Object.keys(data).forEach((machine, machineIdx) => {
            //Machine data
            const machineData = data[machine];
            let varGroupStartIdx = 0;
            variableGroups.forEach(varGroup => {
                const varData = machineData[varGroup];
                const numVarsInGroup = varData[0].length;
                varData.forEach((rowData, timeStep) => {
                    rowData.forEach((varValue, idx) => {
                        timedData[timeStep][machineIdx][varGroupStartIdx + idx] = varValue;
                    })
                });
                varGroupStartIdx += numVarsInGroup;
            });
        });
        //Work for a few time steps.
        const copiedData = [];
        for (let i = 0; i < workTimeSteps; i++) {
            copiedData[i] = timedData[i];
        }
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
