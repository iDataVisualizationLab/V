importScripts('../../lib/d3.js');
let simulation;
onmessage = function (e) {
    let nodes = e.data.nodes;
    let links = e.data.links;
    let width = e.data.width;
    let height = e.data.height;
    let alphaTarget = e.data.alphaTarget;
    let sendTick = e.data.sendTick;
    alphaTarget = alphaTarget ? alphaTarget : 0;
    let event = e.data.event;

    if (!event || event === "start") {
        simulation = d3.forceSimulation()
            .on("end", end);
        if (sendTick) {
            simulation.on("tick", tick);
        }

        simulation.nodes(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(d => d.radius))
            .alphaMin(0.08)
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
        nodes.forEach(n => {
            bound(n);
        });
        postMessage({event: 'tick', nodes: nodes, links: links});
    }

    function end() {
        postMessage({event: 'end', nodes: nodes, links: links});
    }

    function bound(node) {
        if (node.x !== undefined && node.y !== undefined) {
            let vecX = node.x - width / 2, vecY = node.y - height / 2;
            let distance = Math.sqrt(vecX * vecX + vecY * vecY);
            if (distance > width / 2 + 5) {
                let ratio = (width / 2) / distance;
                node.x = ratio * node.x;
                node.y = ratio * node.y;
                if (node.x < width / 2 && node.y < height / 2) {
                    node.x += 10;
                    node.y += 10;
                }

            }
        }
    }
}