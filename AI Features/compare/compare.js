/**
 * Shopping Comparison Page
 * Friendly, human-centered product comparison
 */

// State
let comparisonData = null;
let selectedTabs = [];

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const resultsState = document.getElementById('results-state');

/**
 * Initialize the comparison page
 */
async function init() {
    // Get the tabs data from storage
    const stored = await chrome.storage.local.get(['pendingComparison']);

    if (!stored.pendingComparison || !stored.pendingComparison.tabs?.length) {
        showError('No products to compare. Please select tabs from the popup.');
        return;
    }

    selectedTabs = stored.pendingComparison.tabs;

    // Clear the pending comparison
    await chrome.storage.local.remove(['pendingComparison']);

    // Start the comparison
    runComparison();
}

/**
 * Run the comparison
 */
async function runComparison() {
    showLoading();

    try {
        // Add a small delay for visual smoothness
        await delay(600);

        // Send comparison request to background
        const response = await chrome.runtime.sendMessage({
            action: 'compareProducts',
            tabs: selectedTabs
        });

        if (response.error) {
            // Handle different error types
            if (response.error === 'Premium required') {
                chrome.runtime.sendMessage({ action: 'openPaymentPage' });
                showError('Premium subscription required. Opening payment page...');
                return;
            }

            if (response.error.includes('Subscription not active') ||
                response.error.includes('subscription')) {
                showError('Your subscription is not active. Please check your payment.');
                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: 'openPaymentPage' });
                }, 2000);
                return;
            }

            if (response.error.includes('Daily limit') ||
                response.error.includes('limit reached')) {
                showError('Daily comparison limit reached. Try again tomorrow!');
                return;
            }

            throw new Error(response.error);
        }

        comparisonData = response.results;

        // Show quota if available
        if (comparisonData._remaining !== undefined) {
            const actionsBar = document.querySelector('.actions-bar');
            if (actionsBar) {
                // Remove existing if present
                const existing = document.getElementById('quota-display');
                if (existing) existing.remove();

                const quotaEl = document.createElement('div');
                quotaEl.id = 'quota-display';
                quotaEl.style.cssText = 'width: 100%; text-align: center; font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 1rem; opacity: 0.8;';
                quotaEl.textContent = `Comparisons remaining today: ${comparisonData._remaining}`;

                actionsBar.insertAdjacentElement('afterend', quotaEl);
            }
        }

        renderResults(comparisonData);
        showResults();

    } catch (error) {
        console.error('Comparison failed:', error);
        showError(error.message);
    }
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    resultsState.classList.add('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    resultsState.classList.add('hidden');
    document.getElementById('error-message').textContent = message;
}

/**
 * Show results state
 */
function showResults() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultsState.classList.remove('hidden');
}

/**
 * Render comparison results
 */
function renderResults(data) {
    // Top Pick Banner
    const topProduct = data.products[data.winner];
    document.getElementById('top-pick-name').textContent = topProduct?.name || 'Best Choice';
    document.getElementById('top-pick-reason').textContent = data.winnerReason || '';

    // Summary
    document.getElementById('summary-text').textContent = data.summary || '';

    // Products Grid
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';

    data.products.forEach((product, index) => {
        const isTopPick = index === data.winner;
        const card = document.createElement('div');
        card.className = `product-card ${isTopPick ? 'is-top-pick' : ''}`;
        card.dataset.url = selectedTabs[index]?.url || '';

        // Build the card HTML
        card.innerHTML = `
            ${isTopPick ? `
                <div style="position: absolute; top: 1rem; right: 1rem; background: var(--color-primary); color: white; font-size: 0.6875rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); letter-spacing: 0.05em;">
                    TOP PICK
                </div>
            ` : ''}
            <div class="p-header">
                <div class="p-name">${escapeHtml(product.name)}</div>
                <div class="p-price">${escapeHtml(product.price || 'Price N/A')}</div>
                ${product.rating ? `
                    <div class="p-rating">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        ${escapeHtml(product.rating)}
                    </div>
                ` : ''}
            </div>

            <div class="p-score-row">
                <span class="p-score-label">Our Score</span>
                <span class="p-score-value">${(product.score || 0).toFixed(1)}<span style="color:var(--color-text-muted); font-size:0.75rem; font-weight:400;">/10</span></span>
            </div>
            <div class="p-score-bar">
                <div class="p-score-fill" style="width: ${((product.score || 0) / 10) * 100}%"></div>
            </div>

            <div class="p-lists">
                <div class="p-list p-pros">
                    <h4>Why you'll like it</h4>
                    <ul>
                        ${(product.pros || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>
                <div class="p-list p-cons">
                    <h4>Things to know</h4>
                    <ul>
                        ${(product.cons || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="p-best-for">
                <strong>Great for:</strong> ${escapeHtml(product.bestFor || 'Everyday use')}
            </div>
        `;

        // Click to open product
        card.addEventListener('click', () => {
            if (card.dataset.url) {
                chrome.tabs.create({ url: card.dataset.url });
            }
        });

        productsGrid.appendChild(card);
    });

    // Feature Table
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');

    tableHeader.innerHTML = '<th>Feature</th>' +
        data.products.map(p => `<th>${escapeHtml(p.name.substring(0, 25))}${p.name.length > 25 ? '…' : ''}</th>`).join('');

    tableBody.innerHTML = '';
    (data.features || []).forEach(feature => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${escapeHtml(feature.label)}</td>` +
            (feature.values || []).map(v => `<td>${escapeHtml(v)}</td>`).join('');
        tableBody.appendChild(row);
    });

    // Bottom Line
    document.getElementById('verdict-text').textContent = data.verdict || '';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Helper: Delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Event Listeners
document.getElementById('close-btn').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
});

document.getElementById('retry-btn').addEventListener('click', () => {
    if (selectedTabs.length) {
        runComparison();
    } else {
        window.close();
    }
});

document.getElementById('copy-summary').addEventListener('click', async () => {
    if (comparisonData) {
        const text = `${comparisonData.summary}\n\nTop Pick: ${comparisonData.products[comparisonData.winner]?.name}\n\n${comparisonData.verdict}`;
        await navigator.clipboard.writeText(text);

        const btn = document.getElementById('copy-summary');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    }
});

document.getElementById('open-top-pick').addEventListener('click', () => {
    if (comparisonData && selectedTabs[comparisonData.winner]) {
        chrome.tabs.create({ url: selectedTabs[comparisonData.winner].url });
    }
});

// Initialize
init();
