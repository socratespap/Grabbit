//=============================================================================
// UTILITIES
//=============================================================================

/**
 * Detects the user's operating system
 * @returns {string} The detected OS ('mac', 'windows', or 'linux')
 */
function getOS() {
    // Modern API (Chrome 90+, Edge 90+)
    if (navigator.userAgentData?.platform) {
        const platform = navigator.userAgentData.platform.toLowerCase();
        if (platform.includes('mac')) return 'mac';
        if (platform.includes('win')) return 'windows';
        if (platform.includes('linux')) return 'linux';
    }

    // Fallback to userAgent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux')) return 'linux';

    return 'windows'; // Default to Windows
}

/**
 * Checks if a key combination matches a saved action
 * @param {Event} e - The keyboard event
 * @param {string} mouseButton - The mouse button being used
 * @returns {Object|null} The matched action or null if no match
 */
function checkKeyCombination(e, mouseButton) {
    const isMac = getOS() === 'mac';

    return GrabbitState.savedActions.find(action => {
        // First check if mouse buttons match exactly
        const mouseMatch = action.combination.mouseButton === mouseButton;
        if (!mouseMatch) return false;

        // Then check key modifier match based on OS
        let keyMatch = false;

        if (action.combination.key === 'none') {
            // No modifier key required - ensure no modifiers are pressed
            keyMatch = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && GrabbitState.pressedKeys.size === 0;
        } else if (action.combination.key === 'ctrl') {
            // Use metaKey (Command ⌘) on Mac, ctrlKey on other platforms
            keyMatch = isMac ? e.metaKey : e.ctrlKey;
        } else if (action.combination.key === 'shift' || action.combination.key === 'alt') {
            // For shift and alt, use standard properties
            keyMatch = e[`${action.combination.key}Key`];
        } else if (action.combination.key.length === 1 && /^[a-z]$/i.test(action.combination.key)) {
            // For letter keys (A-Z), check if the key is in pressedKeys
            keyMatch = GrabbitState.pressedKeys.has(action.combination.key.toLowerCase());
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
 * Checks if the extension should be disabled for the current domain.
 * @param {string[]} disabledDomains - List of domains to block
 * @param {string} [hostname] - Optional hostname to check (defaults to current window location)
 * @returns {boolean}
 */
function isDomainDisabled(disabledDomains, hostname) {
    if (!disabledDomains || !Array.isArray(disabledDomains)) return false;
    const targetHostname = hostname || window.location.hostname;
    return disabledDomains.some(domain => targetHostname.includes(domain));
}

/**
 * Standard debounce implementation
 */
function debounce(func, wait) {

    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Queries all links in the document, including those inside Shadow DOM
 * @param {Document|ShadowRoot} root - The root element to start searching from
 * @returns {Array<HTMLAnchorElement>} Array of all anchor elements found
 */
function getAllLinks(root = document) {
    const links = [];

    // Get all links in the current root
    const directLinks = root.querySelectorAll('a');
    links.push(...directLinks);

    // Find all elements that might have a shadow root
    const allElements = root.querySelectorAll('*');

    allElements.forEach(element => {
        if (element.shadowRoot) {
            // Recursively query links in the shadow root
            const shadowLinks = getAllLinks(element.shadowRoot);
            links.push(...shadowLinks);
        }
    });

    return links;
}

/**
 * Determines if a link is "important" based on heuristics
 * (Headings, ARIA roles, Font weight/size, deep visual check)
 * @param {HTMLAnchorElement} link - The link element
 * @param {CSSStyleDeclaration} style - The computed style of the link
 * @returns {boolean} True if the link is considered important
 */
function isLinkImportant(link, style) {
    // 1. Semantic Headings (H1-H6) - Check Upwards
    const headingRegex = /^H[1-6]$/;
    // Check immediate parent first (fastest)
    if (link.parentElement && headingRegex.test(link.parentElement.tagName)) return true;

    // Walk up a few levels (e.g. 3) to find a heading tag
    let parentNode = link.parentNode;
    for (let i = 0; i < 3 && parentNode && parentNode !== document.body; i++) {
        if (headingRegex.test(parentNode.nodeName)) {
            return true;
        }
        parentNode = parentNode.parentNode;
    }

    // 2. ARIA Roles
    if (link.getAttribute('role') === 'heading') return true;
    if (link.closest && link.closest('[role="heading"]')) return true;

    // 3. Visual Prominence (Self)
    if (isVisuallyProminent(style)) return true;

    // 4. Deep Inspection (Children)
    // If the link itself isn't bold/large, check if it WRAPS something important
    // Check for H tags inside
    if (link.querySelector('h1, h2, h3, h4, h5, h6')) return true;

    // Check immediate children for visual importance
    // We limit depth to avoid perf hit, just check direct children and maybe one level down
    const children = Array.from(link.children);
    for (const child of children) {
        if (headingRegex.test(child.tagName)) return true; // Direct child is H tag

        const childStyle = window.getComputedStyle(child);
        if (isVisuallyProminent(childStyle)) return true;

        // One more level deep? (e.g. Link > Div > Span(Bold))
        if (child.children.length > 0) {
            const grandChildren = Array.from(child.children);
            for (const grandChild of grandChildren) {
                if (headingRegex.test(grandChild.tagName)) return true;
                const grandChildStyle = window.getComputedStyle(grandChild);
                if (isVisuallyProminent(grandChildStyle)) return true;
            }
        }
    }

    return false;
}

/**
 * Helper to check visual prominence based on style object
 */
function isVisuallyProminent(style) {
    // Check for bold (>= 600 or 'bold')
    const weight = style.fontWeight;
    if (weight === 'bold' || parseInt(weight) >= 600) {
        return true;
    }
    // Check for large font (>= 16px)
    const fontSize = parseFloat(style.fontSize);
    if (fontSize >= 16) {
        return true;
    }
    return false;
}

/**
 * Generates a signature for a link to identifying its "type" for adaptive selection.
 * @param {HTMLAnchorElement} link - The link element
 * @param {CSSStyleDeclaration} style - The computed style of the link
 * @returns {Object} The signature object
 */
function getLinkSignature(link, style) {
    // improved signature to capture "deep" structure
    let structureType = 'standard'; // standard, wrapper-heading, wrapper-bold
    let primaryTag = link.tagName;

    // Check if it's a wrapper
    if (link.querySelector('h1, h2, h3, h4, h5, h6')) {
        structureType = 'wrapper-heading';
        primaryTag = link.querySelector('h1, h2, h3, h4, h5, h6').tagName;
    } else {
        // Check parent for heading
        const headingRegex = /^H[1-6]$/;
        let parentNode = link.parentNode;
        for (let i = 0; i < 3 && parentNode && parentNode !== document.body; i++) {
            if (headingRegex.test(parentNode.nodeName)) {
                structureType = 'inside-heading';
                primaryTag = parentNode.tagName;
                break;
            }
            parentNode = parentNode.parentNode;
        }
    }

    return {
        structureType: structureType,
        primaryTag: primaryTag,
        classList: Array.from(link.classList),
        // If it's a wrapper, 'isBold' might be false on the link itself, but true on child
        // For signature matching, we care about the link's own class/style consistency mostly
        isBold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600,
        fontSize: parseFloat(style.fontSize) || 0
    };
}

/**
 * Checks if a candidate signature matches the reference signature
 * @param {Object} refSig - The signature of the reference link
 * @param {Object} candSig - The signature of the candidate link
 * @returns {boolean} True if they match
 */
function signaturesMatch(refSig, candSig) {
    if (!refSig || !candSig) return false;

    // 1. Structure Match (Wrapper vs Inside-Heading vs Standard)
    if (refSig.structureType !== candSig.structureType) return false;

    // 2. Visual Weight Match (only if not a wrapper, as wrappers might vary on outer style)
    if (refSig.structureType === 'standard' || refSig.structureType === 'inside-heading') {
        if (refSig.isBold !== candSig.isBold) return false;
    }

    // 3. Class Intersection
    if (refSig.classList.length > 0 && candSig.classList.length > 0) {
        const intersection = refSig.classList.filter(c => candSig.classList.includes(c));
        if (intersection.length === 0) return false;
    }

    return true;
}
