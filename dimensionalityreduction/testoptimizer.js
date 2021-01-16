const {
    transpose,
    subtract,
    ones,
    sum,
    square,
    sqrt,
    multiply,
    reshape,
    dotMultiply,
    dotDivide
} = require("mathjs");

const Su = [1, 2, 5];
const x = [1, 1];
const alpha = 0.5;
const Q = [[3, 3], [4, 4], [5, 5]];

function distance(x, Q) {
    const xRepeated = multiply(ones(Q.length, 1), reshape(x, [1, x.length]));
    const xMQ = subtract(xRepeated, Q);
    const distances = sqrt((square(xMQ))._data.map(row => row.reduce((a, b) => a + b)));
    return {'xQDistance': distances, 'xMQ': xMQ._data}
}

console.log("=================distance=================");
const ret = distance(x, Q)
console.log(ret['xQDistance']);
console.log(ret['xMQ']);

function loss(Su, x, alpha, Q) {
    const {xQDistance, xMQ} = distance(x, Q);
    const alphaxQDistance = multiply(alpha, xQDistance);
    const diffD = subtract(Su, alphaxQDistance);
    const l = sum(square(diffD))
    return {'l': l, 'diffD': diffD, 'xQDistance': xQDistance, 'xMQ': xMQ}
}

console.log("=================loss=================");
const {l, diffD, xQDistance, xMQ} = loss(Su, x, alpha, Q);
console.log(l);
console.log(diffD);
console.log(xQDistance);
console.log(xMQ);

function dAlpha(diffD, xQDistance) {
    const dm = dotMultiply(diffD, xQDistance);
    // console.log(dm);
    return sum(multiply(-2, dm));
}

console.log("===============dalpha===================");
const d_a = dAlpha(diffD, xQDistance);
console.log(d_a);

function dX(Su, alpha, diffD, xQDistance, xMQ) {
    const n = Su.length;
    const k = xMQ[0].length;
    const SuOverxQDistance = dotDivide(Su, xQDistance);
    // console.log(SuOverxQDistance);
    let firstPart = reshape(multiply(2, multiply(alpha, subtract(SuOverxQDistance, alpha))), [n, 1]);
    const h = ones(1, k);
    firstPart = multiply(firstPart, h); //repeat the firstPart to do dotMultiply
    // console.log(firstPart);
    return multiply(-1, transpose(dotMultiply(firstPart, xMQ))._data.map(row => row.reduce((a, b) => a + b)));
}

console.log("===============dX===================");
console.log(dX(Su, alpha, diffD, xQDistance, xMQ));

function projectionOptimizer(Su, x, alpha, Q, lr, iterations) {
    const losses = [];
    for (let i = 0; i < iterations; i++) {
        // Loss
        const {l, diffD, xQDistance, xMQ} = loss(Su, x, alpha, Q);
        // Gradients
        const d_alpha = dAlpha(diffD, xQDistance)
        const d_x = dX(Su, alpha, diffD, xQDistance, xMQ);
        // Update
        alpha = alpha - lr * d_alpha;
        x = subtract(x, multiply(lr, d_x));
        losses.push(l);
    }
    return {'alphaOptimized': alpha, 'xOptimized': x, 'losses': losses};
}

console.log("===============Optimize===================");
const lr = 0.001;
const iterations = 5000;
const {xOptimized, alphaOptimized, losses} = projectionOptimizer(Su, x, alpha, Q, lr, iterations);
console.log(losses[losses.length - 1]);
console.log(xOptimized);
console.log(alphaOptimized);
console.log(x);
console.log(alpha);
