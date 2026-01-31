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

/**
 * Set up extension management buttons (pin, rate)
 */
function setupExtensionButtons() {
    // Handle pin extension button
    const pinExtensionButton = document.getElementById('pinExtensionButton');
    if (pinExtensionButton) {
        pinExtensionButton.addEventListener('click', async () => {
            try {
                const extensionId = chrome.runtime.id;
                await chrome.action.setPopup({ popup: 'popup/popup.html' });
                await chrome.action.enable();
                await chrome.tabs.create({
                    url: 'chrome://extensions/?id=' + extensionId
                });
            } catch (error) {
                console.error('Failed to pin extension:', error);
            }
        });
    }

    // Handle rate extension button
    const rateExtensionButton = document.getElementById('rateExtensionButton');
    if (rateExtensionButton) {
        rateExtensionButton.addEventListener('click', () => {
            const extensionId = chrome.runtime.id;
            chrome.tabs.create({
                url: `https://chrome.google.com/webstore/detail/${extensionId}/reviews`
            });
        });
    }

    // Handle report issue button
    const reportIssueButton = document.getElementById('reportIssueButton');
    if (reportIssueButton) {
        reportIssueButton.addEventListener('click', () => {
            chrome.tabs.create({
                url: 'https://chromewebstore.google.com/detail/madmdgpjgagdmmmiddpiggdnpgjglcdk/support'
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
