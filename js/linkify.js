/**
 * Linkify Module
 * Scans the document for plain text URLs and converts them to clickable links.
 */

const Linkify = (() => {
    // Regex for matching URLs. This is a simplified version, can be robustified.
    // Matches http/https/ftp or www.
    const URL_REGEX = /((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)|(www\.[^\s/$.?#].[^\s]*)/gi;

    const BLACKLIST_TAGS = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SELECT', 'OPTION'];

    function linkifyNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentNode && BLACKLIST_TAGS.includes(node.parentNode.tagName)) {
                return;
            }

            const text = node.textContent;
            if (!text || text.trim().length === 0) return;

            // Basic check to see if we even need to regex
            if (!text.includes('http') && !text.includes('www.')) return;

            if (URL_REGEX.test(text)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                // Reset regex state
                URL_REGEX.lastIndex = 0;

                let match;
                let foundMatch = false;

                // We need to re-run execution because simple .test() advances index if global
                // But safer to just use matchAll or a loop with exec

                // clone regex to avoid side effects
                const regex = new RegExp(URL_REGEX);

                while ((match = regex.exec(text)) !== null) {
                    foundMatch = true;

                    // Text before match
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                    }

                    const url = match[0];
                    const fullUrl = url.startsWith('www.') ? 'http://' + url : url;

                    const a = document.createElement('a');
                    a.href = fullUrl;
                    a.textContent = url;
                    a.target = '_blank';
                    a.className = 'grabbit-linkified'; // Marker class
                    a.style.textDecoration = 'underline'; // Ensure visibility
                    fragment.appendChild(a);

                    lastIndex = regex.lastIndex;
                }

                if (foundMatch) {
                    // Remaining text
                    if (lastIndex < text.length) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                    }
                    node.parentNode.replaceChild(fragment, node);
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (BLACKLIST_TAGS.includes(node.tagName)) return;

            // Handle Shadow DOM
            if (node.shadowRoot) {
                linkifyContainer(node.shadowRoot);
            }

            // Recurse
            Array.from(node.childNodes).forEach(child => linkifyNode(child));
        }
    }

    function linkifyContainer(container) {
        Array.from(container.childNodes).forEach(child => linkifyNode(child));
    }

    function init() {
        chrome.storage.sync.get(['linkifyEnabled', 'linkifyAggressive'], (result) => {
            if (result.linkifyEnabled) {
                console.log('Grabbit: Linkify enabled (Aggressive: ' + !!result.linkifyAggressive + '). Scanning page...');

                if (result.linkifyAggressive) {
                    // Aggressive regex: handles standard schemes AND domain-only patterns
                    // Now captures subdomains, paths, AND query parameters
                    // The path portion uses [^\s<>] to match paths/queries while avoiding HTML tags and whitespace
                    const AGGRESSIVE_REGEX = /((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)|(www\.[^\s/$.?#].[^\s]*)|([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?:[/][^\s<>]*)?)/gi;

                    // Closure to pass regex
                    function linkifyAggressiveNode(node) {
                        // Original linkifyNode uses URL_REGEX. We'll override the regex used in the loop.
                        // Since Linkify is a module with internal state, let's just re-implement or parameterize.
                        // For simplicity in this logic, we'll temporarily swap the REGEX or call a parameterized version.
                        linkifyNodeParam(node, AGGRESSIVE_REGEX);
                    }

                    linkifyContainerParam(document.body, AGGRESSIVE_REGEX);
                } else {
                    linkifyContainerParam(document.body, URL_REGEX);
                }
            }
        });
    }

    // Refactored to accept regex
    function linkifyNodeParam(node, regexToUse) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentNode && BLACKLIST_TAGS.includes(node.parentNode.tagName)) {
                return;
            }

            const text = node.textContent;
            if (!text || text.trim().length === 0) return;

            // Adjust quick check
            const hasPossibleLink = text.includes('http') || text.includes('www.') || text.includes('.');
            if (!hasPossibleLink) return;

            const regex = new RegExp(regexToUse);
            let match;
            let foundMatch = false;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            while ((match = regex.exec(text)) !== null) {
                foundMatch = true;

                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }

                const url = match[0];
                let fullUrl = url;
                if (url.startsWith('www.')) {
                    fullUrl = 'http://' + url;
                } else if (!url.includes('://')) {
                    fullUrl = 'http://' + url;
                }

                const a = document.createElement('a');
                a.href = fullUrl;
                a.textContent = url;
                a.target = '_blank';
                a.className = 'grabbit-linkified';
                a.style.textDecoration = 'underline';
                fragment.appendChild(a);

                lastIndex = regex.lastIndex;
            }

            if (foundMatch) {
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                }
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (BLACKLIST_TAGS.includes(node.tagName)) return;
            if (node.shadowRoot) linkifyContainerParam(node.shadowRoot, regexToUse);
            Array.from(node.childNodes).forEach(child => linkifyNodeParam(child, regexToUse));
        }
    }

    function linkifyContainerParam(container, regexToUse) {
        Array.from(container.childNodes).forEach(child => linkifyNodeParam(child, regexToUse));
    }

    return {
        init: init
    };
})();

// Auto-init if this script is loaded. 
// Depending on how we load it (module vs part of grabbit.js), we might call it differently.
// For now, let's expose it or run it.
if (typeof window !== 'undefined') {
    // If loaded as a standalone content script
    Linkify.init();
}
