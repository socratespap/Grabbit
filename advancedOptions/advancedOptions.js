/**
 * Grabbit Advanced Options JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Advanced Options initialized');

    const linkifyToggle = document.getElementById('linkify-toggle');
    const status = document.getElementById('status');

    if (linkifyToggle) {
        // Load saved settings
        chrome.storage.sync.get(['linkifyEnabled'], (result) => {
            linkifyToggle.checked = result.linkifyEnabled || false;
        });

        // Save settings on change
        linkifyToggle.addEventListener('change', () => {
            const isEnabled = linkifyToggle.checked;
            chrome.storage.sync.set({ linkifyEnabled: isEnabled }, () => {
                showStatus('Settings saved!');
            });
        });
    }

    function showStatus(message) {
        if (!status) return;
        status.textContent = message;
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    }
});
