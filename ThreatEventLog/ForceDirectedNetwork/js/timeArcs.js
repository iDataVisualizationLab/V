const timeArcSettings = {
    textHeight: 15
};

function drawTimeArc(theGroup, width, height, nodes, links, deviceActions, deviceActionColor, linkStrokeWidthScale) {
    let linkElements = theGroup.selectAll('.tALinkElements'),
        nodeElements = theGroup.selectAll('.tAnodeElements');

    //Generate the best vertical location
    let simulation = d3.forceSimulation()
        .on('tick', tick)
        .on('end', endedCalculatingY);
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide(timeArcSettings.textHeight))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2));
    nodeElements = nodeElements.data(nodes, d => d.id);
    //Exit
    nodeElements.exit().remove();
    //enter any new nodes
    let enterNode = nodeElements.enter()
        .append('text').text(d => d.id)
        .attr("transform", "translate(10)")
        .attr("text-anchor", 'start')
        .attr("alignment-baseline", 'middle')
        .style('fill', nodeColor)

    nodeElements = enterNode.merge(nodeElements);

    function tick(duration) {
        if (duration) {
            nodeElements.transition().duration(duration).attr("x", d => d.x).attr("y", d => d.y);
        } else {
            nodeElements.attr("x", d => d.x).attr("y", d => d.y);
        }
    }

    function endedCalculatingY() {
        // let yScale = d3.scaleLinear().domain(d3.extent(nodes.map(n => n.y))).range([0, height]);
        let yScale = d3.scaleLinear().domain([0, nodes.length]).range([0, height]);
        //Sort the nodes by its x location
        nodes.sort((a, b) => a.x - b.x);
        //Change all the y location
        nodes.forEach((n, i) => {
            n.y = yScale(i);
        });
        let xScale = d3.scaleTime().domain(d3.extent(links.map(l => l[COL_END_TIME]))).range([0, width]);
        let nestedByNode = {};
        //initialize the object
        nodes.forEach(n => {
            nestedByNode[n.id] = [];
        });
        links.forEach(l => {
            nestedByNode[l.source.id].push(l);
            nestedByNode[l.target.id].push(l);
        });
        //Calculate the location for each node as its min time (first time appear)
        nodes.forEach(n => {
            let eventTimes = nestedByNode[n.id].map(l => l[COL_END_TIME]);
            n.x = xScale(d3.max(eventTimes));
            n.minX = xScale(d3.min(eventTimes));
        });
        debugger
        //Transform all the nodes.
        tick(1000);
        //Draw the node line
        let nodeLines = theGroup.selectAll('.tANodeLines').data(nodes);
        let enterNodeLines = nodeLines.enter()
            .append('line')
            .attr("x1", d => d.x)
            .attr("x2", d => d.minX)
            .attr("y1", d => d.y)
            .attr("y2", d => d.y)
            .attr('stroke-width', 1)
            .attr('stroke', nodeColor);
        nodeLines.exit().remove();
        nodeLines = enterNodeLines.merge(nodeLines);

        //Now draw the arcs.
        //Update the links
        linkElements = linkElements.data(links, d => d.index);

        //Exit any old links
        linkElements.exit().remove();

        //Enter any new links
        let enterLink = linkElements.enter().append('path').attr('class', "tALinkElements")
            .attr("marker-end", d => {
                if (d.source === d.target) {
                    return `url(#markerSelfLoop)`
                }
                return `url(#marker${deviceActions.indexOf(d[COL_DEVICE_ACTION])})`
            })
            .attr("stroke", d => deviceActionColor(d[COL_DEVICE_ACTION]))
            .attr("stroke-width", d => linkStrokeWidthScale(d.threatCount));

        linkElements = enterLink.merge(linkElements);
        //Update position
        // linkElements.attr("d", d => arcPath(true, d));

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
                drx = drx / (1 + (1 / siblingCount) * (arcScale(d[COL_DEVICE_ACTION]) - 1));
                dry = dry / (1 + (1 / siblingCount) * (arcScale(d[COL_DEVICE_ACTION]) - 1));
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
                    siblings.push(links[i][COL_DEVICE_ACTION]);
            }
            return siblings;
        };

    }
}
