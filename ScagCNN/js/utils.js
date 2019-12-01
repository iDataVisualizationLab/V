/**
 * Sort an array by values and return the original indexes order (not the values).
 * @param arr
 * @returns {number[]}
 */
function argsort(arr) {
    //Create the index
    let theOrder = Array.from(arr, (val, i) => i).sort((a, b) => arr[a] - arr[b]);
    return theOrder;
}