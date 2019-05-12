const timeArcSettings = {
    textHeight: 15,
    transition: {
        duration: 500
    }
};

function brushTimeArcNode(node) {
    //Brush node text and node line
    d3.selectAll('.tANodeElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(timeArcSettings.transition.duration).attr("opacity", d => {
            if (d.id === node.id) {
                return 1;
            } else {
                return 0.1
            }
        });
    });
    //Find the connected nodes and brush them
    //Find the connected links and brush them
    //Brush its connected link
    let relatedLinks = brushTimeArcLinksOfNodes(node);
    brushRelatedTimeArcNodes(relatedLinks);
}

function brushRelatedTimeArcNodes(relatedLinks) {
    let relatedNodes = [];
    relatedLinks.forEach(l => {
        relatedNodes.push(l.source);
        relatedNodes.push(l.target);
    });
    brushTimeArcNodes(relatedNodes);
}

function brushTimeArcNodes(nodes) {
    let allNodeIds = nodes.map(n => n.id);
    d3.selectAll('.tANodeElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(timeArcSettings.transition.duration).attr("opacity", d => {
            if (allNodeIds.indexOf(d.id) >= 0) {
                return 1;
            } else {
                return 0.1
            }
        });
    });
}

function brushTimeArcLink(link) {
    //Join the three properties, source, target, type and compare
    d3.selectAll('.tALinkElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(timeArcSettings.transition.duration).attr("opacity", d => {
            if (combineProp(d) === combineProp(link)) {
                return 1.0;
            } else {
                return 0.1;
            }
        });
    });
    //brush the related nodes
    brushTimeArcNodes([link.source, link.target]);

    function combineProp(d) {
        return `${d.source.id},${d.target.id},${d[COL_DEVICE_ACTION]}`;
    }
}

function brushTimeArcLinksOfNodes(node) {
    let relatedLinks = [];
    d3.selectAll('.tALinkElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(timeArcSettings.transition.duration).attr("opacity", d => {
            if (d.source.id === node.id || d.target.id === node.id) {
                relatedLinks.push(d);
                return 1.0;
            } else {
                return 0.1;
            }
        });
    });
    return relatedLinks;//Return these to brush later.
}

function drawTimeArc(theGroup, width, height, nodes, links, deviceActions, deviceActionColor, linkStrokeWidthScale, onNodeMouseOverCallBack, onTimeArcLinkMouseOverCallBack) {
    addArrowMarkers(theGroup, deviceActions, deviceActionColor);
    let contentGroup = theGroup.append('g').attr("transform", `translate(0, ${margin.top})`);
    let linksGroup = contentGroup.append('g');
    let nodeLinesGroup = contentGroup.append('g');
    let textsGroup = contentGroup.append('g');
    let linkElements = linksGroup.selectAll('.tALinkElements'),
        nodeElements = textsGroup.selectAll('.tANodeElements');
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
        .attr("class", 'tANodeElements tANodeTexts')
        .attr("transform", "translate(16, 0)")
        .attr("text-anchor", 'start')
        .attr("alignment-baseline", 'middle')
        .style('fill', nodeColor);

    nodeElements = enterNode.merge(nodeElements);
    nodeElements.on('mouseover', d => {
        brushTimeArcNode(d);
        //Call also mouseover to connect with other views.
        onNodeMouseOverCallBack(d);
    });

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
            //Update the nodes y position
        });

        //Transform all the nodes.
        tick(1000);
        //Draw the node line
        let nodeLines = nodeLinesGroup.selectAll('.tANodeLines').data(nodes);
        let enterNodeLines = nodeLines.enter()
            .append('line')
            .attr("class", 'tANodeElements tANodeLines')
            .attr("x1", d => d.x)
            .attr("x2", d => d.minX)
            .attr("y1", d => d.y)
            .attr("y2", d => d.y)
            .attr('stroke-width', 1)
            .attr('stroke', 'black');
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
                    return `url(#markerSelfLoopTA)`
                }
                return `url(#markerTA${deviceActions.indexOf(d[COL_DEVICE_ACTION])})`
            })
            .attr("stroke", d => deviceActionColor(d[COL_DEVICE_ACTION]))
            .attr("stroke-width", d => linkStrokeWidthScale(d.threatCount));

        linkElements = enterLink.merge(linkElements);

        //Update position
        linkElements.attr("d", d => arcPath(true, d));

        //Add brushing
        linkElements.on("mouseover", function (theLink) {
            //Brush the link
            d3.selectAll('.tALinkElements').attr("opacity", d => {
                if (d !== theLink) {
                    return 0.1;
                } else {
                    return 1.0;
                }
            });
            //Brush the related nodes
            d3.selectAll('.tANodeElements').attr("opacity", function (d) {
                if (d === theLink.source || d === theLink.target) {
                    return 1.0;
                } else {
                    return 0.1;
                }
            });
            //Bring the text to its location
            d3.selectAll('.tANodeTexts').transition().duration(timeArcSettings.transition.duration).attr("x", function (d) {
                if (d === theLink.source || d === theLink.target) {
                    return `${xScale(theLink[COL_END_TIME])}`;
                } else {
                    return d.x;
                }
            });
            //Send this event outside
            onTimeArcLinkMouseOverCallBack(theLink);
        }).on("mouseout", function (theLink) {
            //Move the text of this node to its location
            d3.selectAll('.tANodeTexts').transition().duration(timeArcSettings.transition.duration).attr("x", function (d) {
                return d.x;
            });
        });

        //Draw the xAxis
        let xAxisG = theGroup.append('g');
        let xAxis = d3.axisTop(xScale);
        xAxisG.call(xAxis);

        //Raise the two group
        nodeLines.raise();
        d3.selectAll('.tANodeTexts').raise();

        function arcPath(leftHand, d) {
            let x1 = xScale(d[COL_END_TIME]),
                x2 = x1,
                y1 = leftHand ? d.source.y : d.target.y,
                y2 = leftHand ? d.target.y : d.source.y,
                dx = x2 - x1,
                dy = y2 - y1,
                dr = Math.sqrt(dx * dx + dy * dy),
                drx = dr,
                dry = dr,
                sweep = leftHand ? 0 : 1,
                siblingCount = countSiblingLinks(d),
                xRotation = 0,
                largeArc = 0;

            // Self edge.
            if (x1 === x2 && y1 === y2) {
                largeArc = 1;
                sweep = 0;

                drx = 10;
                dry = 8;

                x1 = x1 + 1;
                y1 = y1 + 1;
            }
            if (siblingCount > 1) {
                debugger
                let siblings = getSiblingLinks(d.source, d.target);
                let arcScale = d3.scalePoint()
                    .domain(siblings)
                    .range([1, siblingCount]);
                drx = drx / (1 + (1 / siblingCount) * (arcScale(d[COL_DEVICE_ACTION]) - 1));
                dry = dry / (1 + (1 / siblingCount) * (arcScale(d[COL_DEVICE_ACTION]) - 1));
            }

            return "M" + x1 + "," + y1 + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + x2 + "," + y2;
        }

        function countSiblingLinks(theLink) {
            let source = theLink.source;
            let target = theLink.target;
            let count = 0;
            for (let i = 0; i < links.length; ++i) {
                if ((links[i].source.id == source.id && links[i].target.id == target.id) && links[i][COL_END_TIME] === theLink[COL_END_TIME])
                    count++;
            }
            return count;
        }

        function getSiblingLinks(source, target) {
            let siblings = [];
            for (let i = 0; i < links.length; ++i) {
                if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                    siblings.push(links[i][COL_DEVICE_ACTION]);
            }
            return siblings;
        };
    }

    //<editor-fold desc="This section is for the arrow marker">
    function addArrowMarkers(mainG, markerData, markerColor) {
        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("class", "markerTA")
            .attr("id", d => 'markerTA' + markerData.indexOf(d))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 3)
            .attr("markerHeight", 3)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "auto")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", markerColor(d => d));

        mainG.append("defs").selectAll("marker")
            .data(markerData)
            .enter().append("marker")
            .attr("id", () => 'markerSelfLoopTA')
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 3)
            .attr("markerHeight", 3)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "auto")
            .attr('xoverflow', 'visible')
            .append("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", markerColor(d => d));
    }

    //</editor-fold>
}