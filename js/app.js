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

// データ読み込み（Promise.allで並列読み込み）
// クエリストリングからalgorithmを取得
const urlParams = new URLSearchParams(window.location.search);
const algorithm = urlParams.get('algorithm') || '_default';
let coordinatesPath = `algorithm/${algorithm}/coordinates.csv`;
let parentPath = `algorithm/${algorithm}/parent.csv`;
d3.select("#algorithm-name").text(algorithm);
Promise.all([
	d3.csv(coordinatesPath, d3.autoType),
	d3.csv(parentPath, d3.autoType)
]).then(([coordData, parentData]) => {
	coordinates = coordData.map((d, i) => ({ id: i, x: d.x * 10 + 100, y: d.y * 10 + 100 }));
	console.log("Coordinates:", coordinates);
	console.log("Parents:", parentData);
	parents = parentData.map(row => Object.values(row)); // [ [0,1,2], [1,1,0], ... ]
	console.log("Parents:", parents);

	// スライダーの最大値を設定
	d3.select("#round-slider")
	.attr("min", 1)
	.attr("max", parents.length)
	.attr("value", 1);

	// 初期表示時のズームレベルと位置を計算
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

	// 初期ズーム設定を適用
	svg.call(zoom.transform, d3.zoomIdentity
	.translate(translateX, translateY)
	.scale(scale)
	);

	drawNetwork(round);

	d3.select("#play").on("click", () => {
	if (interval) {
		clearInterval(interval);
		interval = null;
		d3.select("#play").text("▶️ 再生");
	} else {
		interval = setInterval(() => {
		round = (round % parents.length) + 1;
		drawNetwork(round - 1);
		d3.select("#round-info").text(`Round: ${round}`);
		d3.select("#round-slider").property("value", round);
		}, 1000);
		d3.select("#play").text("⏸️ 停止");
	}
	});

	d3.select("#round-slider").on("input", function () {
	round = +this.value;
	drawNetwork(round - 1);
	d3.select("#round-info").text(`Round: ${round}`);
	});
});

function drawNetwork(roundIdx) {
	g.selectAll(".link").remove();
	g.selectAll(".node").remove();
	g.selectAll(".label").remove();

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
	.attr("cy", d => d.y);

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