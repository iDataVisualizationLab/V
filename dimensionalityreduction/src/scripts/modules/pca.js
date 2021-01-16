/**
 * Project data to PCA space using n_components
 * @param pca the PCA object created and fitted
 * @param data the data in full feature space to be projected
 * @param n_components the number of principle components
 * @return {number[][]} the projected data
 */
export function projectToPCs(pca, data, n_components = 2) {
    const ret = pca.predict(data).subMatrix(0, data.length - 1, 0, n_components - 1);
    return ret.to2DArray();
}

/***
 * Convert/invert the PCA projected data back to the original space.
 * @param pca   the PCA object created and fitted
 * @param data  the data in the Principle Components Space
 * @return {number[][]} the data covnerted to the original space (may loose some information if the number of PCs is low.
 */
export function invertToOriginalSpace(pca, data) {
    const data1 = pca.invert(data);
    return data1.to2DArray();
}
