/**
 * Grabbit Options Page - Main Entry Point
 * 
 * This is the main module that initializes and orchestrates all options page functionality.
 * It imports all other modules and sets up event listeners and initialization logic.
 */

import { isExtension } from './env.js';
import { loadActionsFromStorage, saveBoxColorToStorage } from './storage.js';
import { updateKeyLabels, initializeTooltips } from './utils.js';
import { setupPreviewListeners } from './preview.js';
import { createActionCard } from './card.js';
import { initializeModal, setupModalListeners, setupFormValidation } from './modal.js';

function getBrowserCompat() {
    return globalThis.GrabbitBrowserCompat || {
        feedbackUrl: 'https://chromewebstore.google.com/detail/grabbit/madmdgpjgagdmmmiddpiggdnpgjglcdk/reviews',
        feedbackButtonLabel: 'Rate on Chrome Web Store',
        pinHelpUrl: 'https://support.google.com/chrome_webstore/answer/3060053',
        supportUrl: 'https://github.com/socratespap/Grabbit/issues',
    };
}

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================

const actionButton = document.querySelector('.action-button');
const modal = document.getElementById('actionModal');
const closeButton = document.querySelector('.modal-close');
const cancelButton = document.getElementById('cancelButton');
const combinedKeySelect = document.getElementById('combinedKey');
const savedActionsContainer = document.getElementById('savedActions');
const boxColorInput = document.getElementById('boxColor');
const advancedOptionsToggle = document.getElementById('advancedOptionsToggle');
const collapsibleSection = advancedOptionsToggle?.closest('.collapsible-section');
const modalTitle = document.getElementById('modalTitle');

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the options page
 */
function initialize() {
    applyBrowserSpecificLabels();

    // Initialize the modal module with required DOM references
    initializeModal({
        modal,
        savedActionsContainer,
        collapsibleSection,
        modalTitle
    });

    // Set up modal event listeners
    setupModalListeners({
        actionButton,
        closeButton,
        cancelButton,
        advancedOptionsToggle
    });

    // Set up form validation
    setupFormValidation();

    // Set up preview listeners
    setupPreviewListeners();

    // Update key labels based on OS
    updateKeyLabels(combinedKeySelect);

    // Initialize tooltips
    initializeTooltips();

    // Set up box color change handler
    boxColorInput.addEventListener('change', (e) => {
        saveBoxColorToStorage(e.target.value);
    });

    // Set up letter key warning handler
    combinedKeySelect.addEventListener('change', (e) => {
        const letterKeyWarning = document.getElementById('letterKeyWarning');
        if (letterKeyWarning) {
            // Check if selected value is a single letter (a-z)
            const isLetterKey = /^[a-z]$/.test(e.target.value);
            letterKeyWarning.classList.toggle('visible', isLetterKey);
        }
    });

    // Set up extension management buttons
    setupExtensionButtons();

    // Load saved actions from storage
    if (isExtension) {
        loadActionsFromStorage(
            (actions) => {
                actions.forEach(action => {
                    savedActionsContainer.appendChild(createActionCard(action, savedActionsContainer, modal));
                });
            },
            boxColorInput
        );
    }
}

function applyBrowserSpecificLabels() {
    const compat = getBrowserCompat();
    const rateExtensionButton = document.getElementById('rateExtensionButton');

    if (rateExtensionButton) {
        rateExtensionButton.innerHTML = `
            <span class="star-icons">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            ${compat.feedbackButtonLabel}
        `;
    }
}

/**
 * Set up extension management buttons (pin, rate)
 */
function setupExtensionButtons() {
    const compat = getBrowserCompat();

    // Handle pin extension button
    const pinExtensionButton = document.getElementById('pinExtensionButton');
    if (pinExtensionButton && !pinExtensionButton.dataset.grabbitClickBound) {
        pinExtensionButton.dataset.grabbitClickBound = 'true';
        pinExtensionButton.addEventListener('click', () => {
            chrome.tabs.create({
                url: compat.pinHelpUrl
            });
        });
    }

    // Handle rate extension button
    const rateExtensionButton = document.getElementById('rateExtensionButton');
    if (rateExtensionButton && !rateExtensionButton.dataset.grabbitClickBound) {
        rateExtensionButton.dataset.grabbitClickBound = 'true';
        rateExtensionButton.addEventListener('click', () => {
            chrome.tabs.create({
                url: compat.feedbackUrl
            });
        });
    }

    // Handle report issue button
    const reportIssueButton = document.getElementById('reportIssueButton');
    if (reportIssueButton) {
        reportIssueButton.addEventListener('click', () => {
            chrome.tabs.create({
                url: compat.supportUrl
            });
        });
    }
}

// ============================================================================
// START APPLICATION
// ============================================================================

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM is already ready
    initialize();
}
