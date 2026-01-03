/**
 * Modal module for Grabbit Options
 * Handles the "Add/Edit Action" modal lifecycle and form logic
 */

import { saveActionsToStorage } from './storage.js';
import { generateUniqueColor, isDuplicateCombination } from './utils.js';
import { createActionCard } from './card.js';
import { updateFormatPreview } from './preview.js';

// Module-level references to DOM elements (set during initialization)
let modal;
let savedActionsContainer;
let collapsibleSection;
let modalTitle;

/**
 * Initializes modal module with required DOM element references
 * @param {Object} elements - Object containing DOM element references
 */
export function initializeModal(elements) {
    modal = elements.modal;
    savedActionsContainer = elements.savedActionsContainer;
    collapsibleSection = elements.collapsibleSection;
    modalTitle = elements.modalTitle;
}

/**
 * Opens the modal for creating a new action
 */
export function openModal() {
    modal.classList.add('active');

    // Set modal title for creating new action
    if (modalTitle) modalTitle.textContent = 'Create New Action';

    // Collapse advanced options by default when creating new action
    if (collapsibleSection) collapsibleSection.classList.add('collapsed');

    // Set a unique color when opening the modal
    document.getElementById('boxColor').value = generateUniqueColor(savedActionsContainer);
}

/**
 * Closes the modal and resets its state
 */
export function closeModal() {
    modal.classList.remove('active');
    modal.editingCard = null;
    // Reset all form selections
    document.getElementById('combinedKey').value = 'none';
    document.getElementById('mouseButton').value = '';
    document.getElementById('actionType').value = '';
    document.getElementById('smartSelect').checked = false;
    document.getElementById('avoidDuplicates').checked = true;
    document.getElementById('reverseOrder').checked = false;
    document.getElementById('openAtEnd').checked = false;
    document.getElementById('tabDelay').value = 0;
    document.getElementById('delayValue').textContent = '0.0s';
    document.getElementById('borderThickness').value = 2;
    document.getElementById('borderStyle').value = 'solid';
    // Reset all error messages
    document.querySelectorAll('.error-message').forEach(error => error.classList.remove('visible'));
    // Reset warning messages
    document.querySelectorAll('.warning-message').forEach(warning => warning.classList.remove('visible'));
    // Hide conditional UI elements by default
    document.getElementById('delayOptionContainer').style.display = 'none';
    document.getElementById('openAtEndContainer').style.display = 'none';
}

/**
 * Handles the save button click - validates and saves the action
 */
export function handleSaveAction() {
    const mouseButton = document.getElementById('mouseButton');
    const mouseButtonError = document.getElementById('mouseButtonError');
    const actionType = document.getElementById('actionType');
    const actionTypeError = document.getElementById('actionTypeError');
    const combinationError = document.getElementById('combinationError');

    // Reset error messages
    mouseButtonError.classList.remove('visible');
    actionTypeError.classList.remove('visible');
    if (combinationError) combinationError.classList.remove('visible');

    // Validate mouse button selection
    if (!mouseButton.value) {
        mouseButtonError.classList.add('visible');
        mouseButton.focus();
        return;
    }

    // Validate action type selection
    if (!actionType.value) {
        actionTypeError.classList.add('visible');
        actionType.focus();
        return;
    }

    // Create combination object to check for duplicates
    const newCombination = {
        key: document.getElementById('combinedKey').value,
        mouseButton: mouseButton.value
    };

    // Check for duplicate combinations
    if (isDuplicateCombination(newCombination, savedActionsContainer, modal.editingCard)) {
        // If combinationError doesn't exist, create it
        if (!combinationError) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'combinationError';
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'This key and mouse combination is already in use!';
            mouseButton.parentNode.appendChild(errorDiv);
        } else {
            combinationError.classList.add('visible');
        }
        return;
    }

    // Create action object with form data
    const action = {
        combination: newCombination,
        openLinks: actionType.value === 'openLinks',
        openWindow: actionType.value === 'openWindow',
        copyUrls: actionType.value === 'copyUrls',
        copyUrlsAndTitles: actionType.value === 'copyUrlsAndTitles',
        copyTitles: actionType.value === 'copyTitles',
        createBookmarks: actionType.value === 'createBookmarks',
        smartSelect: document.getElementById('smartSelect').checked ? 'on' : 'off',
        avoidDuplicates: document.getElementById('avoidDuplicates').checked ? 'on' : 'off',
        reverseOrder: document.getElementById('reverseOrder').checked,
        openAtEnd: document.getElementById('openAtEnd').checked,
        boxColor: document.getElementById('boxColor').value,
        tabDelay: parseFloat(document.getElementById('tabDelay').value),
        borderThickness: parseInt(document.getElementById('borderThickness').value) || 2,
        borderStyle: document.getElementById('borderStyle').value || 'solid'
    };

    // Add formatting options if copyUrlsAndTitles is selected
    if (action.copyUrlsAndTitles) {
        action.formatPattern = document.getElementById('formatPattern')?.value || 'titleFirst';
        action.separatorType = document.getElementById('separatorType')?.value || 'newline';
        action.separatorCount = parseInt(document.getElementById('separatorCount')?.value || '1', 10);
        action.linkSeparatorCount = parseInt(document.getElementById('linkSeparatorCount')?.value || '0', 10);
    }

    // Handle editing vs creating new action
    if (modal.editingCard) {
        const updatedCard = createActionCard(action, savedActionsContainer, modal);
        modal.editingCard.replaceWith(updatedCard);
        modal.editingCard = null;
    } else {
        savedActionsContainer.appendChild(createActionCard(action, savedActionsContainer, modal));
    }

    // Save all actions to storage
    const allActions = Array.from(savedActionsContainer.children).map(card => card.actionData);
    saveActionsToStorage(allActions);

    closeModal();
}

/**
 * Sets up all modal-related event listeners
 * @param {Object} elements - Object containing button references
 */
export function setupModalListeners(elements) {
    const { actionButton, closeButton, cancelButton, advancedOptionsToggle } = elements;

    // Open modal button
    actionButton.addEventListener('click', openModal);

    // Close buttons
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Advanced options toggle
    if (advancedOptionsToggle && collapsibleSection) {
        advancedOptionsToggle.addEventListener('click', () => {
            collapsibleSection.classList.toggle('collapsed');
        });
    }

    // Save button
    document.getElementById('saveButton').addEventListener('click', handleSaveAction);

    // Tab delay slider
    const tabDelaySlider = document.getElementById('tabDelay');
    const delayValueDisplay = document.getElementById('delayValue');
    tabDelaySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        delayValueDisplay.textContent = value.toFixed(1) + 's';
    });
}

/**
 * Sets up form validation and action type change handlers
 */
export function setupFormValidation() {
    // Mouse button validation
    document.getElementById('mouseButton').addEventListener('change', (e) => {
        const mouseButtonError = document.getElementById('mouseButtonError');
        if (!e.target.value) {
            mouseButtonError.classList.add('visible');
        } else {
            mouseButtonError.classList.remove('visible');
        }
    });

    // Action type validation and conditional UI
    document.getElementById('actionType').addEventListener('change', (e) => {
        const actionTypeError = document.getElementById('actionTypeError');
        if (!e.target.value) {
            actionTypeError.classList.add('visible');
        } else {
            actionTypeError.classList.remove('visible');
        }

        // Show/hide conditional UI elements based on action type
        const delayContainer = document.getElementById('delayOptionContainer');
        const openAtEndContainer = document.getElementById('openAtEndContainer');
        const formatOptionsContainer = document.getElementById('formatOptionsContainer');

        if (e.target.value === 'openLinks' || e.target.value === 'openWindow') {
            delayContainer.style.display = 'flex';
        } else {
            delayContainer.style.display = 'none';
        }

        if (e.target.value === 'openLinks') {
            openAtEndContainer.style.display = 'flex';
        } else {
            openAtEndContainer.style.display = 'none';
        }

        if (e.target.value === 'copyUrlsAndTitles') {
            formatOptionsContainer.style.display = 'block';
            // Update the preview with the loaded settings
            updateFormatOptionVisibility();
            setTimeout(updateFormatPreview, 0);
        } else {
            formatOptionsContainer.style.display = 'none';
        }
    });

    // Format pattern change handler
    document.getElementById('formatPattern')?.addEventListener('change', () => {
        updateFormatOptionVisibility();
        updateFormatPreview();
    });
}

/**
 * Updates the visibility of format options based on selected pattern
 */
function updateFormatOptionVisibility() {
    const formatPattern = document.getElementById('formatPattern')?.value;
    const separatorCountContainer = document.getElementById('separatorCount')?.closest('.input-group');
    const linkSeparatorCountContainer = document.getElementById('linkSeparatorCount')?.closest('.input-group');
    const separatorTypeContainer = document.getElementById('separatorType')?.closest('.input-group');

    if (!separatorCountContainer || !linkSeparatorCountContainer || !separatorTypeContainer) return;

    // Reset all to visible first
    separatorCountContainer.style.display = 'flex';
    linkSeparatorCountContainer.style.display = 'flex';
    separatorTypeContainer.style.display = 'flex';

    if (formatPattern === 'markdown') {
        // Markdown: hide separator count (uses standard markdown format)
        separatorCountContainer.style.display = 'none';
        separatorTypeContainer.style.display = 'none'; // Also hide separator type for Markdown as it's fixed
    } else if (formatPattern === 'json') {
        // JSON: hide all separator options
        separatorCountContainer.style.display = 'none';
        linkSeparatorCountContainer.style.display = 'none';
        separatorTypeContainer.style.display = 'none';
    }
}
