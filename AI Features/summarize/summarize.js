/**
 * Article Summary Page
 * AI-powered article summarization
 */

// State
let summaryData = null;
let articleTab = null;

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const resultsState = document.getElementById('results-state');

/**
 * Initialize the summary page
 */
async function init() {
    // Get the tab data from storage
    const stored = await chrome.storage.local.get(['pendingSummary']);

    if (!stored.pendingSummary || !stored.pendingSummary.tab) {
        showError('No article to summarize. Please try again from the popup.');
        return;
    }

    articleTab = stored.pendingSummary.tab;

    // Clear the pending summary
    await chrome.storage.local.remove(['pendingSummary']);

    // Start the summarization
    runSummary();
}

/**
 * Run the summary
 */
async function runSummary() {
    showLoading();

    try {
        // Add a small delay for visual smoothness
        await delay(600);

        // Send summary request to background
        const response = await chrome.runtime.sendMessage({
            action: 'summarizePage',
            tab: articleTab
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
                showError('Daily summary limit reached. Try again tomorrow!');
                return;
            }

            throw new Error(response.error);
        }

        summaryData = response.results;

        // Show quota if available
        if (summaryData._remaining !== undefined) {
            const actionsBar = document.querySelector('.actions-bar');
            if (actionsBar) {
                // Remove existing if present
                const existing = document.getElementById('quota-display');
                if (existing) existing.remove();

                const quotaEl = document.createElement('div');
                quotaEl.id = 'quota-display';
                quotaEl.style.cssText = 'width: 100%; text-align: center; font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 1rem; opacity: 0.8;';
                quotaEl.textContent = `Summaries remaining today: ${summaryData._remaining}`;

                actionsBar.insertAdjacentElement('afterend', quotaEl);
            }
        }

        renderResults(summaryData);
        showResults();

    } catch (error) {
        console.error('Summary failed:', error);
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
 * Render summary results
 */
function renderResults(data) {
    // Article Info
    document.getElementById('article-title').textContent = data.title || articleTab.title || 'Article Summary';
    document.getElementById('article-source').textContent = `Source: ${new URL(articleTab.url).hostname}`;

    // Summary
    document.getElementById('summary-text').textContent = data.summary || '';

    // Key Points
    const keyPointsList = document.getElementById('key-points-list');
    keyPointsList.innerHTML = '';
    (data.keyPoints || []).forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPointsList.appendChild(li);
    });

    // Topics (optional)
    if (data.topics && data.topics.length > 0) {
        const topicsSection = document.getElementById('topics-section');
        const topicsList = document.getElementById('topics-list');
        topicsList.innerHTML = '';

        data.topics.forEach(topic => {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = topic;
            topicsList.appendChild(tag);
        });

        topicsSection.classList.remove('hidden');
    } else {
        document.getElementById('topics-section').classList.add('hidden');
    }

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
    if (articleTab) {
        runSummary();
    } else {
        window.close();
    }
});

document.getElementById('copy-summary').addEventListener('click', async () => {
    if (summaryData) {
        const text = `Article Summary: ${summaryData.title || articleTab.title}\n\nSummary:\n${summaryData.summary}\n\nKey Takeaways:\n${(summaryData.keyPoints || []).map(p => `• ${p}`).join('\n')}\n\n${summaryData.verdict}`;
        await navigator.clipboard.writeText(text);

        const btn = document.getElementById('copy-summary');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    }
});

document.getElementById('open-article').addEventListener('click', () => {
    if (articleTab) {
        chrome.tabs.create({ url: articleTab.url });
    }
});

// Initialize
init();
