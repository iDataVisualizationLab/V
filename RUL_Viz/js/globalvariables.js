const dispatch = d3.dispatch("start", "pause", "change", "save");
let btnTrain = null;
const mapObjects = {};
let currentModel = null;
let trainRULOrder;
let testRULOrder;
const lstmWeightTypes = ["(click to toggle)", "input gate", "forget gate", "cell state", "output gate"];
const lstmWeightTypeDisplay = [1, 0, 0, 0];
const weightTypeDisplay = [1, 1];
let isTraining = false;
let trainLosses;
let testLosses;

//Draw color scales
const colorBarW = 100;
const colorBarH = 10;