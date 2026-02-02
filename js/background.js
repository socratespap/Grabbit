import { Premium } from './premium.js';
// AI comparison now handled server-side for security

//=============================================================================
// STORAGE MIGRATION & VALIDATION
//=============================================================================

/**
 * Required properties for each action with their default values.
 * Used to repair actions that may be missing properties after upgrades.
 */
const REQUIRED_ACTION_PROPERTIES = {
    combination: { key: 'none', mouseButton: 'right' },
    openLinks: false,
    openWindow: false,
    copyUrls: false,
    copyUrlsAndTitles: false,
    copyTitles: false,
    createBookmarks: false,
    smartSelect: 'off',
    avoidDuplicates: 'on',
    reverseOrder: false,
    openAtEnd: false,
    boxColor: '#FF0000',
    tabDelay: 0,
    borderThickness: 2,
    borderStyle: 'solid',
    markAsVisited: true
};

/**
 * Validates if an action has the minimum required structure.
 * An action is valid if it's an object with a combination property.
 * @param {Object} action - The action to validate
 * @returns {boolean} True if action has valid base structure
 */
function validateAction(action) {
    if (!action || typeof action !== 'object') return false;
    if (!action.combination || typeof action.combination !== 'object') return false;
    // Must have at least a mouseButton defined
    if (!action.combination.mouseButton) return false;
    return true;
}

/**
 * Repairs an action by filling in missing properties with defaults.
 * Preserves all existing valid properties.
 * @param {Object} action - The action to repair
 * @returns {Object} A new action object with all required properties
 */
function repairAction(action) {
    const repairedAction = {};

    // For each required property, use existing value or default
    for (const [key, defaultValue] of Object.entries(REQUIRED_ACTION_PROPERTIES)) {
        if (key === 'combination') {
            // Special handling for combination object
            repairedAction.combination = {
                key: action.combination?.key ?? defaultValue.key,
                mouseButton: action.combination?.mouseButton ?? defaultValue.mouseButton
            };
        } else if (action.hasOwnProperty(key)) {
            // Keep existing value
            repairedAction[key] = action[key];
        } else {
            // Use default value
            repairedAction[key] = defaultValue;
        }
    }

    // Preserve any extra properties not in REQUIRED_ACTION_PROPERTIES
    // (for forward compatibility)
    for (const [key, value] of Object.entries(action)) {
        if (!repairedAction.hasOwnProperty(key)) {
            repairedAction[key] = value;
        }
    }

    return repairedAction;
}

/**
 * Migrates stored actions by validating and repairing each one.
 * @param {Array} actions - The stored actions array
 * @returns {Object} Object with: { actions: Array, wasRepaired: boolean, invalidCount: number }
 */
function migrateStoredActions(actions) {
    // If not an array or empty, return null to trigger default action creation
    if (!Array.isArray(actions) || actions.length === 0) {
        return null;
    }

    const repairedActions = [];
    let wasRepaired = false;
    let invalidCount = 0;

    for (const action of actions) {
        if (validateAction(action)) {
            // Check if repair is needed by comparing property count
            const originalKeys = Object.keys(action).length;
            const repaired = repairAction(action);
            const repairedKeys = Object.keys(repaired).length;

            if (repairedKeys > originalKeys) {
                wasRepaired = true;
            }
            repairedActions.push(repaired);
        } else {
            // Action is too corrupted to repair, skip it
            invalidCount++;
            wasRepaired = true;
        }
    }

    // If all actions were invalid, return null to trigger defaults
    if (repairedActions.length === 0) {
        return null;
    }

    return { actions: repairedActions, wasRepaired, invalidCount };
}

//=============================================================================
// EXTENSION LIFECYCLE
//=============================================================================

//open options page on extension install
chrome.runtime.onInstalled.addListener((details) => {
    // Enable Linkify by default for new installs OR existing users upgrading to this version
    chrome.storage.sync.get(['linkifyEnabled', 'savedActions'], (result) => {
        if (result.linkifyEnabled === undefined) {
            chrome.storage.sync.set({ linkifyEnabled: true });
        }

        // Migrate/validate stored actions
        const migrationResult = migrateStoredActions(result.savedActions);

        if (migrationResult === null) {
            // No valid actions found, set defaults
            const defaultActions = [
                {
                    combination: { key: 'none', mouseButton: 'right' },
                    openLinks: true,
                    openWindow: false,
                    copyUrls: false,
                    copyUrlsAndTitles: false,
                    copyTitles: false,
                    createBookmarks: false,
                    smartSelect: 'off',
                    avoidDuplicates: 'on',
                    reverseOrder: false,
                    openAtEnd: false,
                    boxColor: '#FF0000', // Red
                    tabDelay: 0,
                    borderThickness: 2,
                    borderStyle: 'solid',
                    markAsVisited: false
                },
                {
                    combination: { key: 'ctrl', mouseButton: 'right' },
                    openLinks: false,
                    openWindow: false,
                    copyUrls: true,
                    copyUrlsAndTitles: false,
                    copyTitles: false,
                    createBookmarks: false,
                    smartSelect: 'off',
                    avoidDuplicates: 'on',
                    reverseOrder: false,
                    openAtEnd: false,
                    boxColor: '#0000FF', // Blue
                    tabDelay: 0,
                    borderThickness: 2,
                    borderStyle: 'solid',
                    markAsVisited: false
                }
            ];

            chrome.storage.sync.set({ savedActions: defaultActions });
        } else if (migrationResult.wasRepaired) {
            // Actions were repaired, save them
            chrome.storage.sync.set({ savedActions: migrationResult.actions });
        }
        // If no repair was needed, do nothing (keep existing actions)
    });

    if (details.reason === 'install') {
        // Open options page on first install
        chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
        // Extension was updated - show badge on icon and set flag for popup
        const manifest = chrome.runtime.getManifest();
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        chrome.storage.local.set({
            updateAvailable: true,
            updatedVersion: manifest.version
        });
    }
});

// create windows
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //create windows
    if (request.action === 'openLinks') {
        const delay = request.delay || 0; // Get delay in seconds

        // Create new window with first URL
        chrome.windows.create({
            url: request.urls[0],
            focused: true,
        }, (newWindow) => {

            // Create tabs for remaining URLs in the new window with delay
            if (delay > 0) {
                // Open tabs with delay - only process the remaining URLs (not the first one)
                request.urls.slice(1).forEach((url, index) => {
                    setTimeout(() => {
                        chrome.tabs.create({
                            windowId: newWindow.id,
                            url: url,
                            active: false
                        });
                    }, delay * 1000 * (index + 1)); // Convert seconds to milliseconds and multiply by index
                });
            } else {
                // Open tabs without delay - only process the remaining URLs (not the first one)
                request.urls.slice(1).forEach(url => {
                    chrome.tabs.create({
                        windowId: newWindow.id,
                        url: url,
                        active: false
                    });
                });
            }
        });
    }

    // Create tabs with delay
    if (request.action === 'createTabs') {
        const delay = request.delay || 0; // Get delay in seconds
        const currentIndex = sender.tab.index;
        const currentWindowId = sender.tab.windowId;
        const openAtEnd = request.openAtEnd || false; // Get openAtEnd preference

        // If openAtEnd is true, we'll need to get the total number of tabs
        if (openAtEnd && delay === 0) {
            // For tabs without delay, get tab count first then create tabs
            chrome.tabs.query({ windowId: currentWindowId }, function (tabs) {
                const tabCount = tabs.length;
                // Create all tabs at the end
                request.urls.forEach((url, index) => {
                    chrome.tabs.create({
                        url: url,
                        windowId: currentWindowId,
                        index: tabCount + index, // Place at the end
                        active: false
                    });
                });
            });
        } else if (openAtEnd && delay > 0) {
            // For tabs with delay, get tab count before each creation
            request.urls.forEach((url, index) => {
                setTimeout(() => {
                    chrome.tabs.query({ windowId: currentWindowId }, function (tabs) {
                        const tabCount = tabs.length;
                        chrome.tabs.create({
                            url: url,
                            windowId: currentWindowId,
                            index: tabCount, // Place at the end
                            active: false
                        });
                    });
                }, delay * 1000 * index);
            });
        } else if (delay > 0) {
            // Original behavior: Open tabs with delay after current tab
            request.urls.forEach((url, index) => {
                setTimeout(() => {
                    chrome.tabs.create({
                        url: url,
                        windowId: currentWindowId,
                        index: currentIndex + index + 1,
                        active: false
                    });
                }, delay * 1000 * index); // Convert seconds to milliseconds and multiply by index
            });
        } else {
            // Original behavior: Open tabs without delay after current tab
            request.urls.forEach((url, index) => {
                chrome.tabs.create({
                    url: url,
                    windowId: currentWindowId,
                    index: currentIndex + index + 1,
                    active: false
                });
            });
        }
    }

});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== 'createBookmarks') return;

    const { bookmarks, folderName } = request;
    if (!bookmarks || bookmarks.length === 0) return;

    const runWithPermission = () => {
        // Function to create bookmarks in a specific folder
        const createBookmarksInFolder = parentId => {
            bookmarks.forEach(bookmark => {
                chrome.bookmarks.create({
                    parentId,
                    title: bookmark.title,
                    url: bookmark.url
                });
            });
        };

        // Search for existing folder with the same name
        chrome.bookmarks.search({ title: folderName }, results => {
            // Filter to find a folder (not a bookmark) with the exact name
            const existingFolder = results.find(item => !item.url && item.title === folderName);

            if (existingFolder) {
                // Folder exists, add bookmarks to it
                createBookmarksInFolder(existingFolder.id);
            } else {
                // Folder doesn't exist, create it then add bookmarks
                // We'll create it under "Other Bookmarks" (usually id '2') or '1' depending on browser,
                // but not specifying parentId usually defaults to "Other Bookmarks" in Chrome.
                chrome.bookmarks.create({ title: folderName }, newFolder => {
                    createBookmarksInFolder(newFolder.id);
                });
            }
        });
    };

    chrome.permissions.contains({ permissions: ["bookmarks"] }, hasPermission => {
        if (hasPermission) {
            runWithPermission();
        } else {
            chrome.permissions.request({ permissions: ["bookmarks"] }, granted => {
                if (granted) {
                    runWithPermission();
                }
            });
        }
    });
});

/**
 * Updates the extension icon state based on whether the domain is disabled.
 * Uses a badge since we don't have gray icon assets yet.
 */
function updateIconState(tabId, url) {
    if (!url) return;
    try {
        const hostname = new URL(url).hostname;
        chrome.storage.sync.get(['disabledDomains'], (result) => {
            const disabledDomains = result.disabledDomains || [];
            const isDisabled = disabledDomains.some(domain => hostname.includes(domain));

            if (isDisabled) {
                // Set Badge to "OFF" with a dark gray background
                chrome.action.setBadgeText({ text: "OFF", tabId: tabId });
                chrome.action.setBadgeBackgroundColor({ color: '#555555', tabId: tabId });
                // If gray icons existed: chrome.action.setIcon({ path: "icons/icon_gray.png", tabId: tabId });
            } else {
                // Clear Badge
                chrome.action.setBadgeText({ text: "", tabId: tabId });
            }
        });
    } catch (e) {
        // Invalid URL, ignore
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateIconState(tabId, tab.url);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
            updateIconState(activeInfo.tabId, tab.url);
        }
    });
});


//=============================================================================
// PREMIUM FEATURES
//=============================================================================

// Initialize Premium module (ExtPay listeners)
Premium.init();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPremiumStatus') {
        Premium.getUser().then(user => {
            sendResponse({ isPremium: user.paid });
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'openPaymentPage') {
        Premium.openPaymentPage();
    }
});

// Pro Account page message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PRO_STATUS') {
        (async () => {
            try {
                const user = await Premium.getUser();

                // Get cached credits from storage (saved after each AI action)
                let credits = null;
                if (user.paid) {
                    try {
                        const stored = await chrome.storage.local.get(['cachedCredits', 'cachedCreditsTimestamp']);
                        console.log('[ProAccount] Cached credits from storage:', stored);

                        if (stored.cachedCredits !== undefined) {
                            credits = {
                                _remaining: stored.cachedCredits
                            };
                        }
                    } catch (e) {
                        console.warn('Failed to get cached credits:', e);
                    }
                }

                sendResponse({
                    user: {
                        paid: user.paid,
                        email: user.email,
                        trialActive: user.trialActive,
                        paidAt: user.paidAt || null
                    },
                    credits: credits
                });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        })();
        return true; // Keep channel open for async response
    }

    if (request.action === 'OPEN_LOGIN_PAGE') {
        Premium.openLoginPage();
        sendResponse({ success: true });
    }

    if (request.action === 'LOGOUT') {
        // Clear cached credits AND ExtPay user data to fully log out
        chrome.storage.local.remove([
            'cachedCredits',
            'cachedCreditsTimestamp',
            'extensionpay_user',      // User data
            'extensionpay_api_key'    // API key (force new key generation on next login)
        ]);

        // Open login page (allows explicit switch, though local clear is immediate)
        Premium.openLoginPage();
        sendResponse({ success: true });
    }

    if (request.action === 'OPEN_PAYMENT_PAGE') {
        Premium.openPaymentPage();
        sendResponse({ success: true });
    }

    if (request.action === 'OPEN_BILLING_PORTAL') {
        // ExtensionPay generic account page
        chrome.tabs.create({
            url: 'https://extensionpay.com/account',
            active: true
        });
        sendResponse({ success: true });
    }

    if (request.action === 'CANCEL_SUBSCRIPTION') {
        // ExtPay docs suggest openPaymentPage handles cancellation for existing subscribers
        Premium.openPaymentPage();
        sendResponse({ success: true });
    }
});

// Handle compareProducts action
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'compareProducts') {
        handleProductComparison(request.tabs)
            .then(results => sendResponse({ results }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Handle summarizePage action
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizePage') {
        handleArticleSummary(request.tab)
            .then(results => sendResponse({ results }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Handle summarizeYoutube action
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizeYoutube') {
        handleYouTubeSummary(request.tab)
            .then(results => sendResponse({ results }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

/**
 * Fetch API token for authenticated requests
 */
async function getApiToken(email) {
    const stored = await chrome.storage.local.get(['grabbit_api_token']);
    if (stored.grabbit_api_token) return stored.grabbit_api_token;

    const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    if (response.ok) {
        const data = await response.json();
        await chrome.storage.local.set({ grabbit_api_token: data.token });
        return data.token;
    }

    // Try to get more error details
    let errorDetails = '';
    try {
        const errorData = await response.json();
        errorDetails = errorData.message || JSON.stringify(errorData);
    } catch (e) {
        errorDetails = response.statusText || 'Unknown error';
    }

    console.error('[Grabbit] Failed to get API token. Status:', response.status, 'Details:', errorDetails);
    throw new Error(`Failed to get API token (${response.status}: ${errorDetails})`);
}

/**
 * Main handler for AI Product Comparison
 * Uses server-side proxy - API key never sent to client
 */
async function handleProductComparison(tabs) {
    // 1. Verify premium status (client-side check)
    const user = await Premium.getUser();

    if (!user.paid) {
        throw new Error('Premium required');
    }

    if (!user.email) {
        throw new Error('No email associated with your account. Please log in to ExtPay.');
    }

    // 2. Fetch API token
    const token = await getApiToken(user.email);

    // 3. Extract content from each tab
    const products = [];
    for (const tab of tabs) {
        try {
            // Check if tab still exists before injecting script
            let targetTab;
            try {
                targetTab = await chrome.tabs.get(tab.id);
            } catch (tabError) {
                console.warn('Product tab was closed:', tab.id);
                products.push({
                    title: tab.title,
                    price: '',
                    rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url,
                    siteName: new URL(tab.url).hostname,
                    url: tab.url
                });
                continue; // Skip to next tab
            }

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractProductDataFromPage
            });
            products.push({
                title: result.result?.title || tab.title,
                price: result.result?.price || '',
                rawContent: result.result?.rawContent || '',
                siteName: result.result?.siteName || new URL(tab.url).hostname,
                url: tab.url
            });
        } catch (e) {
            console.warn('Could not extract from tab ' + tab.id + ':', e);
            products.push({
                title: tab.title,
                price: '',
                rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url,
                siteName: new URL(tab.url).hostname,
                url: tab.url
            });
        }
    }

    // 4. Send to server-side proxy (API key stays on server)
    const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            token: token,
            products: products
        })
    });

    const data = await response.json();

    if (!response.ok) {
        // Handle specific errors
        if (response.status === 403) {
            throw new Error('Subscription not active. Please check your payment status.');
        } else if (response.status === 429) {
            throw new Error(data.message || 'Monthly limit reached. Try again next month.');
        } else {
            throw new Error(data.message || 'Comparison failed. Please try again.');
        }
    }

    // Cache remaining credits for Pro Account page
    if (data.remaining_month !== undefined) {
        chrome.storage.local.set({
            cachedCredits: data.remaining_month,
            cachedCreditsTimestamp: Date.now()
        });
    }

    // Return comparison results (and remaining quota info)
    return {
        ...data.comparison,
        _remaining: data.remaining_month
    };
}

/**
 * Main handler for AI Article Summary
 * Uses server-side proxy - API key never sent to client
 */
async function handleArticleSummary(tab) {
    // 1. Verify premium status (client-side check)
    const user = await Premium.getUser();

    if (!user.paid) {
        throw new Error('Premium required');
    }

    if (!user.email) {
        throw new Error('No email associated with your account. Please log in to ExtPay.');
    }

    // 2. Fetch API token
    const token = await getApiToken(user.email);

    // 3. Extract article content from the tab
    try {
        // Check if tab still exists before injecting script
        let targetTab;
        try {
            targetTab = await chrome.tabs.get(tab.id);
        } catch (tabError) {
            console.warn('Article tab was closed:', tab.id);
            throw new Error('The article tab was closed. Please reopen the article and try again.');
        }

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractArticleDataFromPage
        });

        const pageData = {
            title: result.result?.title || tab.title,
            url: tab.url,
            rawContent: result.result?.rawContent || ''
        };

        // 4. Send to server-side proxy (API key stays on server)
        const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                token: token,
                pageData: pageData
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific errors
            if (response.status === 403) {
                throw new Error('Subscription not active. Please check your payment status.');
            } else if (response.status === 429) {
                throw new Error(data.message || 'Monthly limit reached. Try again next month.');
            } else {
                throw new Error(data.message || 'Summary failed. Please try again.');
            }
        }

        // Cache remaining credits for Pro Account page
        console.log('[Summarize] Response data.remaining_month:', data.remaining_month);
        if (data.remaining_month !== undefined) {
            console.log('[Summarize] Caching credits:', data.remaining_month);
            chrome.storage.local.set({
                cachedCredits: data.remaining_month,
                cachedCreditsTimestamp: Date.now()
            });
        } else {
            console.warn('[Summarize] remaining_month is undefined, not caching');
        }

        // Return summary results (and remaining quota info)
        return {
            ...data.summary,
            _remaining: data.remaining_month
        };

    } catch (e) {
        console.warn('Could not extract from tab ' + tab.id + ':', e);

        // Fallback: send minimal data
        const pageData = {
            title: tab.title,
            url: tab.url,
            rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url
        };

        const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                token: token,
                pageData: pageData
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Subscription not active. Please check your payment status.');
            } else if (response.status === 429) {
                throw new Error(data.message || 'Monthly limit reached. Try again next month.');
            } else {
                throw new Error(data.message || 'Summary failed. Please try again.');
            }
        }

        // Cache remaining credits for Pro Account page
        if (data.remaining_month !== undefined) {
            chrome.storage.local.set({
                cachedCredits: data.remaining_month,
                cachedCreditsTimestamp: Date.now()
            });
        }

        return {
            ...data.summary,
            _remaining: data.remaining_month
        };
    }
}

/**
 * This function is injected into each tab to extract product data.
 * Simplified - just extract raw content and let AI identify the product name.
 */
function extractProductDataFromPage() {
    const url = window.location.href;
    const siteName = window.location.hostname;

    // Try to get basic info, but don't stress about perfect extraction
    let title = document.title || '';
    let price = '';
    let description = '';
    let features = [];
    let specs = [];

    // Quick price extraction (just one attempt)
    const priceEl = document.querySelector('[data-price], .price, .product-price, [itemprop="price"]');
    if (priceEl?.textContent?.trim()) {
        price = priceEl.textContent.trim().replace(/\s+/g, ' ');
    }

    // Quick description extraction (just one attempt)
    const descEl = document.querySelector('.product-description, #productDescription, [itemprop="description"]');
    if (descEl) {
        description = (descEl.content || descEl.textContent?.trim() || '').substring(0, 3000);
    }

    // Grab feature bullets if present
    document.querySelectorAll('#feature-bullets li, .feature-list li').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.length < 500 && features.length < 10) {
            features.push(text);
        }
    });

    // Grab main product content
    const mainContent = document.querySelector('main, #content, article, .product-page');
    let contentText = mainContent?.innerText?.substring(0, 8000) || document.body.innerText?.substring(0, 8000) || '';

    // Build raw content - let AI figure out the real product name
    let rawContent = `URL: ${url}\n`;
    rawContent += `Site: ${siteName}\n`;
    rawContent += `Page Title: ${title}\n`;

    if (price) {
        rawContent += `Price: ${price}\n`;
    }

    if (description) {
        rawContent += `\nDescription:\n${description}\n`;
    }

    if (features.length > 0) {
        rawContent += `\nKey Features:\n${features.join('\n• ')}\n`;
    }

    rawContent += `\nPage Content:\n${contentText}\n`;

    return {
        title: title, // Just send page title - AI will identify real product name
        url: url,
        siteName: siteName,
        rawContent: rawContent
    };
}

/**
 * This function is injected into the tab to extract article/blog post data.
 * Optimized for long-form text content like articles, blog posts, documentation.
 */
function extractArticleDataFromPage() {
    const data = {
        title: '',
        author: '',
        date: '',
        content: '',
        headings: [],
        rawContent: ''
    };

    // Title - prioritize article/blog post titles
    const titleSelectors = [
        'h1',
        'article h1',
        '.post-title',
        '.entry-title',
        '[itemprop="headline"]',
        '.article-title',
        '.blog-title',
        '#article-title',
        '.post-title h1'
    ];

    for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
            data.title = el.textContent.trim();
            break;
        }
    }

    // Fallback to document.title
    if (!data.title) {
        data.title = document.title;
    }

    // Author
    const authorSelectors = [
        '[itemprop="author"]',
        '.author',
        '.post-author',
        '.entry-author',
        '.article-author',
        '.byline',
        '.writer',
        '[class*="author"]'
    ];

    for (const selector of authorSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
            data.author = el.textContent.trim();
            break;
        }
    }

    // Date
    const dateSelectors = [
        '[itemprop="datePublished"]',
        'time',
        '.post-date',
        '.entry-date',
        '.publish-date',
        '.article-date',
        '[class*="date"]',
        '[datetime]'
    ];

    for (const selector of dateSelectors) {
        const el = document.querySelector(selector);
        const date = el?.getAttribute('datetime') || el?.textContent?.trim();
        if (date) {
            data.date = date;
            break;
        }
    }

    // Main article content - comprehensive selectors
    const contentSelectors = [
        'article',
        '[itemprop="articleBody"]',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.content',
        '#content',
        'main',
        '.blog-content',
        '.post-body'
    ];

    let mainContent = '';
    for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el) {
            mainContent = el.innerText || el.textContent;
            break;
        }
    }

    // If no main content found, grab body but filter out nav/footer
    if (!mainContent || mainContent.length < 200) {
        const body = document.body;
        if (body) {
            // Clone to avoid modifying actual page
            const clone = body.cloneNode(true);

            // Remove unwanted elements
            const unwantedSelectors = [
                'nav', 'header', 'footer', '.sidebar', '.navigation',
                '.menu', '.comments', '.related-posts', '.advertisement',
                'script', 'style', 'noscript', 'iframe'
            ];

            unwantedSelectors.forEach(sel => {
                clone.querySelectorAll(sel).forEach(el => el.remove());
            });

            mainContent = clone.innerText || clone.textContent;
        }
    }

    // Extract headings for structure
    const headingElements = document.querySelectorAll('h1, h2, h3, h4');
    headingElements.forEach(h => {
        const text = h.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
            data.headings.push(`[${h.tagName}] ${text}`);
        }
    });

    // Build comprehensive rawContent
    let rawContent = `Title: ${data.title}\n`;

    if (data.author) {
        rawContent += `Author: ${data.author}\n`;
    }

    if (data.date) {
        rawContent += `Published: ${data.date}\n`;
    }

    rawContent += `URL: ${window.location.href}\n\n`;

    if (data.headings.length > 0) {
        rawContent += `--- ARTICLE STRUCTURE ---\n`;
        rawContent += data.headings.join('\n') + '\n\n';
    }

    rawContent += `--- ARTICLE CONTENT ---\n`;
    rawContent += mainContent.substring(0, 12000); // Limit to 12K chars for context

    return {
        title: data.title,
        author: data.author,
        date: data.date,
        url: window.location.href,
        rawContent: rawContent
    };
}

/**
 * Main handler for AI YouTube Summary
 * Uses server-side proxy - API key never sent to client
 */
async function handleYouTubeSummary(tab) {
    // 1. Verify premium status (client-side check)
    const user = await Premium.getUser();

    if (!user.paid) {
        throw new Error('Premium required');
    }

    if (!user.email) {
        throw new Error('No email associated with your account. Please log in to ExtPay.');
    }

    // 2. Fetch API token
    const token = await getApiToken(user.email);

    // 3. Extract YouTube data (transcript, chapters, metadata) from the tab
    try {
        // Check if tab still exists before injecting script
        let targetTab;
        try {
            targetTab = await chrome.tabs.get(tab.id);
        } catch (tabError) {
            console.warn('YouTube video tab was closed:', tab.id);
            throw new Error('The YouTube video tab was closed. Please reopen the video and try again.');
        }

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractYouTubeDataFromPage,
            world: 'MAIN' // Required to access window.ytcfg from YouTube's page
        });

        const videoData = result.result;

        // Check for extraction errors
        if (videoData && videoData.error) {
            console.error('YouTube extraction failed:', videoData.error);
            throw new Error(videoData.error);
        }

        if (!videoData || !videoData.transcript) {
            throw new Error('No transcript available for this video. The video may not have captions enabled.');
        }

        // 4. Send to server-side proxy (API key stays on server)
        const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/youtube-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                token: token,
                videoData: videoData
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific errors
            if (response.status === 403) {
                throw new Error('Subscription not active. Please check your payment status.');
            } else if (response.status === 429) {
                throw new Error(data.message || 'Monthly limit reached. Try again next month.');
            } else {
                throw new Error(data.message || 'YouTube summary failed. Please try again.');
            }
        }

        // Return summary results (and remaining quota info)
        return {
            ...data.summary,
            _remaining: data.remaining_month
        };

    } catch (e) {
        console.error('YouTube extraction error:', e);
        throw new Error(e.message || 'Failed to extract video data. Please try again.');
    }
}

/**
 * This function is injected into the YouTube tab to extract video data using InnerTube API.
 * Extracts: title, channel, transcript, chapters
 */
async function extractYouTubeDataFromPage() {
    const data = {
        title: '',
        channel: '',
        videoId: '',
        transcript: '',
        chapters: [],
        url: window.location.href
    };

    try {
        // Extract video ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        data.videoId = urlParams.get('v') || '';

        if (!data.videoId) {
            throw new Error('Could not find video ID');
        }

        // Get title from page
        const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata');
        data.title = titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '');

        // Get channel name
        const channelEl = document.querySelector('#channel-name a, ytd-channel-name a, #owner-name a');
        data.channel = channelEl?.textContent?.trim() || '';

        // Try to get chapters from description or chapter markers
        const chapters = [];

        // Method 1: Check for chapter markers in the video player
        const chapterElements = document.querySelectorAll('.ytp-chapter-container [class*="title"]');
        if (chapterElements.length > 0) {
            chapterElements.forEach((el, i) => {
                chapters.push({
                    timestamp: '',
                    title: el.textContent?.trim() || `Chapter ${i + 1}`
                });
            });
        }

        // Method 2: Parse chapters from description
        const descriptionEl = document.querySelector('#description-inline-expander, #description');
        const descriptionText = descriptionEl?.textContent || '';

        // Look for timestamp patterns like "0:00 Introduction" or "00:00 - Introduction"
        const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+?)(?=\n|$)/gm;
        let match;
        while ((match = timestampRegex.exec(descriptionText)) !== null) {
            const timestamp = match[1].trim();
            const title = match[2].trim();
            if (title.length > 2 && title.length < 100) {
                chapters.push({ timestamp, title });
            }
        }

        data.chapters = chapters.slice(0, 20); // Limit to 20 chapters

        // Get InnerTube API key
        const apiKey = window.ytcfg?.get?.('INNERTUBE_API_KEY');

        if (!apiKey) {
            throw new Error('Could not get InnerTube API key');
        }

        // Call InnerTube Player API to get caption tracks
        // Use ANDROID client - returns directly accessible subtitle URLs without restrictions
        const playerResponse = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: 'ANDROID',
                        clientVersion: '19.29.37',
                        hl: window.ytcfg?.get?.('HL') || 'en',
                    },
                },
                videoId: data.videoId,
            }),
        });

        if (!playerResponse.ok) {
            throw new Error('Failed to get player data');
        }

        const playerData = await playerResponse.json();

        // Get caption tracks
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            throw new Error('No captions available');
        }

        // Prefer English captions, fallback to first available
        let selectedTrack = captionTracks.find(t => t.languageCode === 'en') ||
            captionTracks.find(t => t.languageCode?.startsWith('en')) ||
            captionTracks[0];

        if (!selectedTrack?.baseUrl) {
            throw new Error('No valid caption track found');
        }

        // Fetch transcript in json3 format (JSON - avoids Trusted Types restrictions with DOMParser)
        const transcriptUrl = new URL(selectedTrack.baseUrl);
        transcriptUrl.searchParams.set('fmt', 'json3');

        const transcriptResponse = await fetch(transcriptUrl.toString());

        if (!transcriptResponse.ok) {
            throw new Error('Failed to fetch transcript');
        }

        const transcriptJson = await transcriptResponse.json();

        // Parse JSON transcript with timestamps
        let fullTranscript = '';
        let timestampedTranscript = '';
        let lastTimestamp = -1;

        // Helper to format milliseconds to MM:SS or HH:MM:SS
        const formatTime = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return `${minutes}:${String(seconds).padStart(2, '0')}`;
        };

        if (transcriptJson.events) {
            transcriptJson.events.forEach(event => {
                if (event.segs) {
                    const startMs = event.tStartMs || 0;
                    const startSeconds = Math.floor(startMs / 1000);

                    // Add timestamp marker every 30 seconds for AI reference
                    if (startSeconds >= lastTimestamp + 30 || lastTimestamp === -1) {
                        const timestamp = formatTime(startMs);
                        timestampedTranscript += `\n[${timestamp}] `;
                        lastTimestamp = startSeconds;
                    }

                    event.segs.forEach(seg => {
                        const text = seg.utf8 || '';
                        const cleanText = text.replace(/\s+/g, ' ').trim();
                        if (cleanText && cleanText !== '\n') {
                            fullTranscript += cleanText + ' ';
                            timestampedTranscript += cleanText + ' ';
                        }
                    });
                }
            });
        }

        // Store video duration from last timestamp for validation
        if (transcriptJson.events && transcriptJson.events.length > 0) {
            const lastEvent = transcriptJson.events[transcriptJson.events.length - 1];
            if (lastEvent.tStartMs) {
                data.videoDuration = formatTime(lastEvent.tStartMs);
            }
        }

        // Use timestamped transcript for AI (more accurate) - 60K chars for long videos
        data.transcript = timestampedTranscript.trim().substring(0, 60000);

        return data;

    } catch (error) {
        console.error('YouTube extraction error:', error);
        // Return what we have, even if incomplete
        data.error = error.message;
        return data;
    }
}
