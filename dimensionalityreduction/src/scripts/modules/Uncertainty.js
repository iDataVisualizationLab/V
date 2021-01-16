import {sqrt, sum, square} from "mathjs";

export function optimizerUncertainty(Uloss, Su) {
    return sqrt(Uloss / (sum(square(Su))));
}

/**
 * Compute the loss due to PCA projection if we are missing some features
 * @param W: the loading matrix
 * @param ls: the indices of the known features
 */
export function pcaUncertainty(W, ls, k) {
    let covered = 0;
    for (let i = 0; i < k; i++) {
        let frac1 = 0;
        let frac2 = 0;
        for (let j in ls) {
            //TODO: Make sure to check this again as ij or ji, since from the paper it is ij but from theory it is ji
            frac1 += W[i][j];
        }
        for (let j = 0; j < D; j++) {
            //TODO: Make sure to check this again as ij or ji, since from the paper it is ij but from theory it is ji
            frac2 += W[i][j];
        }
        covered += frac1 / frac2;
    }
    let Vl = 1 - covered / k;
    return Vl;
}

export function uncertainty(optimizerUncertainty, pcaUncertainty, beta = 0.5) {
    return optimizerUncertainty * beta + (1 - beta) * pcaUncertainty;
}

