//A line
function drawLine(fromPoint, toPoint, color) {
    const canvas = document.getElementById('topLayer');
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromPoint[0], fromPoint[1]);
    ctx.lineTo(toPoint[0], toPoint[1]);
    ctx.stroke();
    ctx.restore();
}