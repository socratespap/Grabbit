  let isMouseDown = false; // Flag to track if mouse is down
  let startX = 0; // Starting X position
  let startY = 0; // Starting Y position
  let selectionBox = null; 
  let selectedLinks = new Set();
  const SCROLL_THRESHOLD = 20; // pixels from viewport edge
  const SCROLL_SPEED = 35; // pixels per frame on scroll
  let scrollInterval = null;
  let lastMouseY = 0;
  let currentMatchedAction = null; // To get the color in order to highlight links
  let counterLabel = null; 
  let currentAction = null;
  let previousAction = null;
  let currentMouseButton = null;


 


  // Get saved actions from chrome storage
  let savedActions = [];
  chrome.storage.sync.get(['savedActions', 'boxColor'], function(result) {
      savedActions = result.savedActions || [];
  });

  // Create selection box element
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

  // Check if key combination matches saved action
  function checkKeyCombination(e, mouseButton) {
    return savedActions.find(action => {
        // First check if mouse buttons match exactly
        const mouseMatch = action.combination.mouseButton === mouseButton;
        if (!mouseMatch) return false;

        // Then check key modifier match
        const keyMatch = action.combination.key === 'none' ? 
            !e.ctrlKey && !e.shiftKey && !e.altKey :
            e[`${action.combination.key}Key`];

        return keyMatch && mouseMatch;
    });
}

function getMouseButton(e) {
    switch(e.button) {
        case 0:
            return 'left';
        case 1:
            return 'middle';
        case 2:
            return 'right';
        default:
            return null;
    }
}

// Handle mouse down event
document.addEventListener('mousedown', (e) => {
    const mouseButton = getMouseButton(e);
    currentMouseButton = mouseButton; // Store the initial mouse button

    const matchedAction = checkKeyCombination(e, mouseButton); // Check for matching action
   
    if (matchedAction) {
        currentMatchedAction = matchedAction;        
        isMouseDown = true;
        startX = e.clientX;
        startY = e.clientY + window.scrollY; // Add scroll offset to initial Y position
        initialScrollY = window.scrollY;
        currentMatchedAction = matchedAction; 
        selectionBox = createSelectionBox();
        selectionBox.style.borderColor = matchedAction.boxColor;
        selectionBox.style.backgroundColor = `${matchedAction.boxColor}19`;
        selectionBox.style.position = 'absolute';
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`; // Use absolute position from document top
        document.body.appendChild(selectionBox);
        counterLabel = createCounterLabel();
        document.body.appendChild(counterLabel);
        selectedLinks.clear();
        e.preventDefault();
    }
});
// Handle scrolling
function handleScroll(mouseY) {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    
    // Calculate distances from viewport edges
    const distanceFromTop = mouseY;
    const distanceFromBottom = viewportHeight - mouseY;
    
    // Clear any existing scroll interval
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
    
    // Start scrolling if within threshold and page has more content
    if (distanceFromTop < SCROLL_THRESHOLD || distanceFromBottom < SCROLL_THRESHOLD) {
        scrollInterval = setInterval(() => {
            if (distanceFromTop < SCROLL_THRESHOLD && scrollTop > 0) {
                // Scroll up if not at top
                window.scrollBy(0, -SCROLL_SPEED);
                updateSelectionBox();
            } else if (distanceFromBottom < SCROLL_THRESHOLD && 
                      (scrollTop + viewportHeight) < pageHeight) {
                // Scroll down only if not at bottom
                window.scrollBy(0, SCROLL_SPEED);
                updateSelectionBox();
            }
        }, 16); // ~60fps
    }
}
// Update selection box during scrolling
function updateSelectionBox() {
    if (!selectionBox || !isMouseDown) return;
    
    // Get current scroll position
    const currentScroll = window.scrollY;
    
    // Calculate positions relative to the document
    const documentStartY = startY + (currentScroll - window.scrollY);
    const documentCurrentY = lastMouseY + currentScroll;
    
    // Calculate box dimensions relative to document
    const top = Math.min(documentStartY, documentCurrentY);
    const height = Math.abs(documentCurrentY - documentStartY);
    
    // Update selection box position and size
    selectionBox.style.position = 'absolute'; // Changed from 'fixed' to 'absolute'
    selectionBox.style.top = `${top}px`;
    selectionBox.style.height = `${height}px`;
    
    // Update link selection using debounced function
    debouncedUpdateLinks();
}
// Add this helper function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Create debounced version
const debouncedUpdateLinks = debounce(updateSelectedLinks, 50);

// Handle mouse move event
document.addEventListener('mousemove', (e) => {
    if (!isMouseDown || !selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY + window.scrollY; // Add scroll offset to current Y position
    lastMouseY = currentY;

    // Calculate box dimensions using absolute positions
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Update selection box position and size
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;

    handleScroll(e.clientY);
    
    // Use debounced version for link selection
    debouncedUpdateLinks();

    if (counterLabel) {
        counterLabel.style.left = `${e.clientX}px`;
        counterLabel.style.top = `${e.clientY}px`;
        updateVisualStyles(); 
    }
});

  // Handle mouse up event
  document.addEventListener('mouseup', (e) => {
      if (scrollInterval) {
          clearInterval(scrollInterval);
          scrollInterval = null;
      }
      if (!isMouseDown) return;

        // Prevent default context menu if links are selected and right mouse clicked or if selection box is a bit big
    if (e.button === 2 && selectedLinks.size > 0 || (selectionBox && selectionBox.offsetWidth > 10 && selectionBox.offsetHeight > 10)) {
        document.addEventListener('contextmenu', function preventContextMenu(e) {
            e.preventDefault();
            document.removeEventListener('contextmenu', preventContextMenu);
        }, { once: true });
    }
    
    const mouseButton = e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right';
    const matchedAction = checkKeyCombination(e, mouseButton);


      if (matchedAction && selectedLinks.size > 0) {
          let urls = Array.from(selectedLinks).map(link => link.href);
        
          // Apply smart select if enabled
          let finalUrls = matchedAction.smartSelect === 'on' ? 
              [...new Set(urls)] : urls;
              
         

          if (matchedAction.openLinks) {
             // Apply reverse order if not enabled to fix bug
          if (!matchedAction.reverseOrder) {
            finalUrls = finalUrls.reverse();
        }
                // Pass the delay value to the background script
                chrome.runtime.sendMessage({
                    action: 'createTabs',
                    urls: finalUrls,
                    delay: matchedAction.tabDelay || 0
                });
            } else if (matchedAction.openWindow) {
                // Send message to background script to handle window/tab creation
                chrome.runtime.sendMessage({
                    action: 'openLinks',
                    urls: finalUrls,
                    delay: matchedAction.tabDelay || 0
                });
                finalUrls.forEach(url => {
                    // Send a message to the background script to create the tab
                    chrome.runtime.sendMessage({
                        action: 'createTab',
                        url: url
                    });
                });
            } else if (matchedAction.openWindow) {
// Send message to background script to handle window/tab creation
chrome.runtime.sendMessage({
    action: 'openLinks',
    urls: finalUrls
  });
  
            } else if (matchedAction.copyUrls) {
                 // Apply reverse order if enabled
          if (matchedAction.reverseOrder) {
            finalUrls = finalUrls.reverse();
        }
                
                navigator.clipboard.writeText(finalUrls.join('\n\n'));
            } else if (matchedAction.copyUrlsAndTitles) {
                 // Apply reverse order if enabled
          if (matchedAction.reverseOrder) {
            finalUrls = finalUrls.reverse();
        }
                
                const urlsAndTitles = finalUrls.map(url => {
                    const link = Array.from(selectedLinks).find(l => l.href === url);
                    return `${link.textContent.trim()}\n${url}`;
                }).join('\n\n');
                navigator.clipboard.writeText(urlsAndTitles);
            }
        }

      // Clean up
      isMouseDown = false;
      if (selectionBox) {
          selectionBox.remove();
          selectionBox = null;
      }
      selectedLinks.forEach(link => link.style.backgroundColor = '');
      selectedLinks.clear();

      if (counterLabel) {
        counterLabel.remove();
        counterLabel = null;
    }
  });

  

  // Prevent default right-click menu when using right mouse button
  document.addEventListener('contextmenu', (e) => {
      if (isMouseDown) {
          e.preventDefault();
      }
  });
    // Handle link selection
    function updateSelectedLinks() {
        // Get all links on the page
        const links = document.querySelectorAll('a');
        // Get the bounding rectangle of the selection box
        const boxRect = selectionBox.getBoundingClientRect();

        // Iterate through each link
        links.forEach(link => {
            // Check if element is sticky
            if (isElementSticky(link)) {
                return;
            }

            // Add visibility checks
            const style = window.getComputedStyle(link);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return;
            }

            // Get the bounding rectangle of the link; if zero, try its first child if available
            let rect = link.getBoundingClientRect();
            if ((rect.width === 0 || rect.height === 0) && link.children.length > 0) {
                rect = link.children[0].getBoundingClientRect();
            }
            // If the rectangle is still zero-sized, skip this link
        //    if (rect.width === 0 || rect.height === 0) {
          //      return;
          //  }

            // Check if link is within selection box
            const isInBox = !(rect.left > boxRect.right ||
                              rect.right < boxRect.left ||
                              rect.top > boxRect.bottom ||
                              rect.bottom < boxRect.top);

            // If the link is in the box, add it to selectedLinks and highlight it
            if (isInBox) {
                selectedLinks.add(link);
                link.style.backgroundColor = `${currentMatchedAction.boxColor}33`;
            } else {
                // If not in the box, remove from selectedLinks and clear highlight
                selectedLinks.delete(link);
                link.style.backgroundColor = '';
            }
        });
        
        // Update the counter label after links selection changes
        updateVisualStyles();
    }
//how the counter label is created
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


//avoid sticky elements (links inside sticky elements) to avoid scrolling bug
function isElementSticky(element) {
    // Walk up the DOM tree to check for sticky/fixed positioning
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


// Our existing handler with additional prevention
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (e.altKey || e.ctrlKey || e.shiftKey || isMouseDown)) {
        e.stopPropagation();
        e.preventDefault();
        
// Handle ESC + modifier keys
        if (e.altKey) {
          cleanupSelection();
        } else if (e.ctrlKey) {            
          cleanupSelection();
        } else if (e.shiftKey) {    
          cleanupSelection();
        } else if (isMouseDown) {           
          cleanupSelection();
        }
    }
}, {capture: true, passive: false});

// Centralized cleanup function of selection box
function cleanupSelection() {
    isMouseDown = false;
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }
    if (counterLabel) {
        counterLabel.remove();
        counterLabel = null;
    }
    selectedLinks.forEach(link => link.style.backgroundColor = '');
    selectedLinks.clear();
    
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }				
}

// Pass changes from options page to linkgrab.js script in realtime
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        // Update savedActions if they changed
        if (changes.savedActions) {
            savedActions = changes.savedActions.newValue;
        }
        
        // Update boxColor if it changed
        if (changes.boxColor) {
            // Update any active selection boxes with new color
            if (selectionBox) {
                selectionBox.style.borderColor = changes.boxColor.newValue;
                selectionBox.style.backgroundColor = `${changes.boxColor.newValue}19`;
            }
            
            // Update highlighted links with new color
            selectedLinks.forEach(link => {
                link.style.backgroundColor = `${changes.boxColor.newValue}33`;
            });
        }
    }
});



/**
 * Handles keyboard events for updating the visual styles of the link selection.
 * When the user presses a key while the mouse is down and a selection box is active,
 * this function checks for a matching key combination and updates the current action.
 * It then calls `updateVisualStyles()` to update the appearance of the selection box,
 * highlighted links, and counter label.
 */
document.addEventListener('keydown', (e) => {
    if (isMouseDown && selectionBox) {
        const newMatchedAction = checkKeyCombination(e, currentMouseButton);
        // Store current action before switching
        if (!previousAction) {
            previousAction = currentMatchedAction;
        }
        
        // Update to new action if found
        if (newMatchedAction) {
            previousAction = currentMatchedAction;
            currentMatchedAction = newMatchedAction;
            updateVisualStyles();
        }
    }
});

/**
 * Handles keyboard events for reverting the visual styles of the link selection.
 * When the user releases a key while the mouse is down and a selection box is active,
 * this function reverts the current action to the previous action and calls
 * `updateVisualStyles()` to update the appearance of the selection.
 */
document.addEventListener('keyup', (e) => {
    if (isMouseDown && selectionBox ) {
        const currentKeyState = {
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            button: currentMouseButton // Use stored mouse button
        };

        const matchedAction = checkKeyCombination(currentKeyState, currentMouseButton);
        currentMatchedAction = matchedAction || previousAction || currentMatchedAction;
        updateVisualStyles();
    }
});
/**
 * Updates the visual styles of the link selection based on the current action.
 * This function updates the border color and background color of the selection box,
 * the background color of the highlighted links, and the text content of the counter label.
 */
function updateVisualStyles() {
    if (!currentMatchedAction) return;

    // Update selection box
    selectionBox.style.borderColor = currentMatchedAction.boxColor;
    selectionBox.style.backgroundColor = `${currentMatchedAction.boxColor}19`;
    
    // Update highlighted links
    selectedLinks.forEach(link => {
        link.style.backgroundColor = `${currentMatchedAction.boxColor}33`;
    });
    
    // Update counter label
    if (counterLabel) {
        const urls = Array.from(selectedLinks).map(link => link.href);
        const count = currentMatchedAction.smartSelect === 'on' ? 
            new Set(urls).size : 
            urls.length;
            
        const actionType = 
                currentMatchedAction.openLinks ? 'open' : 
                currentMatchedAction.openWindow ? 'open in window' :
                currentMatchedAction.copyUrlsAndTitles ? 'copy with titles' :
                  'copy';
        counterLabel.textContent = `${count} links to ${actionType}`;
    }
}


/**
 * Cleans up the selection when the window loses focus (e.g. when the user switches to another application).
 */
window.addEventListener('blur', () => {
    cleanupSelection();
});
