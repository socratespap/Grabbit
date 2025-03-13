//open options page on extension install
chrome.runtime.onInstalled.addListener((details) => {
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
        
        if (delay > 0) {
            // Open tabs with delay
            request.urls.forEach((url, index) => {
                setTimeout(() => {
                    chrome.tabs.create({
                        url: url,
                        index: currentIndex + index + 1,
                        active: false
                    });
                }, delay * 1000 * index); // Convert seconds to milliseconds and multiply by index
            });
        } else {
            // Open tabs without delay
            request.urls.forEach((url, index) => {
                chrome.tabs.create({
                    url: url,
                    index: currentIndex + index + 1,
                    active: false
                });
            });
        }
    }
    
    //create single tab (for backward compatibility)
    if (request.action === 'createTab') {
        // Get the index of the current tab
        const currentIndex = sender.tab.index;
        // Create a new tab with the specified URL
        chrome.tabs.create({
            url: request.url,
            // Set the new tab's index to be right after the current tab
            index: currentIndex + 1,
            // Don't make the new tab active
            active: false
        });
    }
});
