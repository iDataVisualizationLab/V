function drawTimeArc(theGroup, nodes, links, timeArcSettings) {
    //Expected settings from timeArcSettings.
    let width = timeArcSettings.width, height = timeArcSettings.height,
        linkTypes = timeArcSettings.linkTypes,
        linkTypeColor = timeArcSettings.linkTypeColor, linkStrokeWidthScale = timeArcSettings.linkStrokeWidthScale,
        nodeColor = timeArcSettings.nodeTypeColor,
        onNodeMouseOverCallBack = timeArcSettings.onNodeMouseOverCallBack,
        onLinkMouseOverCallBack = timeArcSettings.onLinkMouseOverCallBack,
        orderFunction = timeArcSettings.orderFunction;

    addArrowMarkers(theGroup, linkTypes, linkTypeColor);

    let contentGroup = theGroup.selectAll('.contentGroup').data([1], d => d).join('g').attr("class", "contentGroup").attr("transform", `translate(0, ${margin.top})`);
    let linksGroup = contentGroup.selectAll(".linksGroup").data([1], d => d).join('g').attr("class", "linksGroup");
    let nodeLinesGroup = contentGroup.selectAll(".nodeLinesGroup").data([1], d => d).join('g').attr("class", "nodeLinesGroup");
    let textsGroup = contentGroup.selectAll(".textsGroup").data([1], d => d).join('g').attr("class", "textsGroup");
    let linkElements = linksGroup.selectAll('.tALinkElements'),
        nodeElements = textsGroup.selectAll('.tANodeElements');

    //Do the ordering.
    // orderFunction(nodes, links, tick, endedCalculatingY, timeArcSettings);
    let taForcePool = new WorkerPool("js/workers/worker_taforce.js", onForceResult, 1);
    taForcePool.startWorker({
        event: "start",
        nodes: nodes,
        links: links,
        width: width,
        height: height,
        sendTick: false
    }, 0);
    function onForceResult(e) {
        let result = e.data;
        nodes = result.nodes;
        links = result.links;
        endedCalculatingY();
    }

    function updateNodes(nodes) {
        nodeElements = nodeElements.data(nodes, d => d.id);
        //Exit
        nodeElements.exit().remove();
        //enter any new nodes
        let enterNodes = nodeElements.enter()
            .append('text').text(d => {
                if (d.id !== 'combined') {
                    return d.id;
                } else {
                    return `${d.nodes.map(d => d.id).join(', ')}`;
                }
            })
            .attr('opacity', 0).attr("x", d => d.x).attr("y", d => d.y)
            .classed('tANodeElements', true)
            .classed('tANodeTexts', true)
            .attr("transform", "translate(20, 0)")
            .attr("text-anchor", 'start')
            .attr("alignment-baseline", 'middle')
            .style('font-size', '11px')
            .style('fill', d => nodeColor(d.id));

        enterNodes.transition().duration(timeArcTransitionDuration).attr("opacity", 1.0).end().then(()=>{
            nodeElements.transition().duration(timeArcTransitionDuration).attr("x", d => d.x).attr("y", d => d.y);
        });

        nodeElements = enterNodes.merge(nodeElements);
    }

    function endedCalculatingY() {

        let yScale = d3.scaleLinear().domain([0, nodes.length]).range([0, height]);
        //Sort the nodes by its y location
        nodes.sort((a, b) => a.y - b.y);
        //Change all the y location
        nodes.forEach((n, i) => {
            n.y = yScale(i);
        });
        let xScale = d3.scaleTime().domain(d3.extent(links.map(l => l['time']))).range([0, width]);
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
            let eventTimes = nestedByNode[n.id].map(l => l['time']);
            n.x = xScale(d3.max(eventTimes));
            n.minX = xScale(d3.min(eventTimes));

        });

        updateNodes(nodes);

        //Transform all the nodes.

        setTimeout(() => {
            //Now add mouseover event for the nodes, should do it here since when it is on force calculation we shouldn't activate this otherwise it would lead to wrong location.
            nodeElements.on('mouseover', function (d) {
                //TODO: Should check if there is some active event
                d3.select(this).raise();
                brushTimeArcNode(d, timeArcSettings.transition.duration);
                //Call also mouseover to connect with other views.
                onNodeMouseOverCallBack(d);
            });
            nodeElements.on('mouseout', function (d) {
                //TODO: Should check if there is some active event
                d3.select(this).attr("stroke", "none");
                resetBrushing(timeArcSettings.transition.duration);
            });
        }, 2000);
        //Draw the node line
        let nodeLines = nodeLinesGroup.selectAll('.tANodeLines').data(nodes, n => n.id);
        let enterNodeLines = nodeLines.enter()
            .append('line')
            .classed('tANodeElements', true)
            .classed('tANodeLines', true);
        nodeLines.exit().remove();
        nodeLines = enterNodeLines.merge(nodeLines).attr("x1", d => d.x)
            .attr("x2", d => d.minX)
            .attr("y1", d => d.y)
            .attr("y2", d => d.y)
            .attr('stroke-width', d => {
                if (d.id !== 'combined') {
                    return 1;
                } else {
                    return 2;
                }
            })
            .attr('stroke', d => nodeColor(d.id));

        //Now draw the arcs.
        //Update the links
        linkElements = linksGroup.selectAll('.tALinkElements').data(links, d => d.id);

        //Exit any old links
        linkElements.exit().remove();

        //Enter any new links
        let enterLink = linkElements.enter().append('path').attr('class', "tALinkElements")
            .attr("marker-end", d => {

                if (d.source === d.target) {
                    return `url(#markerSelfLoopTA${d['type']})`;
                }
                return `url(#markerTA${d['type']})`;
            })
            .attr("stroke", d => linkTypeColor(d['type']))
            .attr("stroke-width", d => linkStrokeWidthScale(d.dataCount));

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
                    return `${xScale(theLink['time'])}`;
                } else {
                    return d.x;
                }
            });
            //Send this event outside
            onLinkMouseOverCallBack(theLink);
        }).on("mouseout", function (theLink) {
            //Move the text of this node to its location
            d3.selectAll('.tANodeTexts').transition().duration(timeArcSettings.transition.duration).attr("x", function (d) {
                return d.x;
            });
            setTimeout(() => {
                //Reset brushing only after they were brought back to their locations to avoid conflict of transitions.
                resetBrushing();
            }, timeArcSettings.transition.duration + 1);
        });

        let xAxisG = theGroup.selectAll('.xAxis');
        let xAxis = d3.axisTop(xScale);
        if (xAxisG.empty()) {
            xAxisG = theGroup.selectAll('.xAxis').data([1]).join('g').attr("class", "xAxis");
        }
        xAxisG.transition().duration(timeArcTransitionDuration).call(xAxis);


        //Raise the two group
        nodeLines.raise();
        d3.selectAll('.tANodeTexts').raise();

        function arcPath(leftHand, d) {
            let x1 = xScale(d['time']),
                x2 = x1,
                y1 = leftHand ? d.source.y : d.target.y,
                y2 = leftHand ? d.target.y : d.source.y,
                dx = x2 - x1,
                dy = y2 - y1,
                dr = Math.sqrt(dx * dx + dy * dy),
                drx = dr,
                dry = dr,
                sweep = y1 < y2 ? 0 : 1,
                siblingCount = countSiblingLinks(d),
                xRotation = 0,
                largeArc = 0;
            // Self edge.
            if (x1 === x2 && y1 === y2) {
                largeArc = 1;
                sweep = 1;
                drx = 4;
                dry = 4;
                x1 = x1;
                y1 = y1 - 1;
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

        function countSiblingLinks(theLink) {
            let source = theLink.source;
            let target = theLink.target;
            let count = 0;
            for (let i = 0; i < links.length; ++i) {
                if ((links[i].source.id == source.id && links[i].target.id == target.id) && links[i]['time'] === theLink['time'])
                    count++;
            }
            return count;
        }

        function getSiblingLinks(source, target) {
            let siblings = [];
            for (let i = 0; i < links.length; ++i) {
                if ((links[i].source.id == source.id && links[i].target.id == target.id) || (links[i].source.id == target.id && links[i].target.id == source.id))
                    siblings.push(links[i]['type']);
            }
            return siblings;
        };
    }

    function tick() {

    }

    //<editor-fold desc="This section is for the arrow marker">
    function addArrowMarkers(mainG, markerData, markerColor) {
        let markerTADefs = mainG.selectAll('.markerTADefs').data([1], d => d).join("defs").attr('class', 'markerTADefs');
        markerTADefs.selectAll(".markerTA")
            .data(markerData, d => d).join("marker")
            .attr("class", "markerTA")
            .attr("id", d => 'markerTA' + d)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "auto")
            .attr('xoverflow', 'visible')
            .selectAll("path").data(d => [d], d => d).join("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());

        let markerSelfLoopTADefs = mainG.selectAll('.markerSelfLoopTADefs').data([1], d => d).join("defs").attr("class", "markerSelfLoopTADefs");

        markerSelfLoopTADefs.selectAll(".markerSelfLoopTA")
            .data(markerData, d => d).join("marker")
            .attr("class", 'markerSelfLoopTA')
            .attr("id", d => 'markerSelfLoopTA' + d)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr('markerUnits', "strokeWidth")
            .attr("orient", "-130deg")
            .attr('xoverflow', 'visible')
            .selectAll("path").data(d => [d], d => d).join("path")
            .attr('d', 'M0,-5L10,0L0,5')
            .attr("fill", d => d3.color(markerColor(d)).darker());
    }

    //</editor-fold>

    function onUpdateTAData(newNodes, newLinks){
        nodes = newNodes;
        links = newLinks;
        taForcePool.postMessage({
            event: "start",
            nodes: nodes,
            links: links,
            width: width,
            height: height,
            sendTick: false
        }, 0);
    }
    this.onUpdateTAData = onUpdateTAData;
    return this;
}

function forceDirectedLayout(nodes, links, tick, end, timeArcSettings) {
    //Generate the best vertical location
    let simulation = d3.forceSimulation()
    // .on('tick', tick)
        .on('end', end);
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide(timeArcSettings.textHeight))
        .force("center", d3.forceCenter(timeArcSettings.width / 2, timeArcSettings.height / 2))
        .force("x", d3.forceX(timeArcSettings.width / 2).strength(1))
        .alphaMin(0.001);
}

function brushTimeArcNode(node, duration) {
    //Brush node text and node line
    d3.selectAll('.tANodeElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(duration).attr("opacity", d => {
            if (d.id === node.id) {
                return 1;
            } else {
                return 0.1
            }
        });
    });
    //Brush its connected links
    let relatedLinks = brushTimeArcLinksOfNodes(node);
    brushRelatedTimeArcNodes(relatedLinks, duration);
}

function brushRelatedTimeArcNodes(relatedLinks, duration) {
    let relatedNodes = [];
    relatedLinks.forEach(l => {
        relatedNodes.push(l.source);
        relatedNodes.push(l.target);
    });
    brushTimeArcNodes(relatedNodes, duration);
}

function brushTimeArcNodes(nodes, duration) {
    let allNodeIds = nodes.map(n => n.id);
    d3.selectAll('.tANodeElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(duration).attr("opacity", d => {
            if (allNodeIds.indexOf(d.id) >= 0) {
                return 1;
            } else {
                return 0.1
            }
        });
    });
}

function brushTimeArcLink(link, duration) {
    //Join the three properties, source, target, type and compare
    d3.selectAll('.tALinkElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(duration).attr("opacity", d => {
            if (combineProp(d) === combineProp(link)) {
                return 1.0;
            } else {
                return 0.1;
            }
        });
    });
    //brush the related nodes
    brushTimeArcNodes([link.source, link.target], duration);

    function combineProp(d) {
        return `${d.source.id},${d.target.id},${d['type']}`;
    }
}

function brushTimeArcLinksOfNodes(node, duration) {
    let relatedLinks = [];
    d3.selectAll('.tALinkElements').each(function () {
        let sel = d3.select(this);
        sel.transition().duration(duration).attr("opacity", d => {
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

function resetBrushing(duration) {
    if (!keep) {
        //Reset nodes
        d3.selectAll('.tANodeElements').transition().duration(duration).attr("opacity", 1.0);
        //Reset all links
        d3.selectAll('.tALinkElements').transition().duration(duration).attr("opacity", 1.0);
        //Also clear the table.
        updateTable(ipdatacsvTbl, []);
    }
}