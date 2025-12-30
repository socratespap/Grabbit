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
// STATE MANAGEMENT
//=============================================================================

/**
 * Central state object for better organization and tracking of application state
 * @type {Object}
 */
const GrabbitState = {
  isMouseDown: false,         // Flag to track if mouse is down
  startX: 0,                  // Starting X position
  startY: 0,                  // Starting Y position
  lastMouseX: 0,              // Last mouse X position for tracking movement
  lastMouseY: 0,              // Last mouse Y position for tracking movement
  initialScrollY: 0,          // Initial scroll position
  currentScrollY: 0,          // Current scroll position
  selectionBox: null,         // DOM element for selection box
  counterLabel: null,         // DOM element for counter label
  selectedLinks: new Set(),   // Set of selected link elements
  currentMatchedAction: null, // Current matched action configuration
  previousAction: null,       // Previous matched action for state tracking
  currentMouseButton: null,   // Current mouse button being used
  scrollInterval: null,       // Interval ID for auto-scrolling
  savedActions: [],           // Saved actions from storage
  cachedLinks: []             // Cache for link elements and their positions
};

//=============================================================================
// CONSTANTS
//=============================================================================

/**
 * Application constants for better readability and maintenance
 * @type {Object}
 */
const CONSTANTS = {
  SCROLL_THRESHOLD: 20,       // Pixels from viewport edge to trigger scrolling
  SCROLL_SPEED: 35,           // Pixels per frame on scroll
  SCROLL_INTERVAL: 16,        // Milliseconds between scroll updates (~60fps)
  DEBOUNCE_DELAY: 5,          // Milliseconds for debouncing link selection
  DEFAULT_BOX_COLOR: '#2196F3' // Default selection box color
};

//=============================================================================
// INITIALIZATION
//=============================================================================

/**
 * Load saved actions from chrome storage on initialization
 */
chrome.storage.sync.get(['savedActions', 'boxColor'], function (result) {
  GrabbitState.savedActions = result.savedActions || [];
});

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
    border: 2px solid;
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

//=============================================================================
// ACTION DETECTION AND UTILITIES
//=============================================================================

/**
 * Checks if a key combination matches a saved action
 * @param {Event} e - The keyboard event
 * @param {string} mouseButton - The mouse button being used
 * @returns {Object|null} The matched action or null if no match
 */
function checkKeyCombination(e, mouseButton) {
  return GrabbitState.savedActions.find(action => {
    // First check if mouse buttons match exactly
    const mouseMatch = action.combination.mouseButton === mouseButton;
    if (!mouseMatch) return false;

    // Then check key modifier match based on OS
    let keyMatch = false;

    if (action.combination.key === 'none') {
      keyMatch = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    } else if (action.combination.key === 'ctrl') {
      // Use metaKey (Command) on Mac, ctrlKey on other platforms
      keyMatch = navigator.userAgent.includes('Mac') ? e.metaKey : e.ctrlKey;
    } else {
      // For other keys (shift, alt), use standard properties
      keyMatch = e[`${action.combination.key}Key`];
    }

    return keyMatch && mouseMatch;
  });
}

/**
 * Gets the mouse button name from the event
 * @param {MouseEvent} e - The mouse event
 * @returns {string|null} The mouse button name or null
 */
function getMouseButton(e) {
  switch (e.button) {
    case 0: return 'left';
    case 1: return 'middle';
    case 2: return 'right';
    default: return null;
  }
}

/**
 * Checks if an element is sticky or fixed positioned
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if the element is sticky or fixed
 */
function isElementSticky(element) {
  let currentElement = element;
  while (currentElement && currentElement !== document.body) {
    const position = window.getComputedStyle(currentElement).position;
    if (position === 'sticky' || position === 'fixed') {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
}

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

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

// Create debounced version of updateSelectedLinks
const debouncedUpdateLinks = debounce(updateSelectedLinks, CONSTANTS.DEBOUNCE_DELAY);

/**
 * Updates visual styles for selection box, highlighted links and counter label
 */
function updateVisualStyles() {
  if (!GrabbitState.currentMatchedAction) return;

  // Update selection box
  if (GrabbitState.selectionBox) {
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
    const count = GrabbitState.currentMatchedAction.smartSelect === 'on' ?
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

  if (GrabbitState.scrollInterval) {
    clearInterval(GrabbitState.scrollInterval);
    GrabbitState.scrollInterval = null;
  }
}

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
  } else if (matchedAction.openWindow) {
    // Send message to background script to handle window creation
    chrome.runtime.sendMessage({
      action: 'openLinks',
      urls: finalUrls,
      delay: matchedAction.tabDelay || 0
    });
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

//=============================================================================
// EVENT LISTENERS
//=============================================================================

/**
 * Handles the mousedown event to start the selection process
 */
document.addEventListener('mousedown', (e) => {
  const mouseButton = getMouseButton(e);
  GrabbitState.currentMouseButton = mouseButton; // Store the initial mouse button

  const matchedAction = checkKeyCombination(e, mouseButton); // Check for matching action

  if (matchedAction) {
    GrabbitState.currentMatchedAction = matchedAction;
    GrabbitState.isMouseDown = true;
    GrabbitState.startX = e.clientX;
    GrabbitState.startY = e.clientY + window.scrollY; // Add scroll offset to initial Y position
    GrabbitState.initialScrollY = window.scrollY;

    // PRE-CACHE LINKS
    // We do this once at the start to avoid expensive DOM queries and getBoundingClientRect 
    // during the drag operation.
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Query all links
    const allLinks = document.querySelectorAll('a');
    GrabbitState.cachedLinks = [];

    allLinks.forEach(link => {
      // Skip links without href
      if (!link.href) return;

      // Visibility check
      // Note: getComputedStyle can be expensive, but doing it once on mousedown
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

      // Store document-relative coordinates
      GrabbitState.cachedLinks.push({
        link: link,
        box: {
          top: clientRect.top + scrollY,
          bottom: clientRect.bottom + scrollY,
          left: clientRect.left + scrollX,
          right: clientRect.right + scrollX
        }
      });
    });

    GrabbitState.selectionBox = createSelectionBox();
    GrabbitState.selectionBox.style.borderColor = matchedAction.boxColor;
    GrabbitState.selectionBox.style.backgroundColor = `${matchedAction.boxColor}19`;
    GrabbitState.selectionBox.style.position = 'absolute';
    GrabbitState.selectionBox.style.left = `${GrabbitState.startX}px`;
    GrabbitState.selectionBox.style.top = `${GrabbitState.startY}px`; // Use absolute position from document top
    document.body.appendChild(GrabbitState.selectionBox);
    GrabbitState.counterLabel = createCounterLabel();
    document.body.appendChild(GrabbitState.counterLabel);
    GrabbitState.selectedLinks.clear();
    e.preventDefault();
  }
});

/**
 * Handles the mousemove event to update the selection box
 */
document.addEventListener('mousemove', (e) => {
  if (!GrabbitState.isMouseDown || !GrabbitState.selectionBox) return;

  const currentX = e.clientX;
  const currentY = e.clientY + window.scrollY; // Add scroll offset to current Y position
  GrabbitState.lastMouseX = currentX;
  GrabbitState.lastMouseY = e.clientY; // Store viewport Y position for scroll handling

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

  // Process selected links if there's a matched action
  if (matchedAction && GrabbitState.selectedLinks.size > 0) {
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
  // Handle ESC key to cancel selection
  if (e.key === 'Escape' && (e.altKey || e.ctrlKey || e.shiftKey || GrabbitState.isMouseDown)) {
    e.stopPropagation();
    e.preventDefault();

    // Handle ESC + modifier keys or just ESC during selection
    cleanupSelection();
    return;
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
  }
});