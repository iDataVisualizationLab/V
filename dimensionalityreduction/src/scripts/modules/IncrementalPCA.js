/**
 * Adapted/Changed to mathjs instead of the use of TFJS from: https://github.com/berlm/incremental_pca/blob/master/src/incremental_pca.js
 **/
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
    isNumeric,
    divide,
    add, zeros
} from "mathjs";

import {meanOverAxis, sumOverAxis} from "./utils";

export function incremental_mean_and_var(X, last_mean, last_variance, last_sample_count) {
    const last_sum = dotMultiply(last_mean, last_sample_count);
    const new_sum = sumOverAxis(X, 0);
    const new_sample_count = sumOverAxis(isNumeric(X), 0); // Note here that non-numeric will be ignored

    const updated_sample_count = add(last_sample_count, new_sample_count);
    const updated_mean = dotDivide(add(last_sum, new_sum), updated_sample_count);

    let updated_variance;
    if (last_variance !== undefined) {
        const new_unormalized_variance = dotMultiply(subtract(meanOverAxis(square(X), 0), square(meanOverAxis(X, 0))), new_sample_count);
        const last_unormalized_variance = dotMultiply(last_variance, last_sample_count);
        const last_over_new_count = dotDivide(last_sample_count, new_sample_count);

        const x1 = dotDivide(last_sum, last_over_new_count);
        const x2 = subtract(x1, new_sum);
        const x3 = square(x2);
        const x4 = dotDivide(last_over_new_count, updated_sample_count);
        const x5 = dotMultiply(x3, x4);

        let updated_unormalized_variance = add(add(last_unormalized_variance, new_unormalized_variance), x5);
        updated_variance = dotDivide(last_sample_count.map((x, i) => x === 0 ? new_unormalized_variance[i] : updated_unormalized_variance[i]), updated_sample_count);

    }
    return {
        updated_mean,
        updated_variance,
        updated_sample_count
    }
}

/* Implementation based on https://link.springer.com/chapter/10.1007/978-3-540-45080-1_122 */
class FastPCA {
    constructor(n_components, whiten = true, amnesy = 100) {
        this.n_components = n_components;
        this.whiten = whiten;
        this.amnesy = amnesy;
        this.components_ = [];
        this.n_samples_seen_ = 0; //vectors seen
        this.mean_ = 0; // incrementally computed mean per component
        this.var_ = 0; // incrementally computed variance per component
        this.n_features_ = undefined;
    }

    fit(X) {
        for (let u of X) {
            this.fit_one(u);
        }
        return this;
    }

    partial_fit(X) {
        return this.fit(X);
    }

    fit_one(u) {
        //Flatten u
        while (size(u).length > 1) {
            u = u.flat();
        }
        let X = reshape(u, [1, u.length]);
        const k = this.n_components;
        const n = this.n_samples_seen_;
        const l = this.amnesy;

        const n_features = size(u)[0];

        if (this.n_features_ === undefined) {
            this.n_features_ = n_features;
        } else if (this.n_features_ !== n_features) {
            throw Error(`Dimension of input changed from ${this.n_features_} to ${n_features}`);
        }

        // Update stats - they are 0; if this is the first step
        const last_sample_count = Array(n_features);
        for (let i = 0; i < n_features; i++) {
            last_sample_count[i] = this.n_samples_seen_;
        }
        if (this.mean_ === 0) {
            this.mean_ = zeros(n_features);
        }
        if (this.var_ === 0) {
            this.var_ = zeros(n_features);
        }
        let {updated_mean, updated_variance} = incremental_mean_and_var(X, this.mean_, this.var_, last_sample_count);
        let n_total_samples = n + 1;
        //Whitening
        const mean_correction = dotMultiply(square(divide(this.n_samples_seen_, n_total_samples)), this.mean_);
        X = subtract(X, mean_correction);
        //Flatten X
        while (size(X).length > 1) {
            X = X.flat();
        }
        u = reshape(X, [1, X.length]);

        this.mean_ = updated_mean;
        this.var_ = updated_variance;

        for (let i = 0; i < k; i++) {
            let v;
            if (i< n){
                // const vp =
            }
        }
        return this;
    }
}
