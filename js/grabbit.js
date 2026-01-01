/**
 * Grabbit V2.0.0
 * An improved version of the Grabbit Chrome extension for selecting and manipulating multiple links
 * with enhanced performance, better code organization, and improved user experience.
 *
 * This content script provides the core functionality for selecting multiple links on a webpage
 * by drawing a selection box with the mouse while holding specific key combinations.
 * 
 * @author Grabbit Team
 * @version 2.0.0
 */

//=============================================================================
// INITIALIZATION
//=============================================================================

/**
 * Load saved actions from chrome storage on initialization
 */
chrome.storage.sync.get(['savedActions', 'boxColor', 'exclusionFilters', 'disabledDomains'], function (result) {
  GrabbitState.savedActions = result.savedActions || [];
  GrabbitState.exclusionFilters = result.exclusionFilters || [];
  GrabbitState.disabledDomains = result.disabledDomains || [];

  // Check if disabled
  if (isDomainDisabled(GrabbitState.disabledDomains)) {
    GrabbitState.isDisabled = true;
    console.log('Grabbit: Disabled on this domain.');
    return; // Stop further initialization if necessary
  }

  compileExclusionFilters();
});

/**
 * Compiles exclusion filter patterns into RegExp objects for performance.
 * Falls back to substring matching for invalid regex patterns.
 */
function compileExclusionFilters() {
  GrabbitState.compiledExclusionFilters = GrabbitState.exclusionFilters.map(pattern => {
    try {
      // Try to compile as regex with case-insensitive flag
      return { regex: new RegExp(pattern, 'i'), pattern: pattern };
    } catch (e) {
      // Invalid regex - will use substring matching
      return { regex: null, pattern: pattern };
    }
  });
}

//=============================================================================
// EVENT LISTENERS
//=============================================================================

/**
 * Handles the mousedown event to start the selection process
 */
document.addEventListener('mousedown', (e) => {
  if (GrabbitState.isDisabled) return;
  const mouseButton = getMouseButton(e);
  GrabbitState.currentMouseButton = mouseButton; // Store the initial mouse button

  const matchedAction = checkKeyCombination(e, mouseButton); // Check for matching action

  if (matchedAction) {
    GrabbitState.currentMatchedAction = matchedAction;
    GrabbitState.isMouseDown = true;
    GrabbitState.isSelectionActive = false; // Selection not active until threshold is crossed
    GrabbitState.startX = e.clientX;
    GrabbitState.startY = e.clientY + window.scrollY; // Add scroll offset to initial Y position
    GrabbitState.initialScrollY = window.scrollY;
    e.preventDefault();
  }
});

/**
 * Activates the selection UI after drag threshold is crossed.
 * This function is called from mousemove when the user has dragged far enough.
 */
function activateSelection() {
  GrabbitState.isSelectionActive = true;

  // PRE-CACHE LINKS
  // We do this once when selection activates to avoid expensive DOM queries
  // and getBoundingClientRect during the drag operation.
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Query all links (including those in Shadow DOM)
  const allLinks = getAllLinks();
  GrabbitState.cachedLinks = [];

  allLinks.forEach(link => {
    // Skip links without href
    if (!link.href) return;

    // Visibility check
    // Note: getComputedStyle can be expensive, but doing it once on activation
    // is much better than on every mousemove
    const style = window.getComputedStyle(link);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return;
    }

    // Sticky/Fixed check
    const isYouTubeSubscription = window.location.hostname.includes('youtube.com') &&
      (link.href.includes('/channel/') || link.href.includes('/c/') ||
        link.href.includes('/user/') || link.href.includes('@'));

    if (!isYouTubeSubscription && isElementSticky(link)) {
      return;
    }

    // Get dimensions
    let clientRect = link.getBoundingClientRect();
    if ((clientRect.width === 0 || clientRect.height === 0) && link.children.length > 0) {
      clientRect = link.children[0].getBoundingClientRect();
    }

    if (clientRect.width === 0 && clientRect.height === 0) return;

    // Check if link is "important" (inside heading tag H1-H6) for smart select
    const headingRegex = /^H[1-6]$/;
    let isImportant = false;
    let parentNode = link.parentNode;
    while (parentNode && parentNode !== document.body) {
      if (headingRegex.test(parentNode.nodeName)) {
        isImportant = true;
        break;
      }
      parentNode = parentNode.parentNode;
    }

    // Store document-relative coordinates and importance flag
    GrabbitState.cachedLinks.push({
      link: link,
      box: {
        top: clientRect.top + scrollY,
        bottom: clientRect.bottom + scrollY,
        left: clientRect.left + scrollX,
        right: clientRect.right + scrollX
      },
      isImportant: isImportant
    });
  });

  const matchedAction = GrabbitState.currentMatchedAction;
  GrabbitState.selectionBox = createSelectionBox();

  // Apply border styling
  const borderThickness = matchedAction.borderThickness || 2;
  const borderStyle = matchedAction.borderStyle || 'solid';
  GrabbitState.selectionBox.style.border = `${borderThickness}px ${borderStyle}`;
  GrabbitState.selectionBox.style.borderColor = matchedAction.boxColor;
  GrabbitState.selectionBox.style.backgroundColor = `${matchedAction.boxColor}19`;
  GrabbitState.selectionBox.style.position = 'absolute';
  GrabbitState.selectionBox.style.left = `${GrabbitState.startX}px`;
  GrabbitState.selectionBox.style.top = `${GrabbitState.startY}px`; // Use absolute position from document top
  document.body.appendChild(GrabbitState.selectionBox);
  GrabbitState.counterLabel = createCounterLabel();
  document.body.appendChild(GrabbitState.counterLabel);
  GrabbitState.selectedLinks.clear();
}

/**
 * Handles the mousemove event to update the selection box
 */
document.addEventListener('mousemove', (e) => {
  if (GrabbitState.isDisabled) return;
  if (!GrabbitState.isMouseDown) return;

  const currentX = e.clientX;
  const currentY = e.clientY + window.scrollY; // Add scroll offset to current Y position
  GrabbitState.lastMouseX = currentX;
  GrabbitState.lastMouseY = e.clientY; // Store viewport Y position for scroll handling

  // Check if we need to activate selection (threshold check)
  if (!GrabbitState.isSelectionActive) {
    // Calculate distance from start position (using viewport coordinates for consistency)
    const distance = Math.hypot(currentX - GrabbitState.startX, currentY - GrabbitState.startY);

    // If below threshold, don't activate yet
    if (distance < CONSTANTS.DRAG_THRESHOLD) {
      return;
    }

    // Threshold crossed - activate selection
    activateSelection();
  }

  // At this point, selection is active - proceed with normal logic
  if (!GrabbitState.selectionBox) return;

  // Calculate box dimensions using absolute positions
  const left = Math.min(GrabbitState.startX, currentX);
  const top = Math.min(GrabbitState.startY, currentY);
  const width = Math.abs(currentX - GrabbitState.startX);
  const height = Math.abs(currentY - GrabbitState.startY);

  // Update selection box position and size
  GrabbitState.selectionBox.style.left = `${left}px`;
  GrabbitState.selectionBox.style.top = `${top}px`;
  GrabbitState.selectionBox.style.width = `${width}px`;
  GrabbitState.selectionBox.style.height = `${height}px`;

  handleScroll(e.clientY);

  // Use debounced version for link selection
  debouncedUpdateLinks();

  if (GrabbitState.counterLabel) {
    GrabbitState.counterLabel.style.left = `${e.clientX}px`;
    GrabbitState.counterLabel.style.top = `${e.clientY}px`;
    updateVisualStyles();
  }
});

/**
 * Handles the mouseup event to finalize the selection
 */
document.addEventListener('mouseup', (e) => {
  if (GrabbitState.isDisabled) return;
  // Clear any scroll interval
  if (GrabbitState.scrollInterval) {
    clearInterval(GrabbitState.scrollInterval);
    GrabbitState.scrollInterval = null;
  }

  if (!GrabbitState.isMouseDown) return;

  // Prevent default context menu if links are selected and right mouse clicked or if selection box is a bit big
  if (e.button === 2 && GrabbitState.selectedLinks.size > 0 ||
    (GrabbitState.selectionBox && GrabbitState.selectionBox.offsetWidth > 100 && GrabbitState.selectionBox.offsetHeight > 100)) {
    document.addEventListener('contextmenu', function preventContextMenu(e) {
      e.preventDefault();
      document.removeEventListener('contextmenu', preventContextMenu);
    }, { once: true });
  }

  const mouseButton = getMouseButton(e);
  const matchedAction = checkKeyCombination(e, mouseButton);

  // Process selected links only if selection was actually activated and there's a matched action
  if (GrabbitState.isSelectionActive && matchedAction && GrabbitState.selectedLinks.size > 0) {
    processSelectedLinks(matchedAction);
  }

  // Clean up
  cleanupSelection();
});

/**
 * Prevents the default right-click menu when using right mouse button during selection
 */
document.addEventListener('contextmenu', (e) => {
  if (GrabbitState.isMouseDown) {
    e.preventDefault();
  }
});

/**
 * Handles keydown events during selection to update the action
 */
document.addEventListener('keydown', (e) => {
  if (GrabbitState.isDisabled) return;
  // Track letter keys (A-Z) for modifier key support
  if (e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
    GrabbitState.pressedKeys.add(e.key.toLowerCase());
  }

  // Handle ESC key to cancel selection
  // Cancel if ESC is pressed during mouse down OR with any modifier key held
  if (e.key === 'Escape') {
    if (GrabbitState.isMouseDown || GrabbitState.isSelectionActive) {
      // Always prevent the page from reacting to ESC while Grabbit is active
      e.preventDefault();
      e.stopPropagation();
      cleanupSelection();
      return;
    }
  }

  // Handle key combinations during selection
  if (GrabbitState.isMouseDown && GrabbitState.selectionBox) {
    const newMatchedAction = checkKeyCombination(e, GrabbitState.currentMouseButton);

    // Store current action before switching
    if (!GrabbitState.previousAction) {
      GrabbitState.previousAction = GrabbitState.currentMatchedAction;
    }

    // Update to new action if found
    if (newMatchedAction) {
      GrabbitState.previousAction = GrabbitState.currentMatchedAction;
      GrabbitState.currentMatchedAction = newMatchedAction;
      updateVisualStyles();
    }
  }
});

/**
 * Handles keyup events during selection to revert to previous action
 */
document.addEventListener('keyup', (e) => {
  if (GrabbitState.isDisabled) return;
  // Remove letter keys from pressedKeys when released
  if (e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
    GrabbitState.pressedKeys.delete(e.key.toLowerCase());
  }

  if (GrabbitState.isMouseDown && GrabbitState.selectionBox) {
    const currentKeyState = {
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey
    };

    const matchedAction = checkKeyCombination(currentKeyState, GrabbitState.currentMouseButton);
    GrabbitState.currentMatchedAction = matchedAction || GrabbitState.previousAction || GrabbitState.currentMatchedAction;
    updateVisualStyles();
  }
});

/**
 * Cleans up the selection when the window loses focus
 */
window.addEventListener('blur', () => {
  GrabbitState.pressedKeys.clear(); // Clear all pressed letter keys
  cleanupSelection();
});

/**
 * Listens for changes in storage to update settings in real-time
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Update savedActions if they changed
    if (changes.savedActions) {
      GrabbitState.savedActions = changes.savedActions.newValue;
    }

    // Update boxColor if it changed
    if (changes.boxColor) {
      // Update any active selection boxes with new color
      if (GrabbitState.selectionBox) {
        GrabbitState.selectionBox.style.borderColor = changes.boxColor.newValue;
        GrabbitState.selectionBox.style.backgroundColor = `${changes.boxColor.newValue}19`;
      }

      // Update highlighted links with new color
      GrabbitState.selectedLinks.forEach(link => {
        link.style.backgroundColor = `${changes.boxColor.newValue}33`;
      });
    }

    // Update exclusionFilters if they changed
    if (changes.exclusionFilters) {
      GrabbitState.exclusionFilters = changes.exclusionFilters.newValue || [];
      compileExclusionFilters();
    }
  }
});