importScripts('../../lib/d3.js');
let simulation;
onmessage = function (e) {
    let nodes = e.data.nodes;
    let links = e.data.links;
    let width = e.data.width;
    let height = e.data.height;
    let alphaTarget = e.data.alphaTarget;
    alphaTarget = alphaTarget ? alphaTarget : 0;
    let event = e.data.event;

    if (event === "start") {
        simulation = d3.forceSimulation()
            .on("end", end)
            .on("tick", tick);
        simulation.nodes(nodes)
            .force('link', d3.forceLink(links))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(d => d.radius))
            .alphaTarget(alphaTarget).restart();
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
        postMessage({event: 'end', nodes: nodes});
    }
}