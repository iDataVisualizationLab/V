function drawTSNE(theGroup, tsneSettings) {
    const contentWidth = tsneSettings.contentWidth,
        contentHeight = tsneSettings.contentHeight;

    let files = null;

    function draw(data) {
        const xScale = d3.scaleLinear().domain(getExtent(data, 0)).range([0, contentWidth]);
        const yScale = d3.scaleLinear().domain(getExtent(data, 1)).range([0, contentHeight]);
        let selection = theGroup.selectAll(".compute").data(data);
        //Exit
        selection.exit().remove();
        /*********Images************/
        // //Enter
        // const newElements = selection.enter().append('image').attr("class", "compute").attr("xlink:href", (d, i) => {
        //     return "data/dataprocessing/input/" + files[i];
        // }).attr("x", d => xScale(d[0])).attr("y", d => yScale(d[1])).attr("width", 30).attr("height", 30);
        // selection = newElements.merge(selection);
        // //Update
        // selection.attr("x", d => xScale(d[0])).attr("y", d => yScale(d[1]))
        //     .on("click", (d, i) => {
        //         tsneSettings.onTNSENodeClick(files[i]);
        //     });
        /*********Circles************/
        //Enter
        const newElements = selection.enter().append('circle').attr("class", "compute").attr("r", 3).attr("cx", d => xScale(d[0])).attr("cy", d => yScale(d[1]));
        selection = newElements.merge(selection);
        //Update
        selection.attr("cx", d => xScale(d[0])).attr("cy", d => yScale(d[1]))
            .on("click", (d, i) => {
                tsneSettings.onTNSENodeClick(files[i]);
            });
    }

    function getExtent(data, columnIndex) {
        return d3.extent(data.map(d => d[columnIndex]));
    }

    let w;

    function startWorker(fileName, data, onResult) {
        if (typeof (Worker) !== "undefined") {
            if (w === undefined) {
                w = new Worker(fileName);
                w.postMessage(data);
            }
            w.onmessage = function (event) {
                onResult(event.data);
            };
        } else {
            throw "Browser doesn't support web worker";
        }
    }

    d3.json('data/dataprocessing/python/april11_pca_features_notNorm.json').then((data) => {
        d3.json('data/dataprocessing/python/april11_files.json').then((file_list) => {
            files = file_list;
            startWorker("js/workers/worker_tsne.js", data, draw);
        });

    });
}