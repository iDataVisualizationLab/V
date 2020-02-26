importScripts('./constants.js');
onmessage = function(e){
    let timeSteps = e.data.timeSteps;
    let part = e.data.part;
    let results = [];
    part.forEach(machineTimeSeries=>{
        let result = timeSteps.map((step)=>{
            let theStep = machineTimeSeries.find(d=>d[FIELD_TIME_STAMP]===step);
            if(!theStep){
                theStep = Object.assign({}, machineTimeSeries[0]);
                theStep[FIELD_TIME_STAMP] = step;
                VARIABLES.forEach(theVar=>{
                    theStep[theVar] = NULL_VALUE;
                });
            }
            //Convert undefined to null
            VARIABLES.forEach(theVar =>{
                if(theStep[theVar] === undefined){
                    theStep[theVar] = NULL_VALUE;
                }
            });
            return theStep;
        });
        results.push(result);
    });
    postMessage(results);
}