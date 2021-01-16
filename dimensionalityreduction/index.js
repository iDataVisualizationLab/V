const {PCA} = require('ml-pca');
const data = [[40, 50, 60, 80], [50, 70, 60, 90], [80, 70, 90, 100], [50, 60, 80, 10]];
const pca = new PCA(data);
let n_components = 2;
const ret = pca.predict(data).subMatrix(0, data.length - 1, 0, n_components - 1).to2DArray();
console.log(ret);
//Convert back
const data1 = pca.invert(ret);
console.log(data1);
