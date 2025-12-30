//=============================================================================
// UTILITIES
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
