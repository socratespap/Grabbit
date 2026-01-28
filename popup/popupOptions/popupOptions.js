/**
 * Grabbit Popup Options Page
 * Handles popup button customization
 */

import { initializePopupConfig } from '/js/options/popup-config.js';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopupConfig);
} else {
    // DOM is already ready
    initializePopupConfig();
}
