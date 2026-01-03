//open options page on extension install
chrome.runtime.onInstalled.addListener((details) => {
    // Enable Linkify by default for new installs OR existing users upgrading to this version
    chrome.storage.sync.get(['linkifyEnabled', 'savedActions'], (result) => {
        if (result.linkifyEnabled === undefined) {
            chrome.storage.sync.set({ linkifyEnabled: true });
        }

        // Check for saved actions and add defaults if none exist
        if (!result.savedActions || result.savedActions.length === 0) {
            const defaultActions = [
                {
                    combination: { key: 'none', mouseButton: 'right' },
                    openLinks: true,
                    openWindow: false,
                    copyUrls: false,
                    copyUrlsAndTitles: false,
                    copyTitles: false,
                    smartSelect: 'off',
                    avoidDuplicates: 'on',
                    reverseOrder: false,
                    openAtEnd: false,
                    boxColor: '#FF0000', // Red
                    tabDelay: 0,
                    borderThickness: 2,
                    borderStyle: 'solid'
                },
                {
                    combination: { key: 'ctrl', mouseButton: 'right' },
                    openLinks: false,
                    openWindow: false,
                    copyUrls: true,
                    copyUrlsAndTitles: false,
                    copyTitles: false,
                    smartSelect: 'off',
                    avoidDuplicates: 'on',
                    reverseOrder: false,
                    openAtEnd: false,
                    boxColor: '#0000FF', // Blue
                    tabDelay: 0,
                    borderThickness: 2,
                    borderStyle: 'solid'
                }
            ];

            chrome.storage.sync.set({ savedActions: defaultActions }, () => {
                console.log('Default actions set:', defaultActions);
            });
        }
    });

    if (details.reason === 'install') {
        // Open options page on first install
        chrome.runtime.openOptionsPage();
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
    if (request.action === 'createBookmarks') {
        const { bookmarks, folderName } = request;

        if (!bookmarks || bookmarks.length === 0) return;

        // Function to create bookmarks in a specific folder
        const createBookmarksInFolder = (parentId) => {
            bookmarks.forEach(bookmark => {
                chrome.bookmarks.create({
                    parentId: parentId,
                    title: bookmark.title,
                    url: bookmark.url
                });
            });
        };

        // Search for existing folder with the same name
        chrome.bookmarks.search({ title: folderName }, (results) => {
            // Filter to find a folder (not a bookmark) with the exact name
            const existingFolder = results.find(item => !item.url && item.title === folderName);

            if (existingFolder) {
                // Folder exists, add bookmarks to it
                createBookmarksInFolder(existingFolder.id);
            } else {
                // Folder doesn't exist, create it then add bookmarks
                // We'll create it under "Other Bookmarks" (usually id '2') or '1' depending on browser, 
                // but not specifying parentId usually defaults to "Other Bookmarks" in Chrome.
                chrome.bookmarks.create({ title: folderName }, (newFolder) => {
                    createBookmarksInFolder(newFolder.id);
                });
            }
        });
    }
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
