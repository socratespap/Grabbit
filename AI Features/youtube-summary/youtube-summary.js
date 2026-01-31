/**
 * YouTube Summary Page
 * AI-powered video summarization using transcript data
 */

// State
let summaryData = null;
let videoTab = null;

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const resultsState = document.getElementById('results-state');

/**
 * Initialize the YouTube summary page
 */
async function init() {
    // Get the tab data from storage
    const stored = await chrome.storage.local.get(['pendingYoutubeSummary']);

    if (!stored.pendingYoutubeSummary || !stored.pendingYoutubeSummary.tab) {
        showError('No video to summarize. Please try again from the popup.');
        return;
    }

    videoTab = stored.pendingYoutubeSummary.tab;

    // Clear the pending summary
    await chrome.storage.local.remove(['pendingYoutubeSummary']);

    // Start the summarization
    runSummary();
}

/**
 * Run the summary
 */
async function runSummary() {
    showLoading();

    try {
        // Update loading step
        await delay(400);
        updateLoadingStep('step-extract');

        // Send summary request to background
        const response = await chrome.runtime.sendMessage({
            action: 'summarizeYoutube',
            tab: videoTab
        });

        // Update loading step
        updateLoadingStep('step-analyze');
        await delay(300);

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

            if (response.error.includes('Monthly limit') ||
                response.error.includes('limit reached')) {
                showError('Monthly summary limit reached. Try again next month!');
                return;
            }

            if (response.error.includes('No transcript') ||
                response.error.includes('captions')) {
                showError('No transcript available for this video. The video may not have captions enabled.');
                return;
            }

            throw new Error(response.error);
        }

        // Update loading step
        updateLoadingStep('step-render');
        await delay(300);

        summaryData = response.results;

        // Show quota if available
        if (summaryData._remaining !== undefined) {
            const actionsBar = document.querySelector('.actions-bar');
            if (actionsBar) {
                const existing = document.getElementById('quota-display');
                if (existing) existing.remove();

                const quotaEl = document.createElement('div');
                quotaEl.id = 'quota-display';
                quotaEl.style.cssText = 'width: 100%; text-align: center; font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 1rem; opacity: 0.8;';
                quotaEl.textContent = `AI calls remaining this month: ${summaryData._remaining}`;

                actionsBar.insertAdjacentElement('afterend', quotaEl);
            }
        }

        renderResults(summaryData);
        showResults();

    } catch (error) {
        console.error('YouTube Summary failed:', error);
        showError(error.message);
    }
}

/**
 * Update loading step indicator
 */
function updateLoadingStep(stepId) {
    document.querySelectorAll('.loading-steps .step').forEach(s => s.classList.remove('active'));
    const activeStep = document.getElementById(stepId);
    if (activeStep) activeStep.classList.add('active');
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.classList.remove('hidden');
    loadingState.style.display = 'flex';
    errorState.classList.add('hidden');
    resultsState.classList.add('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    loadingState.classList.add('hidden');
    loadingState.style.display = 'none';
    errorState.classList.remove('hidden');
    resultsState.classList.add('hidden');
    document.getElementById('error-message').textContent = message;
}

/**
 * Show results state
 */
function showResults() {
    loadingState.classList.add('hidden');
    loadingState.style.display = 'none';
    errorState.classList.add('hidden');
    resultsState.classList.remove('hidden');
}

/**
 * Extract video ID from YouTube URL
 */
function getVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}

/**
 * Render summary results
 */
function renderResults(data) {
    // Video Info
    const videoId = getVideoId(videoTab.url);
    const thumbnail = document.getElementById('video-thumbnail');

    if (videoId) {
        thumbnail.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        thumbnail.onerror = () => {
            // Fallback to lower resolution
            thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        };
    }

    document.getElementById('video-title').textContent = data.title || videoTab.title || 'Video Summary';
    document.getElementById('video-channel').textContent = data.channel || '';

    // Make thumbnail clickable to open video
    document.querySelector('.thumbnail-wrapper').addEventListener('click', () => {
        chrome.tabs.create({ url: videoTab.url });
    });

    // Overall Summary
    document.getElementById('overall-summary').textContent = data.overallSummary || data.summary || '';

    // Key Points
    const keyPointsList = document.getElementById('key-points-list');
    keyPointsList.innerHTML = '';
    (data.keyPoints || []).forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPointsList.appendChild(li);
    });

    // Chapters Navigation & Summaries
    const chaptersNav = document.getElementById('chapters-nav');
    const chaptersList = document.getElementById('chapters-list');
    const chapterSummaries = document.getElementById('chapter-summaries');
    const chaptersSection = document.getElementById('chapters-section');

    if (data.chapters && data.chapters.length > 0) {
        chaptersNav.style.display = 'block';
        chaptersSection.style.display = 'block';
        chaptersList.innerHTML = '';
        chapterSummaries.innerHTML = '';

        data.chapters.forEach((chapter, index) => {
            // Navigation item
            const li = document.createElement('li');
            li.className = 'chapter-item';
            li.dataset.index = index;
            li.innerHTML = `
                <span class="chapter-timestamp">${chapter.timestamp || ''}</span>
                <span class="chapter-name">${chapter.title || `Chapter ${index + 1}`}</span>
            `;
            li.addEventListener('click', () => scrollToChapter(index));
            chaptersList.appendChild(li);

            // Summary card with expandable content
            const card = document.createElement('div');
            card.className = 'chapter-summary-card';
            card.id = `chapter-${index}`;

            // Use shortSummary if available, fallback to summary
            const shortSummary = chapter.shortSummary || chapter.summary || '';
            const detailedSummary = chapter.detailedSummary || '';
            const hasDetails = detailedSummary && detailedSummary !== shortSummary;

            card.innerHTML = `
                <div class="chapter-summary-header">
                    <span class="chapter-summary-timestamp">${chapter.timestamp || ''}</span>
                    <span class="chapter-summary-title">${chapter.title || `Chapter ${index + 1}`}</span>
                </div>
                <p class="chapter-summary-text chapter-short">${shortSummary}</p>
                ${hasDetails ? `
                    <div class="chapter-detailed hidden">
                        <p class="chapter-summary-text">${detailedSummary}</p>
                    </div>
                    <button class="expand-btn" data-expanded="false">
                        <svg class="expand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        <span class="expand-text">Show detailed summary</span>
                    </button>
                ` : ''}
            `;

            // Add expand/collapse functionality
            if (hasDetails) {
                const expandBtn = card.querySelector('.expand-btn');
                expandBtn.addEventListener('click', () => toggleChapterDetails(card, expandBtn));
            }

            chapterSummaries.appendChild(card);
        });
    } else {
        // No chapters - hide chapters UI
        chaptersNav.style.display = 'none';
        chaptersSection.style.display = 'none';
    }

    // Topics
    const topicsSection = document.getElementById('topics-section');
    const topicsList = document.getElementById('topics-list');

    if (data.topics && data.topics.length > 0) {
        topicsSection.classList.remove('hidden');
        topicsList.innerHTML = '';

        data.topics.forEach(topic => {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = topic;
            topicsList.appendChild(tag);
        });
    } else {
        topicsSection.classList.add('hidden');
    }
}

/**
 * Scroll to and highlight a chapter summary
 */
function scrollToChapter(index) {
    // Update active chapter in navigation
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.index) === index);
    });

    // Scroll to chapter summary
    const chapterCard = document.getElementById(`chapter-${index}`);
    if (chapterCard) {
        chapterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight briefly
        chapterCard.classList.add('highlight');
        setTimeout(() => chapterCard.classList.remove('highlight'), 2000);
    }
}

/**
 * Toggle chapter detailed summary visibility
 */
function toggleChapterDetails(card, btn) {
    const detailed = card.querySelector('.chapter-detailed');
    const shortText = card.querySelector('.chapter-short');
    const isExpanded = btn.dataset.expanded === 'true';

    if (isExpanded) {
        // Collapse
        detailed.classList.add('hidden');
        shortText.classList.remove('hidden');
        btn.dataset.expanded = 'false';
        btn.querySelector('.expand-text').textContent = 'Show detailed summary';
        btn.querySelector('.expand-icon').style.transform = 'rotate(0deg)';
    } else {
        // Expand
        detailed.classList.remove('hidden');
        shortText.classList.add('hidden');
        btn.dataset.expanded = 'true';
        btn.querySelector('.expand-text').textContent = 'Show short summary';
        btn.querySelector('.expand-icon').style.transform = 'rotate(180deg)';
    }
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
    if (videoTab) {
        runSummary();
    } else {
        window.close();
    }
});

document.getElementById('copy-summary').addEventListener('click', async () => {
    if (summaryData) {
        let text = `YouTube Video Summary: ${summaryData.title || videoTab.title}\n\n`;
        text += `Summary:\n${summaryData.overallSummary || summaryData.summary || ''}\n\n`;

        if (summaryData.keyPoints && summaryData.keyPoints.length > 0) {
            text += `Key Takeaways:\n${summaryData.keyPoints.map(p => `• ${p}`).join('\n')}\n\n`;
        }

        if (summaryData.chapters && summaryData.chapters.length > 0) {
            text += `Chapter Breakdown:\n`;
            summaryData.chapters.forEach(ch => {
                const summary = ch.detailedSummary || ch.shortSummary || ch.summary || '';
                text += `\n[${ch.timestamp}] ${ch.title}\n${summary}\n`;
            });
        }

        await navigator.clipboard.writeText(text);

        const btn = document.getElementById('copy-summary');
        const originalText = btn.innerHTML;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }
});

document.getElementById('open-video').addEventListener('click', () => {
    if (videoTab) {
        chrome.tabs.create({ url: videoTab.url });
    }
});

// Download as Text file
document.getElementById('download-txt').addEventListener('click', () => {
    if (!summaryData) return;

    const text = generateSummaryText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const filename = sanitizeFilename(summaryData.title || videoTab.title || 'youtube-summary') + '.txt';
    downloadBlob(blob, filename);
});

// Download as HTML page
document.getElementById('download-html').addEventListener('click', async () => {
    if (!summaryData) return;

    const html = await generateStandaloneHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = sanitizeFilename(summaryData.title || videoTab.title || 'youtube-summary') + '.html';
    downloadBlob(blob, filename);
});

/**
 * Generate plain text summary (same format as copy)
 */
function generateSummaryText() {
    let text = `YouTube Video Summary: ${summaryData.title || videoTab.title}\n`;
    text += `URL: ${videoTab.url}\n\n`;
    text += `═══════════════════════════════════════════════════════════════\n\n`;
    text += `SUMMARY\n`;
    text += `───────────────────────────────────────────────────────────────\n`;
    text += `${summaryData.overallSummary || summaryData.summary || ''}\n\n`;

    if (summaryData.keyPoints && summaryData.keyPoints.length > 0) {
        text += `KEY TAKEAWAYS\n`;
        text += `───────────────────────────────────────────────────────────────\n`;
        text += summaryData.keyPoints.map(p => `• ${p}`).join('\n') + '\n\n';
    }

    if (summaryData.chapters && summaryData.chapters.length > 0) {
        text += `CHAPTER BREAKDOWN\n`;
        text += `───────────────────────────────────────────────────────────────\n`;
        summaryData.chapters.forEach(ch => {
            const summary = ch.detailedSummary || ch.shortSummary || ch.summary || '';
            text += `\n[${ch.timestamp}] ${ch.title}\n`;
            text += `${summary}\n`;
        });
    }

    if (summaryData.topics && summaryData.topics.length > 0) {
        text += `\nTOPICS: ${summaryData.topics.join(', ')}\n`;
    }

    text += `\n═══════════════════════════════════════════════════════════════\n`;
    text += `Generated by Grabbit - https://grabbit.socratisp.com\n`;

    return text;
}

/**
 * Generate standalone HTML page with embedded CSS
 */
async function generateStandaloneHTML() {
    const videoId = getVideoId(videoTab.url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';

    // Get the current CSS
    const cssResponse = await fetch(chrome.runtime.getURL('AI Features/youtube-summary/youtube-summary.css'));
    const css = await cssResponse.text();

    // Build chapters HTML
    let chaptersHTML = '';
    if (summaryData.chapters && summaryData.chapters.length > 0) {
        chaptersHTML = summaryData.chapters.map((ch, i) => {
            const shortSummary = ch.shortSummary || ch.summary || '';
            const detailedSummary = ch.detailedSummary || '';
            return `
                <div class="chapter-summary-card">
                    <div class="chapter-summary-header">
                        <span class="chapter-summary-timestamp">${ch.timestamp || ''}</span>
                        <span class="chapter-summary-title">${ch.title || `Chapter ${i + 1}`}</span>
                    </div>
                    <p class="chapter-summary-text">${shortSummary}</p>
                    ${detailedSummary ? `<div class="chapter-detailed"><p class="chapter-summary-text">${detailedSummary}</p></div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Build key points HTML
    let keyPointsHTML = '';
    if (summaryData.keyPoints && summaryData.keyPoints.length > 0) {
        keyPointsHTML = summaryData.keyPoints.map(p => `<li>${p}</li>`).join('');
    }

    // Build topics HTML
    let topicsHTML = '';
    if (summaryData.topics && summaryData.topics.length > 0) {
        topicsHTML = summaryData.topics.map(t => `<span class="topic-tag">${t}</span>`).join('');
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${summaryData.title || 'YouTube Summary'} | Grabbit</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${css}</style>
</head>
<body>
    <div class="page-wrapper">
        <header class="header">
            <div class="header-content">
                <div class="logo"><span>📹 YouTube Summary</span></div>
                <div class="header-actions">
                    <a href="${videoTab.url}" target="_blank" class="close-link">Watch Video</a>
                </div>
            </div>
        </header>

        <div class="results-state" style="display: block;">
            <div class="results-layout">
                <aside class="video-sidebar">
                    <div class="video-card">
                        <div class="thumbnail-wrapper">
                            <img src="${thumbnailUrl}" alt="Video Thumbnail" class="video-thumbnail">
                        </div>
                        <h2 class="video-title">${summaryData.title || ''}</h2>
                        <p class="video-channel">${summaryData.channel || ''}</p>
                    </div>
                </aside>

                <main class="summary-content">
                    <section class="summary-section overall-summary">
                        <div class="section-header">
                            <div class="section-badge ai-badge">AI Summary</div>
                        </div>
                        <p class="summary-text">${summaryData.overallSummary || summaryData.summary || ''}</p>
                    </section>

                    <section class="summary-section key-points-section">
                        <h3>Key Takeaways</h3>
                        <ul class="key-points-list">${keyPointsHTML}</ul>
                    </section>

                    <section class="summary-section chapters-section">
                        <h3>Chapter Breakdown</h3>
                        <div class="chapter-summaries">${chaptersHTML}</div>
                    </section>

                    ${topicsHTML ? `
                    <section class="summary-section topics-section">
                        <h3>Topics Covered</h3>
                        <div class="topics-list">${topicsHTML}</div>
                    </section>
                    ` : ''}

                    <div class="actions-bar" style="margin-top: 2rem;">
                        <a href="${videoTab.url}" target="_blank" class="btn-primary" style="text-decoration: none;">Open Video</a>
                    </div>
                </main>
            </div>
        </div>
    </div>
    <p style="text-align: center; color: #6e6e73; padding: 2rem; font-size: 0.875rem;">
        Generated by Grabbit • ${new Date().toLocaleDateString()}
    </p>
</body>
</html>`;
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 100);
}

/**
 * Helper: Trigger download
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
init();
