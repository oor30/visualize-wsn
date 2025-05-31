// js/config.js
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 1200;

const availableAlgorithms = ['_default', 'algo_2']; // MODIFIED LINE

// D3 UI Selectors
const algorithmSelect = d3.select("#algorithm-select");
const algorithmNameSpan = d3.select("#algorithm-name");
const errorMessageDiv = d3.select("#error-message");
const playButton = d3.select("#play");
const roundSlider = d3.select("#round-slider");
const roundInfo = d3.select("#round-info");
const nodeInfoContent = d3.select("#node-info-content");
const svg = d3.select("svg");
let g; // Global group element for zoom, assigned in setupSVG
