class OutliagNDProcessor {
    constructor(dataS) {
        this.dataS = dataS;
        this.allYearsBins = [];
        this.allYearUpperBounds = [];
        this.counter = 0;
        this.scagOptions = {
            startBinGridSize: 20,
            minBins: 10,
            maxBins: 20,
            // outlyingCoefficient: 2.48181993,
            outlyingCoefficient: 3,
            incrementA: 1,
            incrementB: 5,
            decrementA: 0.9,
            decrementB: 0
        };
    }

    processOutliagData(onCompleted) {
        let myself = this;
        let result1 = '';
        processYearlyOutliags();

        function processYearlyOutliags() {
            let years = myself.dataS["YearsData"].length;
            let countries = d3.keys(myself.dataS["CountriesData"]);
            //Make sure that each year there is a bin => because we will use year as index to access the bins information later on.
            //Similar for the outlying upper bound (cut point)
            const yearsData = [];
            for (let year = 0; year < years; year++) {
                let y = myself.getYearData(year);
                y.year = year;
                yearsData.push(y);
            }
            let scagOptions = myself.scagOptions;
            let outliags = [];
            // //Todo: For timing records only
            // //<editor-fold>
            // myself.counter += 1;
            // let withBinTime = new Date();
            // let numOfScags = yearsData.length;
            // //</editor-fold>

            yearsData.map((d, i) => {
                const y = d.filter(p => isValidPoint(p));
                const data = {
                    'data': y,
                    'options': scagOptions,
                    'year': d.year
                };
                startWorker("scripts/myworkernd.js", data, onResult, i);
            });

            function onResult(e) {
                outliags.push(e);
                if (outliags.length === yearsData.length) {
                    // //Todo: For timing records only
                    // //<editor-fold>
                    // result1 = `${numOfScags},${new Date() - withBinTime}`;
                    // //</editor-fold>

                    setData(outliags);
                    resetWorkers();
                    processLeaveOut(onCompleted);
                }
            }

            function isValidPoint(d) {
                for (let i = 0; i < d.length; i++) {
                    if (typeof d[i] !== 'number') {
                        return false;
                    }
                }
                return true;
            }

            function setData(outliags) {
                outliags.forEach(o => {
                    let outliag = o.outliag;
                    let year = o.year;
                    let outlyingScore = 0;
                    let bins = null;
                    let outlyingUpperBound = null;
                    if (o.outliag != null) {//outliag = null means set of valid unique points has length < 3
                        outlyingScore = outliag.outlyingScore;
                        bins = outliag.bins;
                        outlyingUpperBound = outliag.outlyingUpperBound;
                    }
                    myself.setYearOutliagScore(year, outlyingScore);

                    myself.allYearsBins[year] = bins;
                    myself.allYearUpperBounds[year] = outlyingUpperBound;
                    //By default, leave out a country would not affect anything => so we set its default leave out to be the same as the not leaveout score.
                    countries.forEach(country => {
                        myself.setYearCountryOutliagScore(year, country, outlyingScore);
                    });
                });
            }
        }

        function processLeaveOut(onCompleted) {
            //Only need to process the bins !=null and each bin with length > 1.
            let allBinsLength = myself.allYearsBins.length;
            const leaveOutData = [];
            for (let year = 0; year < allBinsLength; ++year) {
                let bins = myself.allYearsBins[year];
                if (bins != null) {//beans = null means that year, there is no data (nor the data points <=3).
                    let outlyingUpperBound = myself.allYearUpperBounds[year];
                    let binLength = bins.length;
                    for (let i = 0; i < binLength; ++i) {
                        let theBin = bins[i];
                        if (theBin.length == 1) {//Only leave out the bin if it is single, since we assume if a bin has more members, it would not affect the overall score if remove one member
                            let bins1 = bins.slice(0);//copy to avoid modifying the original one.
                            //remove the current bin.
                            bins1.splice(i, 1);
                            //calcualte outliag.
                            const theLeaveOut = {};
                            theLeaveOut.data = bins1.map(b => b.site);
                            theLeaveOut.options = Object.assign({}, myself.scagOptions);

                            theLeaveOut.options.outlyingUpperBound = outlyingUpperBound;
                            theLeaveOut.options.isNormalized = true;
                            theLeaveOut.options.isBinned = true;


                            theLeaveOut.year = year;
                            //theBin[0].data => is the country => we can make sure that the this is a single country for a bin
                            //since we only recalculating for the bin with single data point (so country is the data of the first and only point in that bin).
                            theLeaveOut.country = theBin[0].data;
                            leaveOutData.push(theLeaveOut);

                        }
                    }
                }
            }

            let outliags = [];
            //<editor-fold "TODO: for time records only">
            // let withoutBinTime = new Date();
            // let numOfScagsWithoutBin = leaveOutData.length;
            //</editor-fold>

            leaveOutData.map((data, i) => {
                startWorker("scripts/myworker.js", data, onResult, i);
            });

            function onResult(e) {
                outliags.push(e);
                if (outliags.length === leaveOutData.length) {
                    setData(outliags);
                    resetWorkers();

                    // //Todo: For timing records only
                    // //<editor-fold>
                    // let timeCompleted = new Date();
                    // console.log(`${navigator.hardwareConcurrency},${maxWorkers},${myself.counter},${fileAbbreviations[fileList.indexOf(fileName)]},${result1},${numOfScagsWithoutBin},${timeCompleted - withoutBinTime}`);
                    // if(myself.counter<30){
                    //     myself.processOutliagData(onCompleted);
                    // }
                    ////</editor-fold>
                    //Enable this after testing fro time.
                    onCompleted();
                }
            }

            function setData(outliags) {
                outliags.forEach(o => {
                    let outliag = o.outliag;
                    let year = o.year;
                    let country = o.country;
                    let outlyingScore = 0;
                    if (o.outliag != null) {//outliag = null means set of valid unique points has length < 3
                        outlyingScore = outliag.outlyingScore;
                    }
                    myself.setYearCountryOutliagScore(year, country, outlyingScore);
                });
            }
        }
    }

    getYearData(year) {
        let cd = this.dataS["CountriesData"];
        //convert to points
        let y = [];
        d3.keys(cd).forEach(country => {
            let point = [];
            for (let i = 0; i < this.dataS['Variables'].length; i++) {
                point.push(cd[country][year]["v" + i]);
            }
            point.data = country;
            y.push(point);
        });
        return y;
    }

    setYearOutliagScore(year, outliagScore) {
        this.dataS["YearsData"][year]["Scagnostics0"][0] = outliagScore;
    }

    setYearCountryOutliagScore(year, country, outlyingScore) {
        this.dataS["CountriesData"][country][year]["Outlying"] = outlyingScore;
    }
}

