(function () {
    const userAgent = navigator.userAgent || '';
    const isFirefox = /Firefox\//i.test(userAgent);
    const isEdge = /Edg\//i.test(userAgent);
    const isOpera = /OPR\//i.test(userAgent) || /Opera\//i.test(userAgent);

    let browserName = 'chrome';
    if (isFirefox) {
        browserName = 'firefox';
    } else if (isEdge) {
        browserName = 'edge';
    } else if (isOpera) {
        browserName = 'opera';
    }

    const repoUrl = 'https://github.com/socratespap/Grabbit';
    const issuesUrl = `${repoUrl}/issues`;
    const chromeStoreUrl = 'https://chromewebstore.google.com/detail/grabbit/madmdgpjgagdmmmiddpiggdnpgjglcdk';

    const pinHelpUrl = browserName === 'firefox'
        ? 'https://support.mozilla.org/en-US/kb/pin-unpin-and-rearrange-extensions-firefox'
        : 'https://support.google.com/chrome_webstore/answer/3060053';

    const feedbackUrl = browserName === 'firefox' ? repoUrl : `${chromeStoreUrl}/reviews`;
    const feedbackButtonLabel = browserName === 'firefox' ? 'View Project on GitHub' : 'Rate on Chrome Web Store';
    const productLabel = browserName === 'firefox' ? 'Firefox' : browserName === 'edge' ? 'Edge' : browserName === 'opera' ? 'Opera' : 'Chrome';

    globalThis.GrabbitBrowserCompat = Object.freeze({
        browserName,
        productLabel,
        pinHelpUrl,
        feedbackUrl,
        feedbackButtonLabel,
        supportUrl: issuesUrl,
        repoUrl,
        supportsInlineRating: browserName === 'chrome' && typeof chrome !== 'undefined' && typeof chrome.webstore?.postRating === 'function',
    });
})();
