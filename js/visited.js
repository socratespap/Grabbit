//=============================================================================
// GRABBIT VISITED LINKS TRACKING
//=============================================================================
// This module provides persistent "visited" marking for links opened via Grabbit.
// Since browser :visited styling depends on exact URL matching (which fails for
// redirect URLs like Google Search), this module uses chrome.storage.local to
// track opened URLs and applies a custom CSS class to visually mark them.
//=============================================================================

const GRABBIT_VISITED_STORAGE_KEY = 'grabbit_visited_urls';
const GRABBIT_VISITED_CLASS = 'grabbit-visited';

/**
 * Injects the CSS styles for visited links into the page.
 * This is called once on page load.
 */
function injectGrabbitVisitedStyles() {
    // Check if styles are already injected
    if (document.getElementById('grabbit-visited-styles')) return;

    const style = document.createElement('style');
    style.id = 'grabbit-visited-styles';
    style.textContent = `
        .${GRABBIT_VISITED_CLASS},
        .${GRABBIT_VISITED_CLASS}:link,
        .${GRABBIT_VISITED_CLASS}:visited {
            color: #551A8B !important; /* Standard visited link purple */
        }
    `;
    document.head.appendChild(style);
}

/**
 * Applies the grabbit-visited class to all anchor elements on the page
 * that match any of the stored visited URLs.
 * This is called on page load to restore visited state.
 */
function applyGrabbitVisitedStyling() {
    chrome.storage.local.get([GRABBIT_VISITED_STORAGE_KEY], (result) => {
        const visitedUrls = result[GRABBIT_VISITED_STORAGE_KEY] || [];
        if (visitedUrls.length === 0) return;

        // Create a Set for faster lookup
        const visitedSet = new Set(visitedUrls);

        // Find all anchors and mark those that match
        const allAnchors = document.querySelectorAll('a[href]');
        allAnchors.forEach(anchor => {
            if (visitedSet.has(anchor.href)) {
                anchor.classList.add(GRABBIT_VISITED_CLASS);
            }
        });
    });
}

/**
 * Marks links as visited by storing their URLs and applying the visited class.
 * @param {string[]} urls - Array of URLs to mark as visited
 * @param {HTMLAnchorElement[]} [anchorElements] - Optional array of anchor elements to mark immediately
 */
function markLinksAsGrabbitVisited(urls, anchorElements = []) {
    if (!urls || urls.length === 0) return;

    // Store URLs in chrome.storage.local
    chrome.storage.local.get([GRABBIT_VISITED_STORAGE_KEY], (result) => {
        const existingUrls = result[GRABBIT_VISITED_STORAGE_KEY] || [];

        // Merge and deduplicate URLs
        const allUrls = [...new Set([...existingUrls, ...urls])];

        // Store updated list (limit to last 10000 URLs to prevent unbounded growth)
        const urlsToStore = allUrls.slice(-10000);

        chrome.storage.local.set({ [GRABBIT_VISITED_STORAGE_KEY]: urlsToStore });
    });

    // Immediately apply class to provided anchor elements
    anchorElements.forEach(anchor => {
        if (anchor && anchor.classList) {
            anchor.classList.add(GRABBIT_VISITED_CLASS);
        }
    });

    // Also try to find and mark any other anchors on the page with matching URLs
    const urlSet = new Set(urls);
    const allAnchors = document.querySelectorAll('a[href]');
    allAnchors.forEach(anchor => {
        if (urlSet.has(anchor.href)) {
            anchor.classList.add(GRABBIT_VISITED_CLASS);
        }
    });
}

// Initialize on page load
chrome.storage.sync.get(['disabledDomains'], (result) => {
    if (result.disabledDomains && isDomainDisabled(result.disabledDomains)) {
        return;
    }

    injectGrabbitVisitedStyles();
    applyGrabbitVisitedStyling();
});
