//=============================================================================
// UI ELEMENT CREATION
//=============================================================================

/**
 * Creates a selection box element with the specified styles
 * @returns {HTMLElement} The created selection box element
 */
function createSelectionBox() {
    const box = document.createElement('div');
    box.style.cssText = `
    position: fixed;
    background-color: rgba(33, 150, 243, 0.1);
    z-index: 10000;
    pointer-events: none;
  `;
    return box;
}

/**
 * Creates a counter label element to display the number of selected links
 * @returns {HTMLElement} The created counter label element
 */
function createCounterLabel() {
    const label = document.createElement('div');
    label.style.cssText = `
    position: fixed;
    background-color: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transform: translate(10px, 10px);
  `;
    return label;
}

/**
 * Updates visual styles for selection box, highlighted links and counter label
 */
function updateVisualStyles() {
    if (!GrabbitState.currentMatchedAction) return;

    // Update selection box
    if (GrabbitState.selectionBox && GrabbitState.currentMatchedAction) {
        const borderThickness = GrabbitState.currentMatchedAction.borderThickness || 2;
        const borderStyle = GrabbitState.currentMatchedAction.borderStyle || 'solid';
        GrabbitState.selectionBox.style.border = `${borderThickness}px ${borderStyle}`;
        GrabbitState.selectionBox.style.borderColor = GrabbitState.currentMatchedAction.boxColor;
        GrabbitState.selectionBox.style.backgroundColor = `${GrabbitState.currentMatchedAction.boxColor}19`;
    }

    // Update highlighted links
    GrabbitState.selectedLinks.forEach(link => {
        link.style.backgroundColor = `${GrabbitState.currentMatchedAction.boxColor}33`;
    });

    // Update counter label
    if (GrabbitState.counterLabel) {
        const urls = Array.from(GrabbitState.selectedLinks).map(link => link.href);
        const shouldDedupe = GrabbitState.currentMatchedAction.avoidDuplicates !== 'off';
        const count = shouldDedupe ?
            new Set(urls).size :
            urls.length;

        const actionType =
            GrabbitState.currentMatchedAction.openLinks ? 'be opened in new tabs' :
                GrabbitState.currentMatchedAction.openWindow ? 'be opened in a new window' :
                    GrabbitState.currentMatchedAction.copyUrlsAndTitles ? 'be copied including page titles' :
                        GrabbitState.currentMatchedAction.copyTitles ? 'copy their page titles only' :
                            'be copied to clipboard';

        GrabbitState.counterLabel.textContent = `${count} URLs to ${actionType}`;
    }
}

/**
 * Cleans up the selection box, counter label, and selected links
 */
function cleanupSelection() {
    GrabbitState.isMouseDown = false;
    GrabbitState.isSelectionActive = false;

    if (GrabbitState.selectionBox) {
        GrabbitState.selectionBox.remove();
        GrabbitState.selectionBox = null;
    }

    if (GrabbitState.counterLabel) {
        GrabbitState.counterLabel.remove();
        GrabbitState.counterLabel = null;
    }

    GrabbitState.selectedLinks.forEach(link => link.style.backgroundColor = '');
    GrabbitState.selectedLinks.clear();
    GrabbitState.cachedLinks = []; // Clear cache
    GrabbitState.smartSelectActive = false; // Reset smart select mode

    if (GrabbitState.scrollInterval) {
        clearInterval(GrabbitState.scrollInterval);
        GrabbitState.scrollInterval = null;
    }
}
