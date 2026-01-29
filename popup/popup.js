/**
 * Grabbit Popup Script
 * Handles button interactions and AI Comparison Dashboard
 */

// Button registry (mirrors popup-config.js)
const POPUP_BUTTONS = {
    copyUrls: {
        id: 'copyUrls',
        title: 'Copy Selected Tabs',
        subtitle: 'Selected tabs only',
        color: 'blue',
        icon: 'copy',
        isPremium: false
    },
    copyAllUrls: {
        id: 'copyAllUrls',
        title: 'Copy All Tabs',
        subtitle: 'All open tabs in window',
        color: 'purple',
        icon: 'clipboard',
        isPremium: false
    },
    openUrls: {
        id: 'openUrls',
        title: 'Open Copied Links',
        subtitle: 'From clipboard',
        color: 'orange',
        icon: 'external',
        isPremium: false
    },
    compareProducts: {
        id: 'compareProducts',
        title: 'Compare Products by AI',
        subtitle: 'Premium Analysis',
        color: 'premium',
        icon: 'layers',
        isPremium: true
    },
    summarizePage: {
        id: 'summarizePage',
        title: 'Summarize Page',
        subtitle: 'AI Article Summary',
        color: 'premium',
        icon: 'document',
        isPremium: true
    }
};

// Get icon SVG HTML
function getButtonIcon(iconName) {
    const icons = {
        copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`,
        clipboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>`,
        external: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>`,
        layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>`,
        document: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`
    };
    return icons[iconName] || icons.copy;
}

// Load popup configuration
async function loadPopupConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['popupConfig'], (result) => {
            resolve(result.popupConfig || {
                buttons: [
                    { id: 'copyUrls', enabled: true, order: 0 },
                    { id: 'copyAllUrls', enabled: true, order: 1 },
                    { id: 'openUrls', enabled: true, order: 2 },
                    { id: 'compareProducts', enabled: true, order: 3 },
                    { id: 'summarizePage', enabled: true, order: 4 }
                ]
            });
        });
    });
}

// Render buttons dynamically
function renderButtons(config, buttonElements) {
    const actionsSection = document.getElementById('actionsSection');
    if (!actionsSection) return;

    // Clear existing content
    actionsSection.innerHTML = '';

    // Filter enabled buttons and sort by order
    const sortedButtons = config.buttons
        .filter(b => b.enabled && POPUP_BUTTONS[b.id])
        .sort((a, b) => a.order - b.order);

    // Create and append each button
    sortedButtons.forEach(buttonConfig => {
        const buttonMeta = POPUP_BUTTONS[buttonConfig.id];
        const button = createActionButton(buttonMeta, buttonConfig.id);
        actionsSection.appendChild(button);

        // Store reference for event listeners
        buttonElements[buttonConfig.id] = button;
    });
}

// Create a single action button
function createActionButton(buttonMeta, buttonId) {
    const button = document.createElement('div');
    button.className = `action-button ${buttonMeta.color}`;
    button.id = buttonId;

    button.innerHTML = `
        <div class="button-icon">
            ${getButtonIcon(buttonMeta.icon)}
        </div>
        <div class="button-content">
            <div class="button-title">${buttonMeta.title}</div>
            <div class="button-subtitle">${buttonMeta.subtitle}</div>
        </div>
        ${buttonMeta.isPremium ? '<span class="pro-badge">PRO</span>' : ''}
    `;

    return button;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Button elements map (will be populated after rendering)
    const buttonElements = {};

    // Modal UI Elements
    const compareModal = document.getElementById('compare-modal');
    const closeCompare = document.getElementById('close-compare');
    const resultsContainer = document.getElementById('compare-results');
    const loadingContainer = document.getElementById('compare-loading');
    const errorContainer = document.getElementById('compare-error');
    const copySummaryBtn = document.getElementById('copy-summary');

    /**
     * Helper: Show Success State on Buttons
     */
    function showSuccess(button, message, originalTitle, originalSubtitle) {
        const titleEl = button.querySelector('.button-title');
        const subtitleEl = button.querySelector('.button-subtitle');
        if (!titleEl || !subtitleEl) return;

        button.classList.add('success');
        titleEl.textContent = message;
        subtitleEl.textContent = 'Success!';

        setTimeout(() => {
            button.classList.remove('success');
            titleEl.textContent = originalTitle;
            subtitleEl.textContent = originalSubtitle;
        }, 2000);
    }

    /**
     * Helper: Show Modal State
     */
    function showModalState(state) {
        loadingContainer.style.display = state === 'loading' ? 'flex' : 'none';
        resultsContainer.style.display = state === 'results' ? 'flex' : 'none';
        errorContainer.style.display = state === 'error' ? 'flex' : 'none';

        if (state === 'results' || state === 'loading' || state === 'error') {
            compareModal.style.display = 'flex';
            document.body.classList.add('modal-open');
        } else {
            compareModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    /**
     * Helper: Update Loading Steps
     */
    function updateLoadingStep(stepId) {
        document.querySelectorAll('.loading-steps .step').forEach(s => s.classList.remove('active'));
        const activeStep = document.getElementById(stepId);
        if (activeStep) activeStep.classList.add('active');
    }

    /**
     * Attach event listeners to buttons
     * This function is called AFTER buttons are rendered
     */
    function attachButtonListeners() {
        // --- STANDARD BUTTON HANDLERS ---

        // Copy Selected Tabs
        if (buttonElements.copyUrls) {
            buttonElements.copyUrls.addEventListener('click', async () => {
                const tabs = await chrome.tabs.query({ currentWindow: true, highlighted: true });
                const urls = tabs.map(tab => tab.url).join('\n');
                await navigator.clipboard.writeText(urls);
                showSuccess(buttonElements.copyUrls, `${tabs.length} URLs Copied!`, 'Copy Selected Tabs', 'Selected tabs only');
            });
        }

        // Copy All Tabs
        if (buttonElements.copyAllUrls) {
            buttonElements.copyAllUrls.addEventListener('click', async () => {
                const tabs = await chrome.tabs.query({ currentWindow: true });
                const urls = tabs.map(tab => tab.url).join('\n');
                await navigator.clipboard.writeText(urls);
                showSuccess(buttonElements.copyAllUrls, `${tabs.length} URLs Copied!`, 'Copy All Tabs', 'All open tabs in window');
            });
        }

        // Open Copied Links
        if (buttonElements.openUrls) {
            buttonElements.openUrls.addEventListener('click', async () => {
                try {
                    const clipboardText = await navigator.clipboard.readText();
                    const urls = clipboardText.split('\n')
                        .filter(url => url.trim().toLowerCase().match(/^https?:\/\/|^www\./))
                        .map(url => url.toLowerCase().startsWith('www.') ? 'https://' + url : url);

                    urls.forEach(url => chrome.tabs.create({ url }));
                    showSuccess(buttonElements.openUrls, `${urls.length} Links Opened!`, 'Open Copied Links', 'From clipboard');
                } catch (error) {
                    console.error(error);
                }
            });
        }

        // --- PREMIUM AI COMPARISON HANDLERS ---

        if (buttonElements.compareProducts) {
            buttonElements.compareProducts.addEventListener('click', async () => {
                // 1. Check Tabs
                const tabs = await chrome.tabs.query({ currentWindow: true, highlighted: true });

                if (tabs.length < 2) {
                    alert('Please select at least 2 product tabs (Ctrl+Click on tabs) to compare.');
                    return;
                }

                if (tabs.length > 5) {
                    alert('AI comparison is limited to 5 products at a time for better accuracy.');
                    return;
                }

                // 2. Store the tabs data for the comparison page
                await chrome.storage.local.set({
                    pendingComparison: {
                        tabs: tabs.map(t => ({ id: t.id, url: t.url, title: t.title })),
                        timestamp: Date.now()
                    }
                });

                // 3. Open the comparison page in a new tab
                chrome.tabs.create({
                    url: chrome.runtime.getURL('AI Features/compare/compare.html')
                });

                // Close popup
                window.close();
            });
        }

        // --- PREMIUM AI SUMMARIZATION HANDLERS ---

        if (buttonElements.summarizePage) {
            buttonElements.summarizePage.addEventListener('click', async () => {
                // 1. Get current active tab
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

                if (!tabs[0]) {
                    alert('Could not access the current tab. Please try again.');
                    return;
                }

                // 2. Store the tab data for the summary page
                await chrome.storage.local.set({
                    pendingSummary: {
                        tab: { id: tabs[0].id, url: tabs[0].url, title: tabs[0].title },
                        timestamp: Date.now()
                    }
                });

                // 3. Open the summary page in a new tab
                chrome.tabs.create({
                    url: chrome.runtime.getURL('AI Features/summarize/summarize.html')
                });

                // Close popup
                window.close();
            });
        }
    }


    function renderResults(data) {
        // Winner Section
        document.getElementById('winner-name').textContent = data.products[data.winner].name;
        document.getElementById('winner-reason').textContent = data.winnerReason;
        document.getElementById('winner-score').textContent = data.products[data.winner].score;
        document.getElementById('winner-price').textContent = data.products[data.winner].price || 'N/A';

        // Table Header
        const tableHead = document.getElementById('table-head');
        tableHead.innerHTML = '<th>Feature</th>';
        data.products.forEach(p => {
            const th = document.createElement('th');
            th.textContent = p.name;
            tableHead.appendChild(th);
        });

        // Table Body
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';
        data.features.forEach(feature => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>${feature.label}</strong></td>`;
            feature.values.forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        // Product Cards
        const productList = document.getElementById('product-list');
        productList.innerHTML = '';
        data.products.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = `product-mini-card ${i === data.winner ? 'winner' : ''}`;
            card.innerHTML = `
                <div class="mini-card-title">${p.name}</div>
                <div class="mini-card-price">${p.price || '--'}</div>
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">Score: ${p.score}/10</div>
            `;
            productList.appendChild(card);
        });

        // Store data for copying
        copySummaryBtn.onclick = () => {
            const summaryText = `AI Product Comparison Results:\n\nWinner: ${data.products[data.winner].name}\nReason: ${data.winnerReason}\n\nOverall Summary: ${data.summary}`;
            navigator.clipboard.writeText(summaryText);
            copySummaryBtn.textContent = 'Copied!';
            setTimeout(() => copySummaryBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Results', 2000);
        };
    }

    closeCompare.addEventListener('click', () => showModalState('none'));

    // --- OTHER UI LOGIC ---

    // Display version and handle update notification
    const versionBadge = document.querySelector('.version-badge');
    if (versionBadge) {
        const manifest = chrome.runtime.getManifest();
        const vText = versionBadge.querySelector('.version-text');
        if (vText) vText.textContent = `v${manifest.version}`;

        chrome.storage.local.get(['updateAvailable'], (result) => {
            if (result.updateAvailable) {
                versionBadge.classList.add('has-update');
                const updateDot = document.querySelector('.update-dot');
                if (updateDot) updateDot.style.display = 'inline-block';
            }
        });

        versionBadge.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.storage.local.set({ updateAvailable: false });
            chrome.tabs.create({ url: 'https://github.com/socratespap/Grabbit/blob/main/changelog.md' });
        });
    }

    // Check for disabled domain
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]?.url) return;
        try {
            const hostname = new URL(tabs[0].url).hostname;
            chrome.storage.sync.get(['disabledDomains'], (result) => {
                const disabled = (result.disabledDomains || []).some(d => hostname.includes(d));
                if (disabled) {
                    const overlay = document.getElementById('disabled-state');
                    if (overlay) overlay.style.display = 'flex';
                    document.querySelector('.actions-section').style.opacity = '0.3';
                    document.querySelector('.actions-section').style.pointerEvents = 'none';

                    document.getElementById('enable-site-btn')?.addEventListener('click', () => {
                        const next = result.disabledDomains.filter(d => !hostname.includes(d));
                        chrome.storage.sync.set({ disabledDomains: next }, () => {
                            chrome.tabs.reload(tabs[0].id);
                            window.close();
                        });
                    });
                }
            });
        } catch (e) { }
    });

    // --- INITIALIZE BUTTONS FROM CONFIGURATION ---
    // Load configuration and render buttons
    const config = await loadPopupConfig();
    renderButtons(config, buttonElements);

    // Attach event listeners to the rendered buttons
    attachButtonListeners();
});
