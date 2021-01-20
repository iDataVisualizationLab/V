import {
    transpose,
    subtract,
    ones,
    sum,
    square,
    add,
    sqrt,
    multiply,
    reshape,
    divide,
    clone
} from "mathjs";
import {SVD} from "svd-js";

/**
 * This class will calculate Procrustes transform information and do the transformation
 */
export class ProcrustesTransformation {
    /**
     * Constructor
     * @param P_prev_all: Projected coordinates of the previous time step
     * @param P_curr_all: Projected coordinates of the current time step
     * @param idsFrom: Ids of the points in the previous projection, we need this information to match which points are common between two projections, it should be sorted
     * @param idsTo: Ids of the points in the current projection, we need this information to match which points are common between two projections, it should be sorted
     */
    constructor(origPointsFrom, origPointsTo, idsFrom, idsTo) {
        this.origPointsFrom = origPointsFrom;
        this.origPointsTo = origPointsTo;


        //Find the common points
        let processedPointsFrom = [];
        let processedPointsTo = [];

        for (let i = 0; i < origPointsFrom.length; i++) {
            for (let j = 0; j < origPointsTo.length; j++) {
                if (idsFrom[i] === idsTo[j]) {
                    processedPointsFrom.push(origPointsFrom[i]);
                    processedPointsTo.push(origPointsTo[j]);
                }
            }
        }

        let n = processedPointsFrom.length;
        let k = processedPointsFrom[0].length;

        //mean vectors
        let meanPointsFrom = transpose(processedPointsFrom).map(row => row.reduce((a, b) => a + b) / row.length);
        let meanPointsTo = transpose(processedPointsTo).map(row => row.reduce((a, b) => a + b) / row.length);

        let v = ones(n, 1);
        processedPointsFrom = subtract(processedPointsFrom, multiply(v, reshape(meanPointsFrom, [1, k])));
        processedPointsTo = subtract(processedPointsTo, multiply(v, reshape(meanPointsTo, [1, k])));

        // Uniform scaling
        // sum the squared values for every values in columns, then sum them
        let scalePointsFrom = sum(sqrt(transpose(square(processedPointsFrom._data)).map((row) => row.reduce((a, b) => a + b))));
        let scalePointsTo = sum(sqrt(transpose(square(processedPointsTo._data)).map((row) => row.reduce((a, b) => a + b))));


        scalePointsFrom /= n;
        scalePointsTo /= n;

        scalePointsFrom = sqrt(scalePointsFrom);
        scalePointsTo = sqrt(scalePointsTo);

        processedPointsFrom = divide(processedPointsFrom, scalePointsFrom);
        processedPointsTo = divide(processedPointsTo, scalePointsTo);

        const covMat = multiply(transpose(processedPointsFrom), processedPointsTo)._data;
        const svdRet = SVD(covMat);
        const V = svdRet['v'];
        const U = svdRet['u'];
        const R = multiply(V, transpose(U));

        //TODO: Apply transform for the common points and the new points separately may save some time.
        // //Apply the transform only to the common points
        // let transformedPointsTo = multiply(multiply(scalePointsFrom, processedPointsTo), R);

        //Apply the transformation to all the points
        let processedOrigPointsTo = clone(origPointsTo);
        const n_all = origPointsTo.length;
        v = ones(n_all, 1);
        //Translate
        processedOrigPointsTo = subtract(processedOrigPointsTo, multiply(v, reshape(meanPointsFrom, [1, k])));
        //Scale
        processedOrigPointsTo = divide(processedOrigPointsTo, scalePointsTo);
        //Rotate
        processedOrigPointsTo = multiply(multiply(scalePointsFrom, processedOrigPointsTo), R);
        //Add back the mean
        processedOrigPointsTo = add(processedOrigPointsTo, multiply(v, reshape(meanPointsFrom, [1, k])));
        this.processedOrigPointsTo = processedOrigPointsTo;
    }

    translatedResult() {
        return this.processedOrigPointsTo._data;
    }
}
