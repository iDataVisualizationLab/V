const binType = "leader";
const startBinGridSize = 20;//TODO: consider this too.
generateDataFromDS();
// generateDataFromTypicalSets();
//Next method is used to generate data from typical dataexploration data.
function generateDataFromTypicalSets() {
    let typeList = [
        outlyingScatterPlot,
        skewedScatterPlot,
        clumpyScatterPlot,
        sparsedScatterPlot,
        striatedScatterPlot,
        convexScatterPlot,
        skinnyScatterPlot,
        stringyScatterPlot,
        monotonicScatterPlot,
        // xLineScatterPlot,
        // yLineScatterPlot
    ];
    Promise.all(typeList.map(typeFunction => {
        return generateDataFromType(typeFunction, 100);
    })).then(function (values) {
        download(JSON.stringify(values), "ScagnosticsTypicalData.json", "text/plain");
        console.log(values);
    });
}

async function generateDataFromType(typeFunction, size) {
    let scagData = [];
    for (let i = 0; i < size; i++) {
        let points = typeFunction();
        let scagResult = generateScagData(points, typeFunction.name);
        if (scagResult !== null) {
            scagData.push(scagResult);
        }
    }
    console.log(typeFunction.name + ": " + scagData.length);
    return scagData;
}

//Next two methods are used to generate data from files.
function generateDataFromDS() {
    var fileList = [
        "UnemploymentRate",//Look at the data again
        "LifeExpectancy263",
        "PrevalenceOfHIV",//Look at the data again
        "NYSEPriceVsVolume",
        "InternationalDebtData",
        "WorldTerrorism",
        "USUnEmpRateMenVsWomen",
        "USEmpRGoodVsService",
        "HPCCTempVsFan",
        "HPCC_04Oct",
    ];
    Promise.all(fileList.map(fileName => {
        return generateDataFromFile('data/' + fileName + '.json');
    })).then(function (values) {
        download(JSON.stringify(values), "RealWorldData.json", "text/plain");
        // console.log(values);
    });
}

//Generate data.
function generateScagData(points, dataSource) {
    try {
        let options = {
            binType: binType,
            startBinGridSize: startBinGridSize,
            minBins: 4
        }
        let scag = new scagnostics(points, options);

        let scagnosticScores = ["outlyingScore", "skewedScore", "clumpyScore", "sparseScore", "striatedScore", "convexScore", "skinnyScore", "stringyScore", "monotonicScore"];
        //Also do the rectangular binary binning
        let bins = rectangularBinner(scag.normalizedPoints);
        let scagResult = {
            dataSource: dataSource,
            data: points,
            scagnostics: scagnosticScores.map(score => scag[score]),
            rectangularBins: bins
        }
        return scagResult;
    } catch (e) {
        return null;
    }
}