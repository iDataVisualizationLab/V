function drawNetworkGraph(theGroup, nodes, links, networkSettings) {


    let width = networkSettings.width, height = networkSettings.height, nodeTypeColor = networkSettings.nodeTypeColor,
        margin = networkSettings.margin,
        linkTypes = networkSettings.linkTypes, linkTypeColor = networkSettings.linkTypeColor,
        onNodeMouseOverCallback = networkSettings.onNodeMouseOverCallback,
        onLinkMouseOverCallback = networkSettings.onLinkMouseOverCallback,
        onNodeMouseOutCallback = networkSettings.onNodeMouseOutCallback,
        onLinkMouseOutCallback = networkSettings.onLinkMouseOutCallback;

    function getLinkStrokeWidthScale(links, minWidth, maxWidth) {
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => d.dataCount))).range([minWidth, maxWidth]);
        return function (dataCount) {
            return scale(dataCount);
        }
    }

    let linkStrokeWidthScale = getLinkStrokeWidthScale(links, nwMinStrokeWidth, nwMaxStrokeWidth);
    this.linkStrokeWidthScale = linkStrokeWidthScale;//Store it to use outside in the TimeArc
    let nodeRadiusScale;
    //Add a clippath
    theGroup.append("defs").append("clipPath").attr("id", "theNetworkGraphCP").append("rect").attr("x", 0).attr("y", margin.top).attr("width", width).attr("height", height);
    theGroup.attr("clip-path", "url(#theNetworkGraphCP)");

    let contentGroup = theGroup.append("g");
    addArrowMarkers(contentGroup, linkTypes, linkTypeColor);
    let linkGroup = contentGroup.append("g");
    let nodeGroup = contentGroup.append("g");

    let linkElements = linkGroup.selectAll('.linkElements');
    let nodeElements = nodeGroup.selectAll('.nodeElements');
    let nodePosObj = {};
    setNodeRadius();
    updateNodesAndLinks(nodes, links);

    //Send the data for force calculation
    let nwForcePool = new WorkerPool("js/workers/worker_nwforce.js", onForceResult, 1);
    nwForcePool.startWorker({
        event: "start",
        nodes: nodes,
        links: links,
        width: width,
        height: height,
        sendTick: true
    }, 0);

    function onForceResult(e) {
        let result = e.data;
        nodes = result.nodes;
        links = result.links;
        updateNodesAndLinks(nodes, links);
        tick();

    }

    function updateNodesAndLinks(nodes, links) {
        nodes.forEach(n => {
            if (!nodePosObj[n.id]) nodePosObj[n.id] = {}
            nodePosObj[n.id].x = n.x;
            nodePosObj[n.id].y = n.y;
            nodePosObj[n.id].fx = n.fx;
            nodePosObj[n.id].fy = n.fy;
        });

        //Update the links
        linkElements = linkElements.data(links, d => d.id);

        //Exit any old links
        linkElements.exit().remove();

        //Enter any new links
        let enterLink = linkElements.enter().append('path').attr('class', "linkElements")
            .attr("marker-end", d => {
                if (d.source === d.target) {
                    return `url(#markerSelfLoop${linkTypes.indexOf(d.type)})`;
                }
                return `url(#marker${linkTypes.indexOf(d.type)})`;
            })
            .attr("stroke", d => linkTypeColor(d.type))
            .attr("stroke-width", d => linkStrokeWidthScale(d.dataCount));

        linkElements = enterLink.merge(linkElements);
        linkElements.on("mouseover", d => {
            onLinkMouseOverCallback(d);
        }).on("mouseout", d => {
            onLinkMouseOutCallback(d);
        });

        //Update the nodes
        nodeElements = nodeElements.data(nodes, d => d.id)
        //Exit
        nodeElements.exit().remove();
        //enter any new nodes
        let enterNode = nodeElements.enter().append("circle")
            .attr("class", "nodeElements")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => {
                return d.radius;
            })
            .style('fill', d => nodeTypeColor(d.id))
            // .call(d3.drag()
            //     .subject(dragsubject)
            //     .on("start", dragstarted)
            //     .on("drag", dragged)
            //     .on("end", dragended)
            // );
        nodeElements = enterNode.merge(nodeElements);
        nodeElements.on("mouseover", d => {
            showTip(`IP: "${d.id}", threats count: ${d.dataCount}, nodes count: ${d.nodeCount}`);
            onNodeMouseOverCallback(d);
        }).on("mouseout", (d) => {
            hideTip();
            onNodeMouseOutCallback(d);
        });
    }

    function arcPath(leftHand, d) {
        let x1 = leftHand ? d.source.x : d.target.x,
            y1 = leftHand ? d.source.y : d.target.y,
            x2 = (leftHand ? d.target.x : d.source.x),
            y2 = (leftHand ? d.target.y : d.source.y),
            dx = x2 - x1,
            dy = y2 - y1,
            dr = Math.sqrt(dx * dx + dy * dy),
            drx = dr,
            dry = dr,
            sweep = leftHand ? 0 : 1,
            siblingCount = countSiblingLinks(d.source, d.target),
            xRotation = 0,
            largeArc = 0;

        // Self edge.
        if (x1 === x2 && y1 === y2) {
            largeArc = 1;
            sweep = 1;

            drx = 2.5 * d.source.radius;
            dry = 2 * d.source.radius;

            x1 = x1 + 1;
            y1 = y1 + 1;
        }

        if (siblingCount > 1) {
            let siblings = getSiblingLinks(d.source, d.target);
            let arcScale = d3.scalePoint()
                .domain(siblings)
                .range([1, siblingCount]);
            drx = drx / (1 + (1 / siblingCount) * (arcScale(d['type']) - 1));
            dry = dry / (1 + (1 / siblingCount) * (arcScale(d['type']) - 1));
        }

        return "M" + x1 + "," + y1 + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + x2 + "," + y2;
    }

    function countSiblingLinks(source, target) {
        let count = 0;
        for (let i = 0; i < links.length; ++i) {
            let linkSourceId = links[i].source.id;
            let linkTargetId = links[i].target.id;
            if ((linkSourceId == source.id && linkTargetId == target.id) || (linkSourceId == target.id && linkTargetId == source.id))
                count++;
        }
        ;
        return count;
    };

    function getSiblingLinks(source, target) {
        let siblings = [];
        for (let i = 0; i < links.length; ++i) {
            let linkSourceId = links[i].source.id;
            let linkTargetId = links[i].target.id;
            if ((linkSourceId == source.id && linkTargetId == target.id) || (linkSourceId == target.id && linkTargetId == source.id))
                siblings.push(links[i]['type']);
        }
        return siblings;
    };

    function tick() {
        linkElements.attr("d", d => arcPath(true, d));
        nodeElements.attr("cx", d => d.x).attr("cy", d => d.y);
    }

    function end() {

    }

    // // <editor-fold desc="this section is for drag drop">
    // function dragsubject() {
    //     //This simulation is used for drag of the network only.
    //     simulation = d3.forceSimulation()
    //         .on("tick", tick);
    //     simulation.nodes(nodes)
    //         .force('link', d3.forceLink(links))
    //         .force("charge", d3.forceManyBody())
    //         .force("center", d3.forceCenter(width / 2, height / 2))
    //         .force("collide", d3.forceCollide(d => d.radius));
    //     return simulation.find(d3.event.x, d3.event.y);
    // }
    //
    // function dragstarted(d) {
    //     d.fx = d3.event.x;
    //     d.fy = d3.event.y;
    //     if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    // }
    //
    // function dragged(d) {
    //     d.fx = d3.event.x;
    //     d.fy = d3.event.y;
    // }
    //
    // function dragended(d) {
    //     d.fx = null;
    //     d.fy = null;
    //     simulation.alphaTarget(0);
    //
    // }
    //
    // //</editor-fold>

    function getNodeRadiusScale(nodes, minR, maxR) {
        let scale = d3.scalePow(2).domain(d3.extent(nodes.map(d => d.nodeCount))).range([minR, maxR]);
        return function (nodeCount) {
            return scale(nodeCount);
        }
    }

    function addArrowMarkers(mainG, markerData, markerColor) {
        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("id", d => 'marker' + markerData.indexOf(d))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "auto")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());

        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("id", d => 'markerSelfLoop' + markerData.indexOf(d))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "25deg")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());
    }

    //<editor-fold desc="This section is for handling the zoom and of the whole plot">
    //Handling drag
    let dragHandler = d3.drag()
        .on("start", dragStart)
        .on("drag", dragDrag)
        .on("end", dragEnd);

    dragHandler(contentGroup);

    function dragStart(d) {
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragDrag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragEnd(d) {
        d.fx = null;
        d.fy = null;
    }

    // //Handling zoom
    // let zoomHandler = d3.zoom()
    //     .on("zoom", zoomActions);
    //
    // zoomHandler(svg);
    //
    // function zoomActions() {
    //     contentGroup.attr("transform", d3.event.transform);
    // }
    //</editor-fold>

    function setNodeRadius() {
        //TODO: May move this to the worker to improve performance.
        nodeRadiusScale = getNodeRadiusScale(nodes, networkSettings.node.minRadius, networkSettings.node.maxRadius);
        nodes.forEach(n => {
            n.radius = nodeRadiusScale(n.nodeCount);
        });
    }
    //TODO: becareful with this => since it might be used as window object and override other fields.
    let self = this;
    this.onUpdateData = function (newNodes, newLinks) {
        //Should start from their current positions.
        newNodes.forEach(n => {
            if (nodePosObj[n.id]) {
                n.x = nodePosObj[n.id].x;
                n.y = nodePosObj[n.id].y;
                n.fx = nodePosObj[n.id].fx;
                n.fy = nodePosObj[n.id].fy;
            } else {
                //Put new nodes at the center by default.
                n.x = width / 2;
                n.y = height / 2;
            }
        });
        nodes = newNodes;
        links = newLinks;

        //Recalculate radius and stroke scale.
        setNodeRadius();
        linkStrokeWidthScale = getLinkStrokeWidthScale(links, nwMinStrokeWidth, nwMaxStrokeWidth);
        self.linkStrokeWidthScale = linkStrokeWidthScale;

        nwForcePool.postMessage({
            event: "start",
            nodes: nodes,
            links: links,
            width: width,
            height: height,
            sendTick: true
        }, 0);
    }
    return this;
}