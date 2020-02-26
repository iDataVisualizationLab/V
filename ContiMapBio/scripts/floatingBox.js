function openFloatingBox(theButton, theBox) {
    $("#" + theBox).animate({
        opacity: '1.0',
        display: 'block',
        'z-index': 9
    });
    $("#" + theButton).fadeTo(1000, 0);
}

function closeFloatingBox(theButton, theBox) {
    $("#" + theBox).animate({
        opacity: '0.0',
        display: 'none',
        'z-index': 0
    });
    if(theButton){
        $("#" + theButton).fadeTo(1000, 1.0);
    }
}

let xOffset = 0;
let yOffset = 0;

function boxDragStarted() {
    let obj = d3.select(this);
    xOffset = d3.event.x - obj.node().getBoundingClientRect().x;
    yOffset = d3.event.y - obj.node().getBoundingClientRect().y;

}

function boxDragged() {
    d3.event.sourceEvent.stopPropagation();
    let obj = d3.select(this);
    let xCoord = d3.event.x - xOffset;
    let yCoord = d3.event.y - yOffset;
    obj.style("left", xCoord + "px");
    obj.style("top", yCoord + "px");

}

function boxDragEnded() {
    d3.event.sourceEvent.stopPropagation();
}

$(document).ready(() => {
    d3.selectAll(".floatingBox").call(d3.drag().on("start", boxDragStarted).on("drag", boxDragged).on("end", boxDragEnded));
    $(document).keyup(function (e) {
        if (e.keyCode == 27) {

        }
    });
});

d3.select("#configurationContainer").style("left", (window.innerWidth*2/3 + margins.left + margins.right + 30) + "px").style("top", (timeLineHeight+100) + "px").style("opacity", 0);//+10 is for the default top margin
d3.select("#btnConfiguration").style("top", 100 + "px").style("opacity", "1");
