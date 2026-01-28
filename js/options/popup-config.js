/**
 * Popup Configuration Module
 * Manages which buttons appear in the popup and their order
 */

// Button registry with metadata
export const POPUP_BUTTONS = {
    copyUrls: {
        id: 'copyUrls',
        title: 'Copy Selected Tabs',
        subtitle: 'Selected tabs only',
        color: 'blue',
        icon: 'copy',
        isPremium: false
    },
    copyAllUrls: {
        id: 'copyAllUrls',
        title: 'Copy All Tabs',
        subtitle: 'All open tabs in window',
        color: 'purple',
        icon: 'clipboard',
        isPremium: false
    },
    openUrls: {
        id: 'openUrls',
        title: 'Open Copied Links',
        subtitle: 'From clipboard',
        color: 'orange',
        icon: 'external',
        isPremium: false
    },
    compareProducts: {
        id: 'compareProducts',
        title: 'Compare Products by AI',
        subtitle: 'Premium Analysis',
        color: 'premium',
        icon: 'layers',
        isPremium: true
    },
    summarizePage: {
        id: 'summarizePage',
        title: 'Summarize Page',
        subtitle: 'AI Article Summary',
        color: 'premium',
        icon: 'document',
        isPremium: true
    }
};

// Default configuration
const DEFAULT_CONFIG = {
    buttons: [
        { id: 'copyUrls', enabled: true, order: 0 },
        { id: 'copyAllUrls', enabled: true, order: 1 },
        { id: 'openUrls', enabled: true, order: 2 },
        { id: 'compareProducts', enabled: true, order: 3 },
        { id: 'summarizePage', enabled: true, order: 4 }
    ]
};

/**
 * Load popup configuration from storage
 * @returns {Promise<Object>} Popup configuration
 */
export async function loadPopupConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['popupConfig'], (result) => {
            if (!result.popupConfig || !validateConfig(result.popupConfig)) {
                // Set defaults if invalid or missing
                const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                chrome.storage.sync.set({ popupConfig: defaults }, () => {
                    resolve(defaults);
                });
            } else {
                resolve(result.popupConfig);
            }
        });
    });
}

/**
 * Save popup configuration to storage
 * @param {Object} config - Popup configuration to save
 * @returns {Promise<void>}
 */
export async function savePopupConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ popupConfig: config }, () => {
            resolve();
        });
    });
}

/**
 * Validate popup configuration structure
 * @param {Object} config - Config to validate
 * @returns {boolean} True if valid
 */
function validateConfig(config) {
    if (!config || !config.buttons || !Array.isArray(config.buttons)) {
        return false;
    }

    // Check that all IDs exist in registry
    const validIds = Object.keys(POPUP_BUTTONS);
    const configIds = config.buttons.map(b => b.id);

    // Filter out any unknown IDs (for future compatibility)
    const filteredIds = configIds.filter(id => validIds.includes(id));

    // At least one button must exist
    return filteredIds.length > 0;
}

/**
 * Reset popup configuration to defaults
 * @returns {Promise<Object>} Default configuration
 */
export async function resetPopupConfig() {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    await savePopupConfig(defaults);
    return defaults;
}

/**
 * Get icon SVG HTML for a button
 * @param {string} iconName - Name of the icon
 * @returns {string} SVG HTML
 */
export function getButtonIcon(iconName) {
    const icons = {
        copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`,
        clipboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>`,
        external: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>`,
        layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>`,
        document: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`
    };

    return icons[iconName] || icons.copy;
}

/**
 * Initialize the popup customization UI
 */
export async function initializePopupConfig() {
    const container = document.getElementById('popupButtonList');
    if (!container) return;

    const config = await loadPopupConfig();

    // Sort buttons by order
    const sortedButtons = config.buttons
        .filter(b => POPUP_BUTTONS[b.id])
        .sort((a, b) => a.order - b.order);

    // Clear container
    container.innerHTML = '';

    // Render each button
    sortedButtons.forEach((buttonConfig, index) => {
        const buttonMeta = POPUP_BUTTONS[buttonConfig.id];
        const item = createButtonListItem(buttonConfig, buttonMeta, index);
        container.appendChild(item);
    });

    // Setup drag and drop
    setupDragAndDrop(container);

    // Setup toggle switches
    setupToggleSwitches(container, config);

    // Setup reset button
    const resetBtn = document.getElementById('resetPopupConfig');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('Reset to default button configuration?')) {
                const defaults = await resetPopupConfig();
                await initializePopupConfig();
            }
        });
    }
}

/**
 * Create a button list item
 */
function createButtonListItem(buttonConfig, buttonMeta, index) {
    const item = document.createElement('div');
    item.className = 'popup-button-item';
    item.dataset.id = buttonConfig.id;
    item.dataset.index = index;
    item.draggable = true;

    item.innerHTML = `
        <div class="drag-handle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="5" r="1"></circle>
                <circle cx="9" cy="12" r="1"></circle>
                <circle cx="9" cy="19" r="1"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <circle cx="15" cy="12" r="1"></circle>
                <circle cx="15" cy="19" r="1"></circle>
            </svg>
        </div>
        <div class="button-preview">
            <div class="button-icon-preview ${buttonMeta.color}">
                ${getButtonIcon(buttonMeta.icon)}
            </div>
            <div class="button-info">
                <div class="button-info-title">
                    ${buttonMeta.title}
                    ${buttonMeta.isPremium ? '<span class="pro-badge-mini">PRO</span>' : ''}
                </div>
                <div class="button-info-subtitle">${buttonMeta.subtitle}</div>
            </div>
        </div>
        <div class="button-toggle">
            <label class="toggle-switch">
                <input type="checkbox" class="toggle-checkbox" ${buttonConfig.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        </div>
    `;

    if (!buttonConfig.enabled) {
        item.classList.add('disabled');
    }

    return item;
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop(container) {
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.popup-button-item');
        if (!item) return;

        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    container.addEventListener('dragend', (e) => {
        const item = e.target.closest('.popup-button-item');
        if (!item) return;

        item.classList.remove('dragging');
        document.querySelectorAll('.popup-button-item').forEach(i => {
            i.classList.remove('drag-over');
        });

        // Save new order
        saveNewOrder();
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const item = e.target.closest('.popup-button-item');
        if (!item || item === draggedItem) return;

        item.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
        const item = e.target.closest('.popup-button-item');
        if (!item) return;

        item.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const item = e.target.closest('.popup-button-item');
        if (!item || item === draggedItem) return;

        const items = [...container.querySelectorAll('.popup-button-item')];
        const draggedIndex = items.indexOf(draggedItem);
        const targetIndex = items.indexOf(item);

        if (draggedIndex < targetIndex) {
            item.parentNode.insertBefore(draggedItem, item.nextSibling);
        } else {
            item.parentNode.insertBefore(draggedItem, item);
        }

        item.classList.remove('drag-over');
    });
}

/**
 * Save new button order after drag
 */
async function saveNewOrder() {
    const container = document.getElementById('popupButtonList');
    const items = container.querySelectorAll('.popup-button-item');

    const config = await loadPopupConfig();
    const buttonMap = new Map(config.buttons.map(b => [b.id, b]));

    items.forEach((item, index) => {
        const id = item.dataset.id;
        if (buttonMap.has(id)) {
            buttonMap.get(id).order = index;
        }
    });

    config.buttons = Array.from(buttonMap.values());
    await savePopupConfig(config);
}

/**
 * Setup toggle switches
 */
function setupToggleSwitches(container, config) {
    const toggles = container.querySelectorAll('.toggle-checkbox');

    toggles.forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const item = e.target.closest('.popup-button-item');
            const id = item.dataset.id;
            const enabled = e.target.checked;

            // Count enabled buttons
            const allToggles = container.querySelectorAll('.toggle-checkbox');
            const enabledCount = [...allToggles].filter(t => t.checked).length;

            // Prevent disabling last button
            if (!enabled && enabledCount === 0) {
                e.target.checked = true;
                alert('At least one button must remain enabled!');
                return;
            }

            // Update config
            const buttonConfig = config.buttons.find(b => b.id === id);
            if (buttonConfig) {
                buttonConfig.enabled = enabled;
                await savePopupConfig(config);

                // Update visual state
                if (enabled) {
                    item.classList.remove('disabled');
                } else {
                    item.classList.add('disabled');
                }
            }
        });
    });
}

