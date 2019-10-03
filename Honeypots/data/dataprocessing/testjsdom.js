const d3 = require("d3");
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

function createSvg(width, height){
    const {document} = (new JSDOM(`...`)).window;
    const body = document.body;

    let svg = body.appendChild(document.createElement("svg"));
    d3.select(svg).attr("width", width).attr("height", height).append("g");
    return svg;
}
d3.select(createSvg(200, 200))
console.log(createSvg(200, 200).outerHTML);