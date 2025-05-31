// js/ui.js
// Uses global 'algorithmSelect', 'availableAlgorithms' (from config.js),
// 'errorMessageDiv', 'playButton', 'roundSlider' (from config.js),
// 'loadAlgorithmData' (from data_loader.js).

function populateAlgorithmDropdown() {
    availableAlgorithms.forEach(algo => {
        algorithmSelect.append("option").attr("value", algo).text(algo);
    });
}

function initializeUI() {
    populateAlgorithmDropdown();

    const urlParams = new URLSearchParams(window.location.search);
    let initialAlgorithm = urlParams.get('algorithm');
    if (!availableAlgorithms.includes(initialAlgorithm)) {
        initialAlgorithm = availableAlgorithms[0] || null;
    }

    if (initialAlgorithm) {
        algorithmSelect.property("value", initialAlgorithm);
        loadAlgorithmData(initialAlgorithm);
    } else {
        errorMessageDiv.text("No algorithms available or configured.");
        playButton.attr("disabled", true);
        roundSlider.attr("disabled", true);
    }

    algorithmSelect.on("change", function () {
        loadAlgorithmData(this.value);
    });
}
