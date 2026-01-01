//open options page on extension install
chrome.runtime.onInstalled.addListener((details) => {
    // Enable Linkify by default for new installs OR existing users upgrading to this version
    chrome.storage.sync.get(['linkifyEnabled'], (result) => {
        if (result.linkifyEnabled === undefined) {
            chrome.storage.sync.set({ linkifyEnabled: true });
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
            // Mark first URL as visited
            if (request.urls[0]) {
                chrome.history.addUrl({ url: request.urls[0] });
            }
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
                        chrome.history.addUrl({ url: url });
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
                    chrome.history.addUrl({ url: url });
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
                    chrome.history.addUrl({ url: url });
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
                        chrome.history.addUrl({ url: url });
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
                    chrome.history.addUrl({ url: url });
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
                chrome.history.addUrl({ url: url });
            });
        }
    }

});
