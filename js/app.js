const width = 1200, height = 1200;
const svg = d3.select("svg");

// ズーム機能の設定
const zoom = d3.zoom()
	.scaleExtent([0.1, 10])
	.on("zoom", (event) => {
	g.attr("transform", event.transform);
	});

// グループ要素を作成（ズーム対象）
const g = svg.append("g");

// ズーム可能な領域を設定
svg.call(zoom);

// 矢印マーカー追加
g.append("defs").append("marker")
	.attr("id", "arrow")
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 15)
	.attr("refY", 0)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("path")
	.attr("d", "M0,-5L10,0L0,5")
	.attr("class", "arrow");

let coordinates = [];
let parents = [];
let round = 1;
let interval = null;
const availableAlgorithms = ['_default']; // This will be populated dynamically later
const algorithmSelect = d3.select("#algorithm-select");
const algorithmNameSpan = d3.select("#algorithm-name");
const errorMessageDiv = d3.select("#error-message");
const playButton = d3.select("#play");
const roundSlider = d3.select("#round-slider");
const roundInfo = d3.select("#round-info");
const nodeInfoContent = d3.select("#node-info-content");

function loadAlgorithmData(algorithmName) {
	// Clear existing network visualization
	g.selectAll(".link").remove();
	g.selectAll(".node").remove();
	g.selectAll(".label").remove();
	nodeInfoContent.html("Click a node to see details."); // Reset node info

	// Reset UI elements
	playButton.text("▶️ 再生").attr("disabled", false);
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
	roundSlider.attr("disabled", false).property("value", 1);
	roundInfo.text("Round: 1");
	round = 1;


	const coordinatesPath = `algorithm/${algorithmName}/coordinates.csv`;
	const parentPath = `algorithm/${algorithmName}/parent.csv`;

	Promise.all([
		d3.csv(coordinatesPath, d3.autoType),
		d3.csv(parentPath, d3.autoType)
	]).then(([coordData, parentData]) => {
		errorMessageDiv.text(""); // Clear previous errors
		algorithmNameSpan.text(algorithmName); // Update algorithm name display

		coordinates = coordData.map((d, i) => ({ id: i, x: d.x * 10 + 100, y: d.y * 10 + 100 }));
		parents = parentData.map(row => Object.values(row));

		console.log(`Loaded data for ${algorithmName}:`, { coordinates, parents });

		roundSlider
			.attr("min", 1)
			.attr("max", parents.length)
			.attr("value", 1);

		const xExtent = d3.extent(coordinates, d => d.x);
		const yExtent = d3.extent(coordinates, d => d.y);
		const width = xExtent[1] - xExtent[0];
		const height = yExtent[1] - yExtent[0];
		const scale = Math.min(
			window.innerWidth / (width + 200),
			window.innerHeight / (height + 200)
		);
		const translateX = (window.innerWidth - width * scale) / 2 - xExtent[0] * scale;
		const translateY = (window.innerHeight - height * scale) / 2 - yExtent[0] * scale;

		svg.call(zoom.transform, d3.zoomIdentity
			.translate(translateX, translateY)
			.scale(scale)
		);

		drawNetwork(0); // Draw initial round (index 0)
		roundInfo.text("Round: 1");


	}).catch(error => {
		console.error(`Error loading data for ${algorithmName}:`, error);
		errorMessageDiv.text(`Error loading algorithm data for ${algorithmName}. Please check if the files exist and are correctly formatted.`);
		algorithmNameSpan.text("None");
		playButton.attr("disabled", true);
		roundSlider.attr("disabled", true);
		// Clear visualization
		g.selectAll(".link").remove();
		g.selectAll(".node").remove();
		g.selectAll(".label").remove();
	});
}

// Populate dropdown
availableAlgorithms.forEach(algo => {
	algorithmSelect.append("option").attr("value", algo).text(algo);
});

// Initial Load
const urlParams = new URLSearchParams(window.location.search);
let initialAlgorithm = urlParams.get('algorithm');
if (!availableAlgorithms.includes(initialAlgorithm)) {
	initialAlgorithm = availableAlgorithms[0];
}
algorithmSelect.property("value", initialAlgorithm);
loadAlgorithmData(initialAlgorithm);

// Dropdown Event Listener
algorithmSelect.on("change", function () {
	loadAlgorithmData(this.value);
});


// Event listeners for play and slider (should be defined once)
playButton.on("click", () => {
	if (!parents || parents.length === 0) return;
	if (interval) {
		clearInterval(interval);
		interval = null;
		playButton.text("▶️ 再生");
	} else {
		playButton.text("⏸️ 停止");
		interval = setInterval(() => {
			round = (round % parents.length) + 1;
			drawNetwork(round - 1);
			roundInfo.text(`Round: ${round}`);
			roundSlider.property("value", round);
		}, 1000);
	}
});

roundSlider.on("input", function () {
	if (!parents || parents.length === 0) return;
	round = +this.value;
	drawNetwork(round - 1);
	roundInfo.text(`Round: ${round}`);
});


function drawNetwork(roundIdx) {
	g.selectAll(".link").remove();
	g.selectAll(".node").remove();
	g.selectAll(".label").remove();
	// Reset node info panel when redrawing network (e.g. round change)
	// but only if it's not the initial load triggered by loadAlgorithmData,
	// as loadAlgorithmData already resets it.
	if (roundIdx !== 0) { // Assuming drawNetwork(0) is the initial call from loadAlgorithmData
      nodeInfoContent.html("Click a node to see details.");
    }


	const links = coordinates.map((node, i) => {
	const targetId = +parents[roundIdx][i - 1];
	if (targetId == -1) return null; // -1はリンクなしを意味する
	return targetId !== i ?
		{ source: node, target: coordinates[targetId] ?? coordinates[0] } :
		{ source: node, target: coordinates[0] };
	}).filter(d => d !== null).slice(1); // 最初のノードはリンクなし

	console.log("Links:", links);

	// 線（リンク）
	g.selectAll(".link")
	.data(links)
	.enter()
	.append("line")
	.attr("class", "link")
	.attr("x1", d => d.source.x)
	.attr("y1", d => d.source.y)
	.attr("x2", d => d.target.x)
	.attr("y2", d => d.target.y)
	.attr("marker-end", "url(#arrow)");

	// ノード（円）
	g.selectAll(".node")
	.data(coordinates)
	.enter()
	.append("circle")
	.style("fill", c => c.id === parents[roundIdx][c.id - 1] ? "red" : "steelblue")
	.attr("class", "node")
	.attr("r", 10)
	.attr("cx", d => d.x)
	.attr("cy", d => d.y)
	.on("click", function (event, d) {
		// Remove highlight from previously selected node
		g.selectAll(".node").style("stroke", null).style("stroke-width", null);
		// Highlight clicked node
		d3.select(this).style("stroke", "black").style("stroke-width", 3);

		let parentIdDisplay = "N/A";
		if (d.id === 0) {
			parentIdDisplay = "N/A (Sink Node)";
		} else if (parents && parents[roundIdx] && parents[roundIdx][d.id - 1] !== undefined) {
			const parentNodeId = parents[roundIdx][d.id - 1];
			if (parentNodeId === -1) {
				parentIdDisplay = "N/A (No Parent)";
			} else {
				parentIdDisplay = parentNodeId;
			}
		} else {
			parentIdDisplay = "Error: Parent data unavailable";
		}

		nodeInfoContent.html(`Node ID: ${d.id}<br>Parent ID (Round ${round}): ${parentIdDisplay}`);
	});

	// ノードIDのテキスト
	g.selectAll(".label")
	.data(coordinates)
	.enter()
	.append("text")
	.attr("class", "label")
	.attr("x", d => d.x + 12)
	.attr("y", d => d.y + 4)
	.text(d => d.id);
}