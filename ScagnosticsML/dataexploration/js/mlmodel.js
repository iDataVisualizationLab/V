let data = null;
async function loadData() {
    let data = await d3.json("data/RealWorldData10.json");
    return data;
}

async function showExamples() {
    if(data === null){
        data = await loadData();
    }
    // Get a surface
    const surface = tfvis.visor().surface({
        name: 'Sample data',
        tab: 'Input/test Data'
    });

    const drawArea = surface.drawArea;
    let numImages = data.length;
    const examples = [];
    for (let i = 0; i < numImages; i++) {
        let dt = data[i];
        let idx = d3.randomInt(dt.length);
        examples.push(dt[idx].data);
    }
    const numExamples = examples.length;

    for (let i = 0; i < numExamples; i++) {
        const imageTensor = tf.tidy(() => {
            return tf.tenor2d(examples[i]).reshape([40, 40, 1]);
        }); // Create a canvas element to render each example

        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        canvas.style = 'margin: 4px;';
        await tf.browser.toPixels(imageTensor, canvas);
        drawArea.appendChild(canvas);
        imageTensor.dispose();
    }
}