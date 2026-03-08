/**
 * Duplicate Link Highlighter Module
 * Highlights links that appear more than once on the page.
 */

const DuplicateHighlighter = (() => {
    let highlightedElements = [];
    let observer = null;

    /**
     * Generates a random color using HSL for better control over lightness and saturation.
     * Ensures the color is vibrant and not too close to black or white.
     */
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 75 + Math.floor(Math.random() * 25); // 75-100%
        const lightness = 45 + Math.floor(Math.random() * 10); // 45-55%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * Scans the page for links, identifies duplicates by their href,
     * and applies a colored underline to them.
     */
    function highlightDuplicates() {
        // We don't necessarily want to clear everything if we are doing incremental updates,
        // but for simplicity and correctness with dynamic content, we clear and re-apply.
        clearHighlights();

        // Use utility function if available to include Shadow DOM links
        const links = typeof getAllLinks === 'function' ? getAllLinks() : Array.from(document.querySelectorAll('a[href]'));
        const linkGroups = {};

        links.forEach(link => {
            // Get absolute URL
            try {
                const href = link.href;
                // Skip empty, anchors, or javascript links
                if (!href || href.startsWith('javascript:') || href.startsWith('data:') || href === window.location.href + '#') return;
                
                // Normalizing URL (removing trailing slash for better matching)
                const normalizedHref = href.replace(/\/$/, "");

                if (!linkGroups[normalizedHref]) {
                    linkGroups[normalizedHref] = [];
                }
                linkGroups[normalizedHref].push(link);
            } catch (e) {
                // Ignore invalid URLs
            }
        });

        Object.keys(linkGroups).forEach(href => {
            const group = linkGroups[href];
            if (group.length > 1) {
                const color = getRandomColor();
                group.forEach(link => {
                    // Apply highlight using border-bottom
                    // We use !important to ensure it shows up over site styles
                    link.style.setProperty('border-bottom', `3px solid ${color}`, 'important');
                    link.classList.add('grabbit-duplicate-highlight');
                    highlightedElements.push(link);
                });
            }
        });
    }

    /**
     * Removes all highlights applied by this module.
     */
    function clearHighlights() {
        highlightedElements.forEach(el => {
            if (el) {
                el.style.removeProperty('border-bottom');
                el.classList.remove('grabbit-duplicate-highlight');
            }
        });
        highlightedElements = [];
    }

    /**
     * Initializes the module based on user settings.
     */
    function init() {
        chrome.storage.sync.get(['duplicateHighlighterEnabled', 'disabledDomains'], (result) => {
            // Use utility function if available, otherwise fallback
            const isDisabled = typeof isDomainDisabled === 'function' 
                ? isDomainDisabled(result.disabledDomains || [])
                : false;

            if (isDisabled) {
                console.log('Grabbit Duplicate Highlighter: Disabled on this domain.');
                return;
            }

            if (result.duplicateHighlighterEnabled) {
                console.log('Grabbit: Duplicate Highlighter enabled. Scanning page...');
                
                // Initial highlight
                highlightDuplicates();

                // Setup observer for dynamic content (infinite scroll, etc.)
                // Use debounce from utils.js if available
                const debounceFunc = typeof debounce === 'function' ? debounce : (fn, ms) => {
                    let timeout;
                    return (...args) => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => fn.apply(this, args), ms);
                    };
                };

                if (observer) observer.disconnect();
                
                observer = new MutationObserver(debounceFunc(() => {
                    highlightDuplicates();
                }, 1000));
                
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                clearHighlights();
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
            }
        });

        // Listen for settings changes
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.duplicateHighlighterEnabled) {
                init(); // Re-initialize when setting changes
            }
        });
    }

    return {
        init,
        clearHighlights
    };
})();

// Auto-init
if (typeof window !== 'undefined') {
    DuplicateHighlighter.init();
}
