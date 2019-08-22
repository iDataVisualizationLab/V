async function tensor2DToArray2DAsync(ts) {
    return new Promise((resolve, reject) => {
        let noOfItems = ts.shape[0];
        let noOfFeatures = ts.shape[1];
        let itemSize = noOfFeatures;
        let result = [];
        let data = ts.dataSync();
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            let theItemIdx = itemIdx * itemSize;
            let item = data.slice(theItemIdx, theItemIdx + noOfFeatures);
            result.push(item);
        }
        resolve(result);
    });
}
async function tensor3DToArray3DAsync(ts) {
    return new Promise((resolve, reject) => {
        let noOfItems = ts.shape[0];
        let noOfSteps = ts.shape[1];
        let noOfFeatures = ts.shape[2];
        let itemSize = noOfSteps * noOfFeatures;
        let result = [];
        let data = ts.dataSync();
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            let item = [];
            for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
                let theStepIdx = itemIdx * itemSize + stepIdx * noOfFeatures;
                let step = data.slice(theStepIdx, theStepIdx + noOfFeatures);
                item.push(step);
            }
            result.push(item);
        }
        resolve(result);
    });
}