//=============================================================================
// SELECTION BOX AND SCROLLING MANAGEMENT
//=============================================================================

/**
 * Updates the selection box position and size during scrolling
 */
function updateSelectionBox() {
    if (!GrabbitState.selectionBox || !GrabbitState.isMouseDown) return;

    // Get current scroll position
    const currentScroll = window.scrollY;
    GrabbitState.currentScrollY = currentScroll;

    // Calculate positions relative to the document
    const documentStartY = GrabbitState.startY;
    const documentCurrentY = GrabbitState.lastMouseY + currentScroll - GrabbitState.initialScrollY;

    // Calculate box dimensions relative to document
    const left = Math.min(GrabbitState.startX, GrabbitState.lastMouseX);
    const top = Math.min(documentStartY, documentCurrentY);
    const width = Math.abs(GrabbitState.lastMouseX - GrabbitState.startX);
    const height = Math.abs(documentCurrentY - documentStartY);

    // Update selection box position and size
    GrabbitState.selectionBox.style.position = 'absolute';
    GrabbitState.selectionBox.style.left = `${left}px`;
    GrabbitState.selectionBox.style.top = `${top}px`;
    GrabbitState.selectionBox.style.width = `${width}px`;
    GrabbitState.selectionBox.style.height = `${height}px`;

    // Update link selection using debounced function
    debouncedUpdateLinks();
}

/**
 * Handles auto-scrolling when the mouse is near the viewport edges
 * @param {number} mouseY - The current mouse Y position
 */
function handleScroll(mouseY) {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;

    // Calculate distances from viewport edges
    const distanceFromTop = mouseY;
    const distanceFromBottom = viewportHeight - mouseY;

    // Clear any existing scroll interval
    if (GrabbitState.scrollInterval) {
        clearInterval(GrabbitState.scrollInterval);
        GrabbitState.scrollInterval = null;
    }

    // Start scrolling if within threshold and page has more content
    if (distanceFromTop < CONSTANTS.SCROLL_THRESHOLD || distanceFromBottom < CONSTANTS.SCROLL_THRESHOLD) {
        GrabbitState.scrollInterval = setInterval(() => {
            if (distanceFromTop < CONSTANTS.SCROLL_THRESHOLD && scrollTop > 0) {
                // Scroll up if not at top
                window.scrollBy(0, -CONSTANTS.SCROLL_SPEED);
                updateSelectionBox();
            } else if (distanceFromBottom < CONSTANTS.SCROLL_THRESHOLD &&
                (scrollTop + viewportHeight) < pageHeight) {
                // Scroll down only if not at bottom
                window.scrollBy(0, CONSTANTS.SCROLL_SPEED);
                updateSelectionBox();
            }
        }, CONSTANTS.SCROLL_INTERVAL);
    }
}

//=============================================================================
// LINK SELECTION AND HIGHLIGHTING
//=============================================================================

/**
 * Updates the selected links based on the current selection box
 */
function updateSelectedLinks() {
    if (!GrabbitState.selectionBox || !GrabbitState.isMouseDown) return;

    // Get current selection box dimensions in document coordinates
    // Note: selectionBox top/left are already in document coordinates (including scroll)
    // because we set them that way in mousemove/mousedown
    const boxLeft = parseInt(GrabbitState.selectionBox.style.left || 0);
    const boxTop = parseInt(GrabbitState.selectionBox.style.top || 0);
    const boxWidth = parseInt(GrabbitState.selectionBox.style.width || 0);
    const boxHeight = parseInt(GrabbitState.selectionBox.style.height || 0);

    const boxRight = boxLeft + boxWidth;
    const boxBottom = boxTop + boxHeight;

    // Use cached links instead of querying DOM
    GrabbitState.cachedLinks.forEach(item => {
        const { link, box } = item;

        // Check if link is within selection box
        // All coordinates are document-relative
        const isInBox = !(box.left > boxRight ||
            box.right < boxLeft ||
            box.top > boxBottom ||
            box.bottom < boxTop);

        // If the link is in the box, add it to selectedLinks and highlight it
        if (isInBox) {
            if (!GrabbitState.selectedLinks.has(link)) {
                GrabbitState.selectedLinks.add(link);
                if (GrabbitState.currentMatchedAction) {
                    link.style.backgroundColor = `${GrabbitState.currentMatchedAction.boxColor}33`;
                }
            }
        } else {
            // If not in the box, remove from selectedLinks and clear highlight
            if (GrabbitState.selectedLinks.has(link)) {
                GrabbitState.selectedLinks.delete(link);
                link.style.backgroundColor = '';
            }
        }
    });

    // Update the counter label after links selection changes
    updateVisualStyles();
}

// Create debounced version of updateSelectedLinks - depends on debounce from utils.js, so logic.js must be loaded after utils.js
const debouncedUpdateLinks = debounce(updateSelectedLinks, CONSTANTS.DEBOUNCE_DELAY);

//=============================================================================
// LINK PROCESSING
//=============================================================================

/**
 * Processes the selected links based on the matched action
 * @param {Object} matchedAction - The matched action configuration
 */
function processSelectedLinks(matchedAction) {
    if (!matchedAction || GrabbitState.selectedLinks.size === 0) return;

    let urls = Array.from(GrabbitState.selectedLinks).map(link => link.href);

    // Apply smart select if enabled
    let finalUrls = matchedAction.smartSelect === 'on' ?
        [...new Set(urls)] : urls;

    // Apply reverse order if enabled
    if (matchedAction.reverseOrder) {
        finalUrls = finalUrls.reverse();
    }

    if (matchedAction.openLinks) {
        // Send message to background script to handle tab creation
        chrome.runtime.sendMessage({
            action: 'createTabs',
            urls: finalUrls,
            delay: matchedAction.tabDelay || 0,
            openAtEnd: matchedAction.openAtEnd || false
        });
        // Mark links as visited (persistent storage)
        markLinksAsGrabbitVisited(finalUrls, Array.from(GrabbitState.selectedLinks));

    } else if (matchedAction.openWindow) {
        // Send message to background script to handle window creation
        chrome.runtime.sendMessage({
            action: 'openLinks',
            urls: finalUrls,
            delay: matchedAction.tabDelay || 0
        });
        // Mark links as visited (persistent storage)
        markLinksAsGrabbitVisited(finalUrls, Array.from(GrabbitState.selectedLinks));

    } else if (matchedAction.copyUrls) {
        // Copy URLs to clipboard
        navigator.clipboard.writeText(finalUrls.join('\n'));
    } else if (matchedAction.copyUrlsAndTitles) {
        // Format URLs and titles based on formatting options
        const urlsAndTitles = finalUrls.map(url => {
            const link = Array.from(GrabbitState.selectedLinks).find(l => l.href === url);
            const title = link.textContent.trim();

            // Get formatting options with defaults
            const formatPattern = matchedAction.formatPattern || 'titleFirst';
            const separatorType = matchedAction.separatorType || 'newline';
            const separatorCount = matchedAction.separatorCount || 1;

            // Create separator based on type and count
            let separator;
            if (separatorType === 'newline') {
                separator = '\n'.repeat(separatorCount);
            } else if (separatorType === 'space') {
                separator = ' '.repeat(separatorCount);
            } else if (separatorType === 'tab') {
                separator = '\t'.repeat(separatorCount);
            } else {
                separator = '\n'; // Fallback to newline
            }

            // Format based on pattern
            if (formatPattern === 'titleFirst') {
                return `${title}${separator}${url}`;
            } else if (formatPattern === 'urlFirst') {
                return `${url}${separator}${title}`;
            } else {
                return `${title}${separator}${url}`; // Fallback to titleFirst
            }
        });

        // Get link separator count with default
        const linkSeparatorCount = matchedAction.linkSeparatorCount || 0;

        // Create link separator based on linkSeparatorCount
        const linkSeparator = linkSeparatorCount > 0 ? '\n'.repeat(linkSeparatorCount + 1) : '\n';

        // Join the formatted links with the appropriate separator
        const formattedText = urlsAndTitles.join(linkSeparator);

        navigator.clipboard.writeText(formattedText);
    } else if (matchedAction.copyTitles) {
        // Copy titles to clipboard
        const titles = finalUrls.map(url => {
            const link = Array.from(GrabbitState.selectedLinks).find(l => l.href === url);
            return link.textContent.trim();
        }).join('\n');

        navigator.clipboard.writeText(titles);
    }

}

