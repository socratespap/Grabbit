/**
 * Linkify Module
 * Scans the document for plain text URLs and converts them to clickable links.
 */

const Linkify = (() => {
    // Regex for matching URLs. This is a simplified version, can be robustified.
    // Matches http/https/ftp or www.
    const URL_REGEX = /((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)|(www\.[^\s/$.?#].[^\s]*)/gi;

    const BLACKLIST_TAGS = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SELECT', 'OPTION', 'CODE', 'PRE'];

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
        chrome.storage.sync.get(['linkifyEnabled'], (result) => {
            if (result.linkifyEnabled) {
                console.log('Grabbit: Linkify enabled. Scanning page...');
                linkifyContainer(document.body);

                // Optional: Observer for dynamic content? 
                // For now, let's just do initial load to be safe/performant.
                // If user requests dynamic, we can add MutationObserver.
            }
        });
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
