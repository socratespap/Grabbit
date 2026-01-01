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

});
