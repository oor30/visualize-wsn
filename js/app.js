// js/app.js (new main file)

// Global state variables, some initialized by functions in other files
let coordinates = [];
let parents = [];
let round = 1;
let interval = null;
let zoom;             // Initialized by setupSVG() in visualization.js
let initialTransform; // Initialized by setupSVG() in visualization.js, used by data_loader.js

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // UI elements like playButton are now global via config.js
    setupSVG();       // from visualization.js
    initializeUI();   // from ui.js - this will also trigger initial data load

    playButton.on("click", () => {
        console.log("Play button clicked.");
        if (!parents || parents.length === 0) {
            console.warn("Play action aborted: 'parents' data is missing or empty.");
            return;
        }
        if (interval) {
            console.log("Stopping animation.");
            clearInterval(interval);
            interval = null;
            playButton.text("▶️ 再生");
        } else {
            console.log("Starting animation.");
            playButton.text("⏸️ 停止");
            interval = setInterval(() => {
                round = (round % parents.length) + 1;
                drawNetwork(round - 1); // from visualization.js
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
});
