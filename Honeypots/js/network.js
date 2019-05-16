function drawNetworkGraph(theGroup, nodes, links, networkSettings) {
    let width = networkSettings.width, height=networkSettings.height, nodeTypeColor = networkSettings.nodeTypeColor,linkTypes = networkSettings.linkTypes, linkTypeColor = networkSettings.linkTypeColor, linkStrokeWidthScale= networkSettings.linkStrokeWidthScale, onNodeMouseOverCallback = networkSettings.onNodeMouseOverCallback, onLinkMouseOverCallback = networkSettings.onLinkMouseOverCallback, onNodeMouseOutCallback = networkSettings.onNodeMouseOutCallback, onLinkMouseOutCallback = networkSettings.onLinkMouseOutCallback;
    let linkElements = theGroup.selectAll('.linkElements'),
        nodeElements = theGroup.selectAll('.nodeElements');
    let nodeRadiusScale;

    addArrowMarkers(theGroup, linkTypes, linkTypeColor);
    nodeRadiusScale = getNodeRadiusScale(nodes, networkSettings.node.minRadius, networkSettings.node.maxRadius);
    //Calculate the node's radius
    nodes.forEach(n => {
        n.radius = nodeRadiusScale(n.dataCount);
    });

    let simulation = d3.forceSimulation()
        .on('tick', tick);

    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2)).restart()
        .force("collide", d3.forceCollide(d => d.radius));

    //Update the links
    linkElements = linkElements.data(links, d => d.index);

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
            return nodeRadiusScale(d.dataCount);
        })
        .style('fill', d=>nodeTypeColor(d.id))
        .call(d3.drag()
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
    nodeElements = enterNode.merge(nodeElements);
    nodeElements.on("mouseover", d => {
        showTip(`IP: "${d.id}", threats count: ${d.dataCount}`);
        onNodeMouseOverCallback(d);
    }).on("mouseout", (d) => {
        hideTip();
        onNodeMouseOutCallback(d);
    });

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
            if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                count++;
        }
        ;
        return count;
    };

    function getSiblingLinks(source, target) {
        let siblings = [];
        for (let i = 0; i < links.length; ++i) {
            if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                siblings.push(links[i]['type']);
        }
        return siblings;
    };

    function tick() {
        linkElements.attr("d", d => arcPath(true, d));
        nodeElements.attr("cx", d => d.x).attr("cy", d => d.y);
    }

    //<editor-fold desc="this section is for drag drop">
    function dragsubject() {
        return simulation.find(d3.event.x, d3.event.y);
    }

    function dragstarted() {
        if (!d3.event.active) simulation.alphaTarget(0.1).restart();
        d3.event.subject.fx = d3.event.subject.x;
        d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
        d3.event.subject.fx = d3.event.x;
        d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
        if (!d3.event.active) simulation.alphaTarget(0);
        d3.event.subject.fx = null;
        d3.event.subject.fy = null;
    }

    //</editor-fold>

    function getNodeRadiusScale(nodes, minR, maxR) {
        let scale = d3.scalePow(2).domain(d3.extent(nodes.map(d => d.dataCount))).range([minR, maxR]);
        return function (dataCount) {
            return scale(dataCount);
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
            .attr("fill", d=>d3.color(markerColor(d)).darker());

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
            .attr("fill",  d=>d3.color(markerColor(d)).darker());
    }
}