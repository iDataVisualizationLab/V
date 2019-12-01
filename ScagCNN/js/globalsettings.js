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
//Storages
let XArr;
let yArr;
const allPredictionGraphs = [];
const allPredictionGraphsOrder = [];
const investigatingItems = new Set();
let model;

//Left line charts.
let lineChartPaddings = {
    paddingLeft: 40,
    paddingRight: 0,
    paddingTop: 20,
    paddingBottom: 20,
}
let imageMargins = {
    left: 10,
    top: lineChartPaddings.paddingTop
}
//Sizes
// let imageSize = 160;
// let predictionChartHeight = imageSize + lineChartPaddings.paddingTop + lineChartPaddings.paddingBottom;
// let predictionChartWidth = 600;
// let contentHeight = predictionChartHeight * 9 + 20; //20 for the margin
//Another size scheme
let width = window.innerWidth - 20; //-20 is for left and right margin
let predictionChartWidth = Math.floor(width / 3);
let imageSize = Math.max(80, Math.floor((width - predictionChartWidth)/10) - imageMargins.left);
let predictionChartHeight = imageSize + lineChartPaddings.paddingTop + lineChartPaddings.paddingBottom;

let contentHeight = predictionChartHeight * 9 + 20; //20 for the margin
