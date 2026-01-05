//=============================================================================
// SMART SELECT MODULE
// Pattern-based adaptive link selection for Grabbit
//=============================================================================

const SmartSelect = (() => {
    /**
     * Helper to check visual prominence based on style object
     * @param {CSSStyleDeclaration} style - The computed style
     * @returns {boolean} True if visually prominent
     */
    function isVisuallyProminent(style) {
        const weight = style.fontWeight;
        if (weight === 'bold' || parseInt(weight) >= 600) {
            return true;
        }
        const fontSize = parseFloat(style.fontSize);
        if (fontSize >= 16) {
            return true;
        }
        return false;
    }

    /**
     * Determines if a link is "important" based on heuristics
     * (Headings, ARIA roles, Font weight/size, deep visual check)
     * @param {HTMLAnchorElement} link - The link element
     * @param {CSSStyleDeclaration} style - The computed style of the link
     * @returns {boolean} True if the link is considered important
     */
    function isLinkImportant(link, style) {
        const headingRegex = /^H[1-6]$/;

        // Check immediate parent
        if (link.parentElement && headingRegex.test(link.parentElement.tagName)) return true;

        // Walk up a few levels
        let parentNode = link.parentNode;
        for (let i = 0; i < 3 && parentNode && parentNode !== document.body; i++) {
            if (headingRegex.test(parentNode.nodeName)) {
                return true;
            }
            parentNode = parentNode.parentNode;
        }

        // ARIA Roles
        if (link.getAttribute('role') === 'heading') return true;
        if (link.closest && link.closest('[role="heading"]')) return true;

        // Visual Prominence (Self)
        if (isVisuallyProminent(style)) return true;

        // Deep Inspection (Children)
        if (link.querySelector('h1, h2, h3, h4, h5, h6')) return true;

        const children = Array.from(link.children);
        for (const child of children) {
            if (headingRegex.test(child.tagName)) return true;

            const childStyle = window.getComputedStyle(child);
            if (isVisuallyProminent(childStyle)) return true;

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
     * Generates a signature string for a link to identify its "type".
     * @param {HTMLAnchorElement} link - The link element
     * @param {CSSStyleDeclaration} style - The computed style of the link
     * @returns {string} A signature string for grouping
     */
    function getLinkSignature(link, style) {
        let structureType = 'standard';
        let primaryTag = 'A';

        // Check if it wraps a heading
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

        const isBold = style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600;
        const fontSize = Math.round(parseFloat(style.fontSize) || 0);

        // Create a simple signature string
        // Format: structureType|primaryTag|isBold|fontSize
        return `${structureType}|${primaryTag}|${isBold}|${fontSize}`;
    }

    /**
     * Applies the simplified pattern-based Smart Select algorithm.
     * 
     * Logic:
     * - Count signature frequencies
     * - If no signature repeats (all unique): Select ALL links
     * - If signatures repeat:
     *   - Prioritize "important" repeating signatures
     *   - If no important ones, use all repeating signatures
     * 
     * @param {Array} linksInBox - Array of {link, isImportant, signature} objects
     * @returns {Array} Filtered array of link elements to select
     */
    function apply(linksInBox) {
        if (linksInBox.length === 0) return [];

        // Step 1: Build signature frequency map
        const signatureCounts = new Map();
        const importantSignatures = new Set();

        linksInBox.forEach(item => {
            const sig = item.signature;
            signatureCounts.set(sig, (signatureCounts.get(sig) || 0) + 1);
            if (item.isImportant) {
                importantSignatures.add(sig);
            }
        });

        // Step 2: Find repeating signatures (count >= 2)
        const repeatingSignatures = new Set();
        signatureCounts.forEach((count, sig) => {
            if (count >= 2) {
                repeatingSignatures.add(sig);
            }
        });

        // Step 3: Determine selection logic
        if (repeatingSignatures.size === 0) {
            // No repeats - select ALL links
            return linksInBox.map(item => item.link);
        }

        // Repeats exist - filter by importance
        const importantRepeating = new Set();
        repeatingSignatures.forEach(sig => {
            if (importantSignatures.has(sig)) {
                importantRepeating.add(sig);
            }
        });

        // Choose which signatures to use
        const targetSignatures = importantRepeating.size > 0 ? importantRepeating : repeatingSignatures;

        // Step 4: Filter links to those matching target signatures
        const selectedLinks = linksInBox
            .filter(item => targetSignatures.has(item.signature))
            .map(item => item.link);

        return selectedLinks;
    }

    // Public API
    return {
        apply: apply,
        isLinkImportant: isLinkImportant,
        getLinkSignature: getLinkSignature
    };
})();
