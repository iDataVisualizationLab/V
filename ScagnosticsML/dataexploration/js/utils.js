function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
function rectangularBinner(points, options={gridNumber: 40}) {
    let gridNumber = options.gridNumber;
    let gridSize = 1.0/gridNumber;
    let bins = [];

    for (let i = 0; i < gridNumber; i++) {
        let b = []
        for (let j = 0; j < gridNumber; j++) {
            b.push(0)
        }
        bins.push(b);
    }
    let n = points.length;
    for (let pi = 0; pi < n; pi++) {
        let point = points[pi];
        let x = point[0];
        let y = point[1];
        let j = x==1?gridNumber - 1 : Math.floor(x/gridSize);
        let i = y==0? gridNumber - 1 : Math.floor((1-y)/gridSize);
        bins[i][j] = 1;
    }
    return bins;
}
class Normalizer {
    constructor(points) {
        this.points = points.slice(0);
        let [xArr, yArr] = [this.xArr, this.yArr] = _.unzip(this.points),
            maxX = this.maxX = _.max(xArr),
            minX = this.minX = _.min(xArr),
            maxY = this.maxY = _.max(yArr),
            minY = this.minY = _.min(yArr),
            rangeX = this.rangeX = (maxX!=minX) ? maxX - minX: 1,
            rangeY = this.rangeY = (maxY!=minY) ? maxY - minY: 1,
            normalizedXArr = this.normalizedXArr = xArr.map(x => (x - minX) / rangeX),
            normalizedYArr = this.normalizedYArr = yArr.map(y => (y - minY) / rangeY);
        this.normalizedPoints = _.zip(normalizedXArr, normalizedYArr);
        //Add one step to pass the data over if there is.
        let length = this.points.length;
        for (let i = 0; i < length; i++) {
            this.normalizedPoints[i].data = this.points[i].data;
        }
    }

    /**
     * Input a set of points in this scale range [0, 1] and will be scaled back to
     * - Original scale ([minX, maxX], [minY, maxY])
     * @param points
     */
    scaleBackPoints(points) {
        return points.map(point=>{
            return this.scaleBackPoint(point);
        });
    }
    /**
     * Input a single point in this scale range [0, 1] and will be scaled back to
     * - Original scale ([minX, maxX], [minY, maxY])
     * @param points
     */
    scaleBackPoint(point) {
        let xs = point[0],
            x = this.rangeX * xs + this.minX,
            ys = point[1],
            y = this.rangeY * ys + this.minY;
        return [x, y];
    }
}