const random = Math.random;
const pi = Math.PI;
const cos = Math.cos;
const sin = Math.sin;

/***********OUTLYING DATA*******************
 * 1.5*IQR
 *******************************************/

function outlyingScatterPlot() {
    let muyX = muyY = 0.5;
    let sigma = 0.1;
    let randomX = d3.randomNormal(muyX, sigma),
        randomY = d3.randomNormal(muyY, sigma),
        points = d3.range(200).map(function () {
            return [randomX(), randomY()];
        });
    //Push few more outlying points.
    let zScore = () => d3.randomUniform(3, 30)();
    let distance = () => zScore() * sigma;
    let corner = () => d3.randomUniform(0, 2)() * Math.PI;
    let genOutylingPoint = () => {
        let d = distance();
        let c = corner();
        return [muyX + d * Math.cos(c), muyY + d * Math.sin(c)];
    };
    let numOp = d3.randomInt(1, 5)();
    for (let i = 0; i < numOp; i++) {
        let op = genOutylingPoint();
        points.push(op);
    }
    return points;
}

/***********SKWED DATA*******************
 * (q90-q50)/(q90-q10)
 */

function skewedScatterPlot() {
    let points = [];
    //Way 1
    let gridNumX = d3.randomInt(3, 6)();
    let gridNumY = d3.randomInt(3, 6)();
    let gridW = 1.0 / gridNumX;
    let gridH = 1.0 / gridNumY;
    let groupSigma = () => 1.0 / d3.randomInt(30, 60)();
    for (let i = 0; i < gridNumX; i++) {
        for (let j = 0; j < gridNumY; j++) {
            const randomX = d3.randomNormal(i * gridW, groupSigma()),
                randomY = d3.randomNormal(j * gridH, groupSigma());
            d3.range(20).forEach(_ => {
                points.push([randomX(), randomY()]);
            });
        }
    }
    return points;
}

/***********CLUMPY DATA*******************
 *  RUNT Length
 */


function clumpyScatterPlot() {
    let points = [];
    let numberOfClusters = d3.randomInt(2, 4)();
    //Push few more outlying points.
    let distance = d3.randomUniform(0.5, 0.1);//Around the center
    let corner = () => d3.randomUniform(0, 2)() * Math.PI;
    let genGroupPoint = () => {
        let d = distance();
        let c = corner();
        return [d * Math.cos(c), d * Math.sin(c)];
    };
    for (let cluster = 0; cluster < numberOfClusters; cluster++) {
        let groupCenter = genGroupPoint();
        let groupSigma = d3.randomUniform(0.01, 0.02)();
        let randomX = d3.randomNormal(groupCenter[0], groupSigma),
            randomY = d3.randomNormal(groupCenter[1], groupSigma);
        d3.range(50).map(function () {
            points.push([randomX(), randomY()]);
        });
    }
    return points;
}

/***********SPARSED DATA*******************
 * q90
 */


function sparsedScatterPlot() {
    return Math.random() < 0.2 ? way1() : way2();

    function way2() {//three points.
        let points = [];
        let sigma = 1.0 / d3.randomUniform(80, 120)();
        //Single-side points
        let randomX = d3.randomNormal(1 / 2, sigma),
            randomY = d3.randomNormal(1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });

        //Two-side points
        randomX = d3.randomNormal(1 / 4, sigma);
        randomY = d3.randomNormal(3 * 1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });

        //Two-side points
        randomX = d3.randomNormal(3 * 1 / 4, sigma);
        randomY = d3.randomNormal(3 * 1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });
        //Rotate the points?
        let rotation = d3.randomInt(0, 4)();
        if (rotation === 1) {//90 degrees
            points = points.map(p => {
                return [p[1], p[0]]
            });
        } else if (rotation === 2) {//180 degrees
            points = points.map(p => {
                return [-p[0], -p[1]]
            });
        } else if (rotation === 3) {//270 degrees
            points = points.map(p => {
                return [1 - p[1], p[0]]
            });
        }
        return points;
    }

    function way1() {//four points
        let points = [];
        let sigma = 1.0 / d3.randomUniform(80, 120)();
        //Top left points
        let randomX = d3.randomNormal(1 / 4, sigma),
            randomY = d3.randomNormal(1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });
        //Top right
        randomX = d3.randomNormal(3 * 1 / 4, sigma),
            randomY = d3.randomNormal(1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });
        //Bottom left
        randomX = d3.randomNormal(1 / 4, sigma);
        randomY = d3.randomNormal(3 * 1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });

        //Bottom right
        randomX = d3.randomNormal(3 * 1 / 4, sigma);
        randomY = d3.randomNormal(3 * 1 / 4, sigma);
        d3.range(20).map(function () {
            points.push([randomX(), randomY()]);
        });
        return points;
    }
}

/***********STRIATED DATA*******************
 * obtus corner (cos theta < -0.75).
 */


function striatedScatterPlot() {
    let points = [];
    let numberOfLines = d3.randomInt(2, 5)();
    let vertHoz = d3.randomInt(0, 2)();
    for (let l = 0; l < numberOfLines; l++) {
        let randomX = d3.randomNormal(l / numberOfLines, 1.0 / 1e3),
            randomY = d3.randomUniform(0, 1);
        d3.range(100).map(function () {
            points.push(vertHoz == 0 ? [randomX(), randomY()] : [randomY(), randomX()]);//May be horizontal or vertical
        });
    }
    return points;
}

/***********CONVEX DATA*******************
 * area(concave)/area(convex)
 */


function convexScatterPlot() {
    let points;
    let randomX = d3.randomNormal(1.0 / 2, 0.5),
        randomY = d3.randomNormal(1.0 / 2, 0.5);
    points = d3.range(2000).map(function () {
        return [randomX(), randomY()];
    });
    return points;
}

/***********SKINNY DATA*******************
 * 1 - sqrt(4*pi*area(concave))/perimeter(concave)
 */

function skinnyScatterPlot() {
    return Math.random() < 0.5 ? way1() : way2();

    function way2() {
        let points = [];
        let nPoints = 100;
        let phase = Math.random() < 0.5 ? 0 : 1;
        let noise = () => Math.random() / d3.randomInt(100, 1000)();
        let linSpace = Math.PI / nPoints;
        let flip = Math.random() < 0.5 ? 0 : 1;
        for (let i = 0; i < nPoints; i++) {
            let p = [i * linSpace + noise(), Math.sin(phase * Math.PI + i * linSpace) + noise()];
            points.push(flip ? p : [p[1], p[0]]);
        }
        return points;
    }

    function way1() {
        let points = [];
        let deg_to_rad = Math.PI / 180.0;
        let depth = 5;
        let branchAngle = 30;
        generateTree(300, 500, -90, depth);
        generateTree(300, 500, 0, depth);
        generateTree(300, 500, 90, depth);
        generateTree(300, 500, 180, depth);

        function generateTree(x1, y1, angle, depth) {
            if (depth !== 0) {
                let x2 = x1 + (Math.cos(angle * deg_to_rad) * depth * 10.0);
                let y2 = y1 + (Math.sin(angle * deg_to_rad) * depth * 10.0);
                points = points.concat(generatePointsOnLine(x1, y1, x2, y2, 4));
                generateTree(x2, y2, angle - branchAngle, depth - 1);
                generateTree(x2, y2, angle + branchAngle, depth - 1);
            }
        }

        function generatePointsOnLine(x1, y1, x2, y2, nPoints) {
            let pointsOL = [];
            if (x1 === x2) {
                let deltaY = (y2 - y1) / nPoints;
                for (let i = 0; i < nPoints; i++) {
                    pointsOL.push([x1 + random(), y1 + i * deltaY + random()])
                }
            } else {
                let a = (y2 - y1) / (x2 - x1);
                let b = -a * x1 + y1;
                let deltaX = (x2 - x1) / nPoints;
                for (let i = 0; i < nPoints; i++) {
                    let x = x1 + i * deltaX;
                    let y = a * x + b;
                    pointsOL.push([x + random(), y + random()]);
                }
            }
            return pointsOL;
        }

        return points;
    }

}

/***********STRINGY DATA*******************
 * V(2)/(V-V(1))
 */


function stringyScatterPlot() {
    let points = [];
    let numPis = d3.randomInt(2, 6)();
    let numPoints = 100;
    let incrdecr = Math.random() < 0.5 ? 1 : -1;
    let flip = Math.random() < 0.5 ? true : false;
    for (let i = 0; i < numPoints; i++) {
        let x = i * (numPis * pi / numPoints);
        let y = incrdecr * x / (numPis * pi) + sin(x);
        let p = [x + random() / numPoints, y + random() / numPoints];
        points.push(flip ? p : [p[1], p[0]]);
    }
    return points;
}

/***********MONOTONIC DATA*******************/


function monotonicScatterPlot() {
    let randomX = d3.randomUniform(0, 1);
    let points = [];
    let posneg = Math.random() < 0.5 ? 1 : -1;
    d3.range(100).forEach(() => {
        const val = randomX();
        let p = [val + random() / d3.randomUniform(100, 1000)(), posneg * val + random() / d3.randomUniform(50, 500)()];
        points.push(p);
    });
    return points;
}

/***********X LINE*******************/


function xLineScatterPlot() {
    let randomY = d3.randomUniform(0, 1);
    let points = [];
    d3.range(100).forEach(() => {
        const val = randomY();
        points.push([1, val]);
    });
    return points;
}

/***********Y LINE*******************/

function yLineScatterPlot() {
    let randomX = d3.randomUniform(0, 1);
    let points = [];
    d3.range(100).forEach(() => {
        const val = randomX();
        points.push([val, 1]);
    });
    return points;
}