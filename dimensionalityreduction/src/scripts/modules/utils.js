import {
    transpose,
    subtract,
    ones,
    sum,
    square,
    sqrt,
    multiply,
    reshape,
    dotMultiply,
    dotDivide,
    divide
} from "mathjs";

export function sumOverAxis(X, axis = 0) {
    if (!Array.isArray(X)) {
        X = X._data; // Make sure is an array to do the mapping
    }
    if (axis === 0) {
        X = transpose(X);
    }
    return X.map(row => row.reduce((a, b) => a + b));
}

export function meanOverAxis(X, axis = 0) {
    const count = axis === 0 ? X.length : X[0].length;
    return divide(sumOverAxis(X, axis), count);
}

