async function generateDataFromFile(fileName) {
    let result = await d3.json(fileName).then(data => {
        let scagData = [];
        for (let y = 0; y < data.YearsData.length; y++) {
            let yearData = data.YearsData[y];
            yearData = data.YearsData[y];
            let points = yearData.s0.map((s0, i) => {
                return [s0, yearData.s1[i]];
            });
            //Filter out NaN
            points = points.filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            let scagResult = generateScagData(points, fileName);
            if (scagResult !== null) {
                scagData.push(scagResult);
            }
        }
        console.log(fileName + ": " + scagData.length);
        return scagData;
    });
    return result;
}