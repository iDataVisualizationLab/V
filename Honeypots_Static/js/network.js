function drawNetworkGraph(theGroup, nodes, links, networkSettings) {
    let width = networkSettings.width, height = networkSettings.height, nodeTypeColor = networkSettings.nodeTypeColor,
        margin = networkSettings.margin,
        linkTypes = networkSettings.linkTypes, linkTypeColor = networkSettings.linkTypeColor,
        linkStrokeWidthScale = networkSettings.linkStrokeWidthScale,
        onNodeMouseOverCallback = networkSettings.onNodeMouseOverCallback,
        onLinkMouseOverCallback = networkSettings.onLinkMouseOverCallback,
        onNodeMouseOutCallback = networkSettings.onNodeMouseOutCallback,
        onLinkMouseOutCallback = networkSettings.onLinkMouseOutCallback;

    let nodeRadiusScale;
    //Add a clippath
    theGroup.append("defs").append("clipPath").attr("id", "theNetworkGraphCP").append("rect").attr("x", 0).attr("y", margin.top).attr("width", width).attr("height", height);
    theGroup.attr("clip-path", "url(#theNetworkGraphCP)");

    let contentGroup = theGroup.append("g");
    addArrowMarkers(contentGroup, linkTypes, linkTypeColor);
    //TODO: May move this to the worker to improve performance.
    nodeRadiusScale = getNodeRadiusScale(nodes, networkSettings.node.minRadius, networkSettings.node.maxRadius);
    nodes.forEach(n => {
        n.radius = nodeRadiusScale(n.dataCount);
    });
    let linkElements = contentGroup.selectAll('.linkElements');
    let nodeElements = contentGroup.selectAll('.nodeElements');

    function updateNodesAndLinks(nodes, links) {

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
                return nodeRadiusScale(d.nodeCount);
            })
            .style('fill', d => nodeTypeColor(d.id))
            .call(d3.drag()
                .subject(dragsubject)
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );
        nodeElements = enterNode.merge(nodeElements);
        nodeElements.on("mouseover", d => {
            showTip(`IP: "${d.id}", threats count: ${d.dataCount}, nodes count: ${d.nodeCount}`);
            onNodeMouseOverCallback(d);
        }).on("mouseout", (d) => {
            hideTip();
            onNodeMouseOutCallback(d);
        });
    }

    updateNodesAndLinks(nodes, links);

    let simulation = d3.forceSimulation()
        .on("end", end)
        .on("tick", tick);
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(d => d.radius));


    function arcPath(leftHand, d) {
        let x1 = leftHand ? d.source.x : d.target.x,
            y1 = leftHand ? d.source.y : d.target.y,
            x2 = leftHand ? d.target.x : d.source.x,
            y2 = leftHand ? d.target.y : d.source.y,
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
        let xExtent = d3.extent(nodes.map(d => d.x));
        let yExtent = d3.extent(nodes.map(d => d.y));
        let xSize = xExtent[1] - xExtent[0];
        let ySize = yExtent[1] - yExtent[0];
        let scaleX = (width - 2 * networkSettings.node.maxRadius - 20) / xSize,
            scaleY = (height - 2 * networkSettings.node.maxRadius - 20) / ySize;
        //Scale only if they are smaller than 1
        if (scaleX < 1 || scaleY < 1) {
            contentGroup.attr("transform", `scale(${scaleX}, ${scaleY})translate(${xSize / 2 - scaleX * xSize / 2}, ${ySize / 2 - scaleY * ySize / 2 + margin.top})`);
        }
    }

    // <editor-fold desc="this section is for drag drop">
    function dragsubject() {
        //This simulation is used for drag of the network only.
        simulation = d3.forceSimulation()
            .on("tick", tick);
        simulation.nodes(nodes)
            .force('link', d3.forceLink(links))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(d => d.radius));
        return simulation.find(d3.event.x, d3.event.y);
    }

    function dragstarted(d) {
        let node = nodes.find(n => n.id === d.id);
        node.fx = d3.event.x;
        node.fy = d3.event.y;
        if (!d3.event.active) simulation.alphaTarget(0.1).restart();

    }

    function dragged(d) {
        let node = nodes.find(n => n.id === d.id);
        node.fx = d3.event.x;
        node.fy = d3.event.y;
    }

    function dragended(d) {
        let node = nodes.find(n => n.id === d.id);
        node.fx = null;
        node.fy = null;
        simulation.alphaTarget(0);

    }

    //</editor-fold>

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
            .attr("refX", 20)
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
            .attr("refX", 20)
            .attr("refY", 1)
            .attr("markerWidth", 3)
            .attr("markerHeight", 3)
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

    function boundX(x) {
        let graphNodeDiameter = 2 * networkSettings.node.maxRadius;
        return (x > width - graphNodeDiameter) ? width - graphNodeDiameter : (x < graphNodeDiameter ? graphNodeDiameter : x);
    }

    function boundY(y) {
        let graphNodeDiameter = 2 * networkSettings.node.maxRadius;
        return (y > height - graphNodeDiameter) ? height - graphNodeDiameter : (y < graphNodeDiameter ? graphNodeDiameter : y);
    }

    //</editor-fold>
}
