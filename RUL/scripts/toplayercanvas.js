const canvas = document.getElementById('topLayer');
const ctx = canvas.getContext('2d');

drawLine(ctx, [graphWidth+20, 0], [graphWidth+20, contentHeight], 'red');

//A line
function drawLine(ctx, fromPoint, toPoint, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromPoint[0], fromPoint[1]);
    ctx.lineTo(toPoint[0], toPoint[1]);
    ctx.stroke();
    ctx.restore();
}