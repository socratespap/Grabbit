import { GrabbitAuth } from './grabbit-auth.js';

const SUPABASE_API_BASE = 'https://xtemoktforlrgxwdtpqb.supabase.co/functions/v1';
const STRIPE_MONTHLY_URL = 'https://buy.stripe.com/aFa8wQ04DfZweE14Ogbsc02';
const STRIPE_YEARLY_URL  = 'https://buy.stripe.com/9B600k3gP6oWfI5a8Absc03';
const STRIPE_PORTAL_URL  = 'https://billing.stripe.com/p/login/4gMeVe8B9aFc3Zna8Absc00'; // Update this if you have a test portal link too!
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
    // We use a version-specific flag to ensure we reset the highlighter to 'false' 
    // exactly once for users who might have received the accidental 'true' default.
    const RESET_FLAG = 'highlighterDefaultReset_3_8_2';

    chrome.storage.sync.get(['linkifyEnabled', 'duplicateHighlighterEnabled', RESET_FLAG, 'savedActions'], (result) => {
        if (result.linkifyEnabled === undefined) {
            chrome.storage.sync.set({ linkifyEnabled: true });
        }
        
        // If the reset flag is missing, force the highlighter to false (one-time fix)
        if (!result[RESET_FLAG]) {
            const update = { duplicateHighlighterEnabled: false };
            update[RESET_FLAG] = true;
            chrome.storage.sync.set(update);
            console.log('Grabbit: Duplicate Highlighter default reset to false.');
        } else if (result.duplicateHighlighterEnabled === undefined) {
            // Fallback for new installs if the flag somehow exists but setting doesn't
            chrome.storage.sync.set({ duplicateHighlighterEnabled: false });
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPremiumStatus') {
        GrabbitAuth.getUser().then(user => {
            sendResponse({ isPremium: user.isPremium });
        });
        return true;
    }
});

// Pro Account page message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PRO_STATUS') {
        (async () => {
            try {
                const user = await GrabbitAuth.getUser();
                let credits = null;

                if (user.isPremium) {
                    // Use subscription data if available, else fall back to cached credits
                    if (user.subscription?.monthly_usage !== undefined && user.subscription?.monthly_limit !== undefined) {
                        const currentMonth = new Date().toISOString().slice(0, 7);
                        const used = user.subscription.last_usage_month === currentMonth ? (user.subscription.monthly_usage ?? 0) : 0;
                        const remaining = Math.max(0, (user.subscription.monthly_limit ?? 1000) - used);
                        credits = { _remaining: remaining };
                        chrome.storage.local.set({ cachedCredits: remaining, cachedCreditsTimestamp: Date.now() });
                    } else {
                        const stored = await chrome.storage.local.get(['cachedCredits', 'cachedCreditsTimestamp']);
                        if (stored.cachedCredits !== undefined) credits = { _remaining: stored.cachedCredits };
                    }
                }

                sendResponse({
                    user: {
                        paid: user.isPremium,
                        email: user.email,
                        trialActive: user.subscription?.status === 'trialing',
                        planType: user.subscription?.plan_type || null,
                        status: user.subscription?.status || null,
                        resetDate: user.subscription?.month_reset_requests || null,
                        expiryDate: user.subscription?.current_period_end || null,
                    },
                    credits
                });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }

    if (request.action === 'GRABBIT_LOGIN') {
        (async () => {
            let result;
            if (request.type === 'signup') {
                result = await GrabbitAuth.signUp(request.email, request.password);
            } else if (request.type === 'reset_password') {
                result = await GrabbitAuth.resetPassword(request.email);
            } else {
                // default: signin
                result = await GrabbitAuth.signIn(request.email, request.password);
            }
            sendResponse(result);
        })();
        return true;
    }

    if (request.action === 'LOGOUT') {
        GrabbitAuth.signOut().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'OPEN_PAYMENT_PAGE' || request.action === 'openPaymentPage') {
        const url = request.plan === 'yearly' ? STRIPE_YEARLY_URL : STRIPE_MONTHLY_URL;
        chrome.tabs.create({ url, active: true });
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'OPEN_PRO_ACCOUNT') {
        chrome.tabs.create({ url: chrome.runtime.getURL('proAccount/proAccount.html'), active: true });
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'OPEN_BILLING_PORTAL') {
        chrome.tabs.create({ url: STRIPE_PORTAL_URL, active: true });
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'CANCEL_SUBSCRIPTION') {
        chrome.tabs.create({ url: STRIPE_PORTAL_URL, active: true });
        sendResponse({ success: true });
        return true;
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
 * Get the access token from the current Supabase session.
 */
async function getAccessToken() {
    return GrabbitAuth.getAccessToken();
}

/**
 * Main handler for AI Product Comparison
 * Uses Supabase Edge Function proxy — API key never sent to client
 */
async function handleProductComparison(tabs) {
    // 1. Verify auth + get access token
    const user = await GrabbitAuth.getUser();
    if (!user.isPremium) throw new Error('Premium required');
    const accessToken = await getAccessToken();

    // 2. Extract content from each tab
    const products = [];
    for (const tab of tabs) {
        try {
            try { await chrome.tabs.get(tab.id); } catch {
                products.push({ title: tab.title, price: '', rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url, siteName: new URL(tab.url).hostname, url: tab.url });
                continue;
            }
            const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractProductDataFromPage });
            products.push({
                title: result.result?.title || tab.title,
                price: result.result?.price || '',
                rawContent: result.result?.rawContent || '',
                siteName: result.result?.siteName || new URL(tab.url).hostname,
                url: tab.url
            });
        } catch (e) {
            console.warn('Could not extract from tab ' + tab.id + ':', e);
            products.push({ title: tab.title, price: '', rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url, siteName: new URL(tab.url).hostname, url: tab.url });
        }
    }

    // 3. Send to Supabase Edge Function with JWT auth
    const response = await fetch(`${SUPABASE_API_BASE}/compare`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ products })
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 403) throw new Error('Subscription not active. Please check your payment status.');
        if (response.status === 429) throw new Error(data.message || 'Monthly limit reached. Try again next month.');
        throw new Error(data.message || 'Comparison failed. Please try again.');
    }

    if (data.remaining_month !== undefined) {
        chrome.storage.local.set({ cachedCredits: data.remaining_month, cachedCreditsTimestamp: Date.now() });
    }

    return { ...data.comparison, _remaining: data.remaining_month };
}

/**
 * Main handler for AI Article Summary
 * Uses Supabase Edge Function proxy — API key never sent to client
 */
async function handleArticleSummary(tab) {
    // 1. Verify auth + get access token
    const user = await GrabbitAuth.getUser();
    if (!user.isPremium) throw new Error('Premium required');
    const accessToken = await getAccessToken();

    // 3. Extract article content from the tab
    let pageData;
    try {
        try { await chrome.tabs.get(tab.id); } catch {
            throw new Error('The article tab was closed. Please reopen the article and try again.');
        }
        const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractArticleDataFromPage });
        pageData = { title: result.result?.title || tab.title, url: tab.url, rawContent: result.result?.rawContent || '' };
    } catch (e) {
        console.warn('Could not extract from tab ' + tab.id + ':', e);
        pageData = { title: tab.title, url: tab.url, rawContent: 'Page Title: ' + tab.title + '\nURL: ' + tab.url };
    }

    // 4. Send to Supabase Edge Function with JWT auth
    const response = await fetch(`${SUPABASE_API_BASE}/summarize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ pageData })
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 403) throw new Error('Subscription not active. Please check your payment status.');
        if (response.status === 429) throw new Error(data.message || 'Monthly limit reached. Try again next month.');
        throw new Error(data.message || 'Summary failed. Please try again.');
    }

    if (data.remaining_month !== undefined) {
        chrome.storage.local.set({ cachedCredits: data.remaining_month, cachedCreditsTimestamp: Date.now() });
    }

    return { ...data.summary, _remaining: data.remaining_month };
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
 * Uses Supabase Edge Function proxy — API key never sent to client
 */
async function handleYouTubeSummary(tab) {
    // 1. Verify auth + get access token
    const user = await GrabbitAuth.getUser();
    if (!user.isPremium) throw new Error('Premium required');
    const accessToken = await getAccessToken();

    // 3. Extract YouTube data (transcript, chapters, metadata) from the tab
    try {
        try { await chrome.tabs.get(tab.id); } catch {
            throw new Error('The YouTube video tab was closed. Please reopen the video and try again.');
        }

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractYouTubeDataFromPage,
            world: 'MAIN'
        });

        const videoData = result.result;

        if (videoData && videoData.error) throw new Error(videoData.error);
        if (!videoData || !videoData.transcript) {
            throw new Error('No transcript available for this video. The video may not have captions enabled.');
        }

        // 4. Send to Supabase Edge Function with JWT auth
        const response = await fetch(`${SUPABASE_API_BASE}/youtube-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ videoData })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 403) throw new Error('Subscription not active. Please check your payment status.');
            if (response.status === 429) throw new Error(data.message || 'Monthly limit reached. Try again next month.');
            throw new Error(data.message || 'YouTube summary failed. Please try again.');
        }

        if (data.remaining_month !== undefined) {
            chrome.storage.local.set({ cachedCredits: data.remaining_month, cachedCreditsTimestamp: Date.now() });
        }

        return { ...data.summary, _remaining: data.remaining_month };

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

        data.chapters = chapters.slice(0, 50); // Support long videos with many chapters

        // Extract session data from ytcfg — available because we run in MAIN world
        // visitorData is required by YouTube since late 2024 to bypass po_token checks
        const apiKey = window.ytcfg?.get?.('INNERTUBE_API_KEY') || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
        const hl = window.ytcfg?.get?.('HL') || 'en';
        const visitorData = window.ytcfg?.get?.('VISITOR_DATA') || '';
        const clientVersion = window.ytcfg?.get?.('INNERTUBE_CLIENT_VERSION') || '2.20240726.00.00';


        // InnerTube clients to try in order.
        // TVHTML5_SIMPLY_EMBEDDED_PLAYER is the most reliable in 2025/2026 — it's a
        // lightweight embedded client that bypasses most po_token requirements.
        const clients = [
            {
                // Embedded TV client — bypasses po_token, still returns captions
                clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                clientVersion: '2.0',
                hl,
                visitorData,
            },
            {
                // Standard web client with session data from the real page
                clientName: 'WEB',
                clientVersion,
                hl,
                visitorData,
            },
            {
                // Android client — last resort
                clientName: 'ANDROID',
                clientVersion: '19.29.37',
                hl,
            },
        ];

        let playerData = null;

        for (const client of clients) {
            try {
                const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Visitor-Id': visitorData,
                        'X-YouTube-Client-Name': '85', // TVHTML5_SIMPLY_EMBEDDED_PLAYER numeric ID
                    },
                    body: JSON.stringify({
                        context: { client },
                        videoId: data.videoId,
                        playbackContext: {
                            contentPlaybackContext: { signatureTimestamp: window.ytcfg?.get?.('STS') || 0 },
                        },
                    }),
                });

                if (res.ok) {
                    const json = await res.json();
                    const tracks = json?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                    if (tracks && tracks.length > 0) {
                        playerData = json;
                        console.log('[Grabbit] InnerTube client worked:', client.clientName);
                        break;
                    }
                    console.warn('[Grabbit] Client returned no captions:', client.clientName);
                } else {
                    console.warn('[Grabbit] Client HTTP error:', client.clientName, res.status);
                }
            } catch (e) {
                console.warn('[Grabbit] Client failed:', client.clientName, e.message);
            }
        }

        if (!playerData) {
            throw new Error('No captions available for this video. The video may not have captions enabled.');
        }

        // Get caption tracks (guaranteed non-empty by multi-client loop above)
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

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

        // Use timestamped transcript for AI - 200K chars supports 2+ hour videos
        data.transcript = timestampedTranscript.trim().substring(0, 200000); // 200K chars for 2+ hour videos

        return data;

    } catch (error) {
        console.error('YouTube extraction error:', error);
        // Return what we have, even if incomplete
        data.error = error.message;
        return data;
    }
}
