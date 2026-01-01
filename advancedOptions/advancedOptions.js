/**
 * Grabbit Advanced Options JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Advanced Options initialized');

    const linkifyToggle = document.getElementById('linkify-toggle');
    const linkifyAggressive = document.getElementById('linkify-aggressive');
    const aggressiveContainer = document.getElementById('linkify-aggressive-container');
    const status = document.getElementById('status');

    if (linkifyToggle && linkifyAggressive) {
        // Load saved settings
        chrome.storage.sync.get(['linkifyEnabled', 'linkifyAggressive'], (result) => {
            linkifyToggle.checked = result.linkifyEnabled || false;
            linkifyAggressive.checked = result.linkifyAggressive || false;
            updateAggressiveUI();
        });

        // Save settings on change
        linkifyToggle.addEventListener('change', () => {
            chrome.storage.sync.set({ linkifyEnabled: linkifyToggle.checked }, () => {
                showStatus('Settings saved!');
                updateAggressiveUI();
            });
        });

        linkifyAggressive.addEventListener('change', () => {
            chrome.storage.sync.set({ linkifyAggressive: linkifyAggressive.checked }, () => {
                showStatus('Settings saved!');
            });
        });

        function updateAggressiveUI() {
            if (linkifyToggle.checked) {
                aggressiveContainer.style.display = 'flex';
            } else {
                aggressiveContainer.style.display = 'none';
            }
        }
    }

    function showStatus(message) {
        if (!status) return;
        status.textContent = message;
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    }
});
