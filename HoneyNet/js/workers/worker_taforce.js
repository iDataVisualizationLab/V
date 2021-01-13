importScripts('../../lib/d3.js');
let simulation;
onmessage = function (e) {
    // let start=new Date();
    let nodes = e.data.nodes;
    let links = e.data.links;
    let width = e.data.width;
    let height = e.data.height;
    let alphaTarget = e.data.alphaTarget;
    let sendTick = e.data.sendTick;
    alphaTarget = alphaTarget ? alphaTarget : 0;
    let event = e.data.event;

    if (!event || event === "start") {
        //Generate the best vertical location
        simulation = d3.forceSimulation()
            .on('end', end).alphaMin(0.2);
        if (sendTick) {
            simulation.on('tick', tick)
        }

        simulation.nodes(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(1));
    }
    if (event === "restart") {
        simulation.nodes().forEach((n, i) => {
            n.x = nodes[i].x;
            n.y = nodes[i].y;
            n.fx = nodes[i].fx;
            n.fy = nodes[i].fy;
        });
        simulation.alphaTarget(alphaTarget).restart();
    }

    function tick() {
        postMessage({event: 'tick', nodes: nodes, links: links});
    }

    function end() {
        // console.log('Done calculating TA force' + (new Date() - start));
        postMessage({event: 'end', nodes: nodes, links: links});
    }
};