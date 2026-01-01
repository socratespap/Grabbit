/**
 * Grabbit Popup Script
 * Handles button interactions for the popup UI
 */

document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copyUrls');
    const copyAllButton = document.getElementById('copyAllUrls');
    const openButton = document.getElementById('openUrls');

    /**
     * Helper function to show success state on a button
     * @param {HTMLElement} button - The button element
     * @param {string} message - Success message to display
     * @param {string} originalTitle - Original title to restore
     * @param {string} originalSubtitle - Original subtitle to restore
     */
    function showSuccess(button, message, originalTitle, originalSubtitle) {
        const titleEl = button.querySelector('.button-title');
        const subtitleEl = button.querySelector('.button-subtitle');

        button.classList.add('success');
        titleEl.textContent = message;
        subtitleEl.textContent = 'Success!';

        setTimeout(() => {
            button.classList.remove('success');
            titleEl.textContent = originalTitle;
            subtitleEl.textContent = originalSubtitle;
        }, 2000);
    }

    // Copy Selected Tabs functionality
    copyButton.addEventListener('click', async () => {
        const tabs = await chrome.tabs.query({
            currentWindow: true,
            highlighted: true
        });

        const urls = tabs.map(tab => tab.url);
        const formattedUrls = urls.join('\n');
        await navigator.clipboard.writeText(formattedUrls);

        showSuccess(
            copyButton,
            `${tabs.length} URL${tabs.length !== 1 ? 's' : ''} Copied!`,
            'Copy Selected Tabs',
            'Selected tabs only'
        );
    });

    // Copy All Tabs functionality
    copyAllButton.addEventListener('click', async () => {
        const tabs = await chrome.tabs.query({
            currentWindow: true
        });

        const urls = tabs.map(tab => tab.url);
        const formattedUrls = urls.join('\n');
        await navigator.clipboard.writeText(formattedUrls);

        showSuccess(
            copyAllButton,
            `${tabs.length} URL${tabs.length !== 1 ? 's' : ''} Copied!`,
            'Copy All Tabs',
            'All open tabs in window'
        );
    });

    // Open Copied Links functionality
    openButton.addEventListener('click', async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const urls = clipboardText.split('\n')
                .filter(url => url.trim())
                .filter(url => {
                    // Check if URL starts with http://, https://, or www.
                    return url.toLowerCase().startsWith('http://') ||
                        url.toLowerCase().startsWith('https://') ||
                        url.toLowerCase().startsWith('www.');
                })
                .map(url => {
                    // Add https:// to URLs starting with www.
                    if (url.toLowerCase().startsWith('www.')) {
                        return 'https://' + url;
                    }
                    return url;
                });

            // Open urls in new tabs
            urls.forEach(url => {
                chrome.tabs.create({ url: url });
            });

            showSuccess(
                openButton,
                `${urls.length} Link${urls.length !== 1 ? 's' : ''} Opened!`,
                'Open Copied Links',
                'From clipboard'
            );
        } catch (error) {
            console.error('Error accessing clipboard:', error);
            const titleEl = openButton.querySelector('.button-title');
            const subtitleEl = openButton.querySelector('.button-subtitle');

            titleEl.textContent = 'Clipboard Error';
            subtitleEl.textContent = 'Check permissions';

            setTimeout(() => {
                titleEl.textContent = 'Open Copied Links';
                subtitleEl.textContent = 'From clipboard';
            }, 2000);
        }
    });

    // Display version from manifest
    const versionBadge = document.querySelector('.version-badge');
    if (versionBadge) {
        const manifest = chrome.runtime.getManifest();
        versionBadge.textContent = `v${manifest.version}`;
    }

    // Check for disabled domain
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0] || !tabs[0].url) return;
        const currentUrl = tabs[0].url;
        let hostname;
        try {
            hostname = new URL(currentUrl).hostname;
        } catch (e) {
            return; // Invalid URL
        }

        chrome.storage.sync.get(['disabledDomains'], (result) => {
            const disabledDomains = result.disabledDomains || [];
            
            // Simple domain check logic (similar to utils.js but inline to avoid dependencies)
            const isDisabled = disabledDomains.some(domain => hostname.includes(domain));

            if (isDisabled) {
                // Show disabled UI
                const disabledState = document.getElementById('disabled-state');
                const actionsSection = document.querySelector('.actions-section');
                const enableBtn = document.getElementById('enable-site-btn');

                if (disabledState) {
                    disabledState.style.display = 'flex';
                }
                
                if (actionsSection) {
                    actionsSection.style.opacity = '0.3';
                    actionsSection.style.pointerEvents = 'none';
                }

                // Handle enable button
                if (enableBtn) {
                    enableBtn.addEventListener('click', () => {
                        const newDomains = disabledDomains.filter(d => !hostname.includes(d));
                        chrome.storage.sync.set({ disabledDomains: newDomains }, () => {
                            chrome.tabs.reload(tabs[0].id);
                            window.close();
                        });
                    });
                }
            }
        });
    });
});
