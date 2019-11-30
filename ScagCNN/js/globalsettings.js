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
    paddingRight: 30,
    paddingTop: 20,
    paddingBottom: 20,
}
//The model
let model;
//Sizes
// const navHeight = 60;
// const articleHeight = 0;
// let windowHeight = window.innerHeight;
// let contentHeight = windowHeight - navHeight - articleHeight - 10;
// let predictionChartHeight = (contentHeight - 40) / 9;
// let imageSize = predictionChartHeight - lineChartPaddings.paddingTop - lineChartPaddings.paddingBottom;
//New sizes scheme
const navHeight = 60;
const articleHeight = 0;
let imageSize = 160;
let windowHeight = window.innerHeight;
let predictionChartHeight = imageSize + lineChartPaddings.paddingTop + lineChartPaddings.paddingBottom;
let contentHeight = predictionChartHeight*9 + 20; //20 for the margin

//Storages
let XArr;
let yArr;
const allPredictionGraphs = [];
const allPredictionGraphsOrder = [];
const investigatingItems = new Set();

