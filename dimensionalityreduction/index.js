const {transpose, subtract, apply, ones, multiply, reshape, square, sum, sqrt, setDifference} = require("mathjs");
const {SVD} = require("svd-js");

let P = [[1, 2, 3], [4, 2, 1], [0, 8, 4], [9, 11, 12]];
const ids1 = [0, 1, 2, 3, 4, 5, 6];
const ids2 = [0, 1, 2, 3, 4, 5, 7];
console.log(setDifference(ids1, ids2));


