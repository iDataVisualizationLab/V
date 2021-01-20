import {
    transpose,
    subtract,
    ones,
    sum,
    add,
    square,
    sqrt,
    multiply,
    reshape,
    dotMultiply,
    dotDivide,
    mean,
    divide
} from "mathjs";

function distance(x, Q) {
    const xRepeated = multiply(ones(Q.length, 1), reshape(x, [1, x.length]));
    const xMQ = subtract(xRepeated, Q);
    const distances = sqrt((square(xMQ))._data.map(row => row.reduce((a, b) => a + b)));
    return {'xQDistance': distances, 'xMQ': xMQ._data}
}

function loss(Su, x, alpha, Q) {
    const {xQDistance, xMQ} = distance(x, Q);
    const alphaxQDistance = multiply(alpha, xQDistance);
    const diffD = subtract(Su, alphaxQDistance);
    const l = mean(square(diffD))
    return {'l': l, 'diffD': diffD, 'xQDistance': xQDistance, 'xMQ': xMQ}
}

function dAlpha(diffD, xQDistance) {
    const dm = dotMultiply(diffD, xQDistance);
    return mean(multiply(-2, dm));
}

function dX(Su, alpha, diffD, xQDistance, xMQ) {
    const n = Su.length;
    const k = xMQ[0].length;
    const SuOverxQDistance = dotDivide(Su, xQDistance);
    let firstPart = reshape(multiply(2, multiply(alpha, subtract(SuOverxQDistance, alpha))), [n, 1]);
    const h = ones(1, k);
    firstPart = multiply(firstPart, h); //repeat the firstPart to do dotMultiply
    return divide(multiply(-1, transpose(dotMultiply(firstPart, xMQ))._data.map(row => row.reduce((a, b) => a + b))), n);
}

/**
 * Optimize the projection
 * @param Su: the distances to the existing points in space1 (e.g., l-PCA)
 * @param x: the point to be optimized (start at some point then will move to the optimized one)
 * @param alpha: the alpha scaling value to be optimized (should start with 1.0)
 * @param Q: the coordinates of the points (same number of points as those in Su) in the space2 (e.g., D-PCA)
 * @param lr: the learning rate
 * @param iterations: number of iterations
 * @return {{alphaOptimized: *, xOptimized: *, , losses: []}}
 */
export function projectionOptimizer(Su, x, alpha, Q, lr, iterations) {
    let vtAlpha = 0;
    let vtX = x.map(() => 0);
    let epsilon = 1e-8;
    const losses = [];

    for (let i = 0; i < iterations; i++) {
        // Loss
        const {l, diffD, xQDistance, xMQ} = loss(Su, x, alpha, Q);
        // Gradients
        const d_alpha = dAlpha(diffD, xQDistance);
        const d_x = dX(Su, alpha, diffD, xQDistance, xMQ);
        //Update the squared gradient
        vtAlpha += d_alpha * d_alpha;
        vtX = add(vtX, square(d_x));
        // Update
        alpha = alpha - lr * d_alpha / vtAlpha;
        x = subtract(x, multiply(lr, dotDivide(d_x, sqrt(add(vtX, epsilon)))));
        losses.push(l);
    }
    return {'alphaOptimized': alpha, 'xOptimized': x, 'losses': losses};
}
export function projectionOptimizerSGD(Su, x, alpha, Q, lr, iterations) {
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
