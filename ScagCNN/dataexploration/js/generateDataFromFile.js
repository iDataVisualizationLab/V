async function generateDataFromFile(fileName) {
    let result = await d3.json(fileName).then(data => {
        let origCounter = 0;
        let augmentedCounter = 0;
        let scagData = [];
        for (let y = 0; y < data.YearsData.length; y++) {
            let yearData = data.YearsData[y];
            yearData = data.YearsData[y];
            let points = yearData.s0.map((s0, i) => {
                return [s0, yearData.s1[i]];
            });
            //Filter out NaN
            points = points.filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            //We augment the data with noise
            let noise = d3.randomNormal(0, 1.0 / 40.0); //40 is the number of grid size
            for (let i = 0; i < 10; i++) {
                let newPoints = points.map(p => {
                    let p0 = p[0] + noise();
                    let p1 = p[1] + noise();
                    //Make sure that p0 and p1 are still in the bound
                    p0 = (p0 < 0) ? 0 : p0;
                    p0 = (p0 > 1) ? 1 : p0;
                    p1 = (p1 < 0) ? 0 : p1;
                    p1 = (p1 > 1) ? 1 : p1;
                    return [p0, p1];
                });
                let scagResult = generateScagData(newPoints, fileName);
                if (scagResult !== null) {
                    scagData.push(scagResult);
                    augmentedCounter += 1;
                }
            }
            //Also add the original scatter plot of course
            let scagResult = generateScagData(points, fileName);
            if (scagResult !== null) {
                scagData.push(scagResult);
                origCounter += 1;
            }
        }
        console.log(fileName + ": " + scagData.length + " scags, " + data.YearsData.length + ", orig: " + origCounter + ", augmented: " + augmentedCounter);
        return scagData;
    });
    return result;
}