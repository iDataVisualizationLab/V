const typeList = [
    'outlying',
    'skewed',
    'clumpy',
    'sparsed',
    'striated',
    'convex',
    'skinny',
    'stringy',
    'monotonic'];
//Left line charts.
let lineChartPaddings = {
    paddingLeft: 40,
    paddingRight: 0,
    paddingTop: 20,
    paddingBottom: 20,
}
//The model
let model;
//Sizes
let imageSize = 160;
let predictionChartHeight = imageSize + lineChartPaddings.paddingTop + lineChartPaddings.paddingBottom;
let predictionChartWidth = 600;
let contentHeight = predictionChartHeight * 9 + 20; //20 for the margin

//Storages
let XArr;
let yArr;
const allPredictionGraphs = [];
const allPredictionGraphsOrder = [];
const investigatingItems = new Set();

