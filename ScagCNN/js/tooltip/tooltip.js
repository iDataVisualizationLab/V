//Build tooltip
let div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

async function showTip(htmlStr) {
    div.style('left', (d3.event.pageX + 5) + "px").style("top", (d3.event.pageY - 12) + "px");
    div.transition().duration(1000).style("opacity", 1);
    div.html(htmlStr).style("left", (d3.event.pageX - 10) + "px")
        .style("top", (d3.event.pageY - 52 - imageSize) + "px");
}
async function showTipWithPos(htmlStr, pageX, pageY) {
    div.style('left', (pageX + 5) + "px").style("top", (pageY - 12) + "px");
    div.transition().duration(1000).style("opacity", 1);
    div.html(htmlStr).style("left", (pageX - 10) + "px")
        .style("top", (pageY - 52) + "px");
}
function hideTip() {
    div.transition().duration(1000).style("opacity", 0);
}
