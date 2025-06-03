// js/data_loader.js
// Uses global 'g', 'playButton', 'interval', 'roundSlider', 'roundInfo', 'round',
// 'errorMessageDiv', 'algorithmNameSpan', 'coordinates', 'parents', 'svg', 'zoom',
// 'initialTransform', 'nodeInfoContent', 'drawNetwork'.

function ensureMarkerDefinitions() {
    if (!g) return;
    let defs = g.select("defs");
    if (defs.empty()) {
        defs = g.append("defs");
    }
    if (defs.select("#arrow").empty()) {
        defs.append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15).attr("refY", 0)
            .attr("markerWidth", 6).attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class", "arrow");
    }
}

function loadAlgorithmData(algorithmName) {
    if (g) {
      g.selectAll(".link, .node, .label").remove(); // Clear drawn elements, keep defs
    }
    ensureMarkerDefinitions(); // Ensure markers are there
    nodeInfoContent.html("Click a node to see details.");

    playButton.text("▶️ 再生").attr("disabled", null);
    if (interval) clearInterval(interval);
    interval = null; // interval is global from app.js
    roundSlider.attr("disabled", false).property("value", 1);
    roundInfo.text("Round: 1");
    round = 1; // round is global from app.js

    const coordinatesPath = `algorithm/${algorithmName}/coordinates.csv`;
    const parentPath = `algorithm/${algorithmName}/parent.csv`;

    Promise.all([
        d3.csv(coordinatesPath, d3.autoType),
        d3.csv(parentPath, d3.autoType)
    ]).then(([coordData, parentData]) => {
        errorMessageDiv.text("");
        algorithmNameSpan.text(algorithmName);

        coordinates = coordData.map((d, i) => ({ id: i, x: d.x * 10 + 100, y: d.y * 10 + 100 })); // coordinates is global
        parents = parentData.map(row => Object.values(row)); // parents is global

        console.log(`Loaded data for ${algorithmName}:`, { coordinates, parents });
        playButton.attr("disabled", null);

        roundSlider.attr("min", 1).attr("max", parents.length || 1).attr("value", 1);

        const xExtent = d3.extent(coordinates, d => d.x);
        const yExtent = d3.extent(coordinates, d => d.y);
        const dataWidth = xExtent[1] - xExtent[0];
        const dataHeight = yExtent[1] - yExtent[0];

        const effectiveWidth = dataWidth > 0 ? dataWidth : window.innerWidth;
        const effectiveHeight = dataHeight > 0 ? dataHeight : window.innerHeight;

        const scale = Math.min(
            (window.innerWidth - 100) / effectiveWidth,
            (window.innerHeight - 100) / effectiveHeight,
            1
        );

        const translateX = (window.innerWidth - effectiveWidth * scale) / 2 - (dataWidth > 0 ? xExtent[0] * scale : 0) ;
        const translateY = (window.innerHeight - effectiveHeight * scale) / 2 - (dataHeight > 0 ? yExtent[0] * scale : 0);

        const calculatedTransform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
        // svg & zoom are global (from config.js & app.js respectively)
        svg.call(zoom.transform, calculatedTransform);

        drawNetwork(0); // from visualization.js
        roundInfo.text("Round: 1");
    }).catch(error => {
        console.error(`Error loading data for ${algorithmName}:`, error);
        errorMessageDiv.text(`Error loading data for ${algorithmName}. Check files and console.`);
        algorithmNameSpan.text("None");
        playButton.attr("disabled", true);
        roundSlider.attr("disabled", true);
        if (g) g.selectAll(".link, .node, .label").remove(); // Clear drawn elements
        coordinates = []; parents = []; // Clear data
    });
}
