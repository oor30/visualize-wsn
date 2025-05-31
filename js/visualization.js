// js/visualization.js
// Global 'g' is defined in config.js, global 'zoom' and 'initialTransform' in app.js
// Global 'coordinates', 'parents', 'round' are from app.js

function setupSVG() {
    g = svg.append("g"); // Assign to global 'g' from config.js

    const localZoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
            if(g) g.attr("transform", event.transform);
        });
    svg.call(localZoom);
    zoom = localZoom; // Assign to global zoom declared in app.js

    initialTransform = d3.zoomIdentity; // Initialize global initialTransform declared in app.js

    // Arrow marker will be added by loadAlgorithmData after g is potentially cleared.
}

function drawNetwork(roundIdx) {
    if (!g || !coordinates || !parents) {
        console.error("Cannot draw network: g, coordinates, or parents not initialized.");
        return;
    }
    // Clear only links, nodes, labels, not defs
    g.selectAll(".link, .node, .label").remove();

    if (roundIdx !== 0) {
        nodeInfoContent.html("Click a node to see details.");
    }

    const currentParents = parents[roundIdx];
    if (!currentParents) {
        console.warn(`No parent data for round index ${roundIdx}. Nodes will be drawn but may not link correctly.`);
    }

    const links = coordinates.slice(1).map((node) => {
        if (!currentParents || currentParents[node.id - 1] === undefined) {
            return null;
        }
        const parentId = +currentParents[node.id - 1];
        if (parentId === -1 || node.id === parentId || node.id === 0) return null;

        const targetNode = coordinates.find(n => n.id === parentId);
        if (!targetNode) {
            return { source: node, target: coordinates[0] };
        }
        return { source: node, target: targetNode };
    }).filter(d => d !== null);

    g.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
        .attr("marker-end", "url(#arrow)");

    g.selectAll(".node")
        .data(coordinates)
        .enter().append("circle")
        .style("fill", c => {
            if (c.id === 0) return "red";
            if (!currentParents || currentParents[c.id - 1] === undefined) return "grey";
            return c.id === currentParents[c.id - 1] ? "red" : "steelblue";
        })
        .attr("class", "node").attr("r", 10)
        .attr("cx", d => d.x).attr("cy", d => d.y)
        .on("click", function (event, d) {
            g.selectAll(".node").style("stroke", null).style("stroke-width", null);
            d3.select(this).style("stroke", "black").style("stroke-width", 3);

            let parentIdDisplay = "N/A";
            if (d.id === 0) {
                parentIdDisplay = "N/A (Sink Node)";
            } else if (currentParents && currentParents[d.id - 1] !== undefined) {
                const pNodeId = currentParents[d.id - 1];
                if (pNodeId === -1) parentIdDisplay = "N/A (No Parent)";
                else parentIdDisplay = pNodeId;
            } else {
                parentIdDisplay = "Data unavailable";
            }
            nodeInfoContent.html(`Node ID: ${d.id}<br>Parent ID (Round ${round}): ${parentIdDisplay}`); // round is global from app.js
        });

    g.selectAll(".label")
        .data(coordinates)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => d.x + 12).attr("y", d => d.y + 4)
        .text(d => d.id);
}
