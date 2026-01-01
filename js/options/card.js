/**
 * Action Card module for Grabbit Options
 * Handles UI generation for Action Cards
 */

import { currentOS } from './env.js';
import { saveActionsToStorage } from './storage.js';
import { updateFormatPreview } from './preview.js';

/**
 * Creates a visual card representing a user-defined action with all its functionality
 * @param {Object} action - The action configuration object
 * @param {HTMLElement} savedActionsContainer - Container for saved actions
 * @param {HTMLElement} modal - The modal element
 * @returns {HTMLElement} The created card DOM element
 */
export function createActionCard(action, savedActionsContainer, modal) {
    const card = document.createElement('div');
    card.className = 'card saved-action';
    card.style.borderLeftColor = action.boxColor || '#2196F3';

    // Create combination text for display (e.g., "CTRL + Left Mouse Click")
    let combinationText = [];
    if (action.combination.key !== 'none') {
        // Display OS-specific key name
        let keyText = action.combination.key.toUpperCase();
        if (action.combination.key === 'ctrl') {
            keyText = currentOS === 'mac' ? 'COMMAND' : 'CTRL';
        }
        combinationText.push(keyText);
    }
    if (action.combination.mouseButton !== 'none') {
        // Convert mouse button values to user-friendly text
        if (action.combination.mouseButton === 'left') combinationText.push('Left Mouse Click');
        if (action.combination.mouseButton === 'right') combinationText.push('Right Mouse Click');
        if (action.combination.mouseButton === 'middle') combinationText.push('Middle Mouse Click');
    }

    // Create features array for display
    const features = [];
    if (action.openLinks) features.push('Open Links');
    if (action.openWindow) features.push('Open in Window');
    if (action.copyUrls) features.push('Copy URLs');
    if (action.smartSelect === 'on') features.push('Smart Select');
    if (action.avoidDuplicates === 'on') features.push('Avoid Duplicates');
    if (action.copyUrlsAndTitles) {
        features.push('Copy URLs & Titles');
        // Add formatting details for Copy URLs & Titles
        if (action.formatPattern) {
            let formatText = '';
            if (action.formatPattern === 'markdown') {
                formatText = 'Markdown';
            } else if (action.formatPattern === 'json') {
                formatText = 'JSON';
            } else {
                formatText = action.formatPattern === 'titleFirst' ? 'Title&rarr;URL' : 'URL&rarr;Title';
            }
            features.push(formatText);
        }
        if (action.separatorType && action.formatPattern !== 'json' && action.formatPattern !== 'markdown') {
            let separatorText = '';
            switch (action.separatorType) {
                case 'newline':
                    separatorText = 'Newline';
                    break;
                case 'space':
                    separatorText = 'Space';
                    break;
                case 'tab':
                    separatorText = 'Tab';
                    break;
                case 'comma':
                    separatorText = 'Comma';
                    break;
                case 'dot':
                    separatorText = 'Dot';
                    break;
            }
            if (action.separatorCount > 1) {
                separatorText += ` x${action.separatorCount}`;
            }
            features.push(separatorText);
        }
        // Add link separator info if set
        if (action.linkSeparatorCount > 0) {
            features.push(`Link Gap: ${action.linkSeparatorCount}`);
        }
    }
    if (action.copyTitles) features.push('Copy Titles');
    if (action.createBookmarks) features.push('Create Bookmarks');
    if (action.reverseOrder) features.push('Reverse Order');
    if (action.openLinks && action.openAtEnd) features.push('Open at End');
    if ((action.openLinks || action.openWindow) && action.tabDelay > 0) features.push(`${action.tabDelay}s Delay`);

    // Add border styling info
    if (action.borderThickness && action.borderThickness !== 2) {
        features.push(`${action.borderThickness}px Border`);
    }
    if (action.borderStyle && action.borderStyle !== 'solid') {
        features.push(`${action.borderStyle.charAt(0).toUpperCase() + action.borderStyle.slice(1)} Border`);
    }

    // Create color preview
    const colorPreview = `<span class="color-preview" style="background-color: ${action.boxColor || '#2196F3'}"></span>`;

    // Create the HTML structure for the card
    card.innerHTML = `
        <div class="action-details">
            <div class="action-combination">${combinationText.join(' + ') || 'No Combination'}</div>
            <div class="action-features">
                ${colorPreview}
                ${features.map(f => `<span class="action-feature">${f}</span>`).join('')}
            </div>
        </div>
        <div class="action-buttons">
            <button class="edit-action" title="Edit Action">&#9998;</button>
            <button class="delete-action" title="Delete Action">&times;</button>
        </div>
    `;

    // Store the action data in the card for later use
    card.actionData = action;

    // Add edit functionality to the card
    const editButton = card.querySelector('.edit-action');
    editButton.addEventListener('click', () => {
        openEditModal(action, card, modal);
    });

    // Add delete functionality to the card
    const deleteButton = card.querySelector('.delete-action');
    deleteButton.addEventListener('click', () => {
        card.remove();
        // Update storage after deletion
        const remainingActions = Array.from(savedActionsContainer.children).map(c => c.actionData);
        saveActionsToStorage(remainingActions);
    });

    return card;
}

/**
 * Opens the modal in edit mode with the action's data
 * @param {Object} action - The action to edit
 * @param {HTMLElement} card - The card being edited
 * @param {HTMLElement} modal - The modal element
 */
function openEditModal(action, card, modal) {
    // Populate the modal with current action data
    document.getElementById('combinedKey').value = action.combination.key;
    document.getElementById('mouseButton').value = action.combination.mouseButton;

    // Show/hide letter key warning based on the action's key
    const letterKeyWarning = document.getElementById('letterKeyWarning');
    if (letterKeyWarning) {
        const isLetterKey = /^[a-z]$/.test(action.combination.key);
        letterKeyWarning.classList.toggle('visible', isLetterKey);
    }
    document.getElementById('actionType').value = action.openLinks ? 'openLinks' :
        (action.openWindow ? 'openWindow' :
            (action.copyUrlsAndTitles ? 'copyUrlsAndTitles' :
                (action.copyTitles ? 'copyTitles' :
                    (action.createBookmarks ? 'createBookmarks' : 'copyUrls'))));
    document.getElementById('smartSelect').value = action.smartSelect || 'off';
    document.getElementById('avoidDuplicates').value = action.avoidDuplicates || 'on';
    document.getElementById('reverseOrder').checked = action.reverseOrder || false;
    document.getElementById('openAtEnd').checked = action.openAtEnd || false;
    document.getElementById('boxColor').value = action.boxColor || '#2196F3';
    document.getElementById('tabDelay').value = action.tabDelay || 0;
    document.getElementById('delayValue').textContent = (action.tabDelay || 0).toFixed(1) + 's';
    document.getElementById('borderThickness').value = action.borderThickness || 2;
    document.getElementById('borderStyle').value = action.borderStyle || 'solid';

    // Show/hide conditional UI elements based on action type
    const delayContainer = document.getElementById('delayOptionContainer');
    const openAtEndContainer = document.getElementById('openAtEndContainer');
    const formatOptionsContainer = document.getElementById('formatOptionsContainer');

    // Show delay option only for actions that open tabs/windows
    if (action.openLinks || action.openWindow) {
        delayContainer.style.display = 'flex';
    } else {
        delayContainer.style.display = 'none';
    }

    // Show openAtEnd option only for actions that open links
    if (action.openLinks) {
        openAtEndContainer.style.display = 'flex';
    } else {
        openAtEndContainer.style.display = 'none';
    }

    // Show format options only for copyUrlsAndTitles action
    if (action.copyUrlsAndTitles) {
        formatOptionsContainer.style.display = 'block';
        // Populate format options if they exist
        if (action.formatPattern) document.getElementById('formatPattern').value = action.formatPattern;
        if (action.separatorType) {
            const separatorTypeSelect = document.getElementById('separatorType');
            separatorTypeSelect.value = action.separatorType;
        }
        if (action.separatorCount) document.getElementById('separatorCount').value = action.separatorCount;
        if (action.linkSeparatorCount !== undefined) document.getElementById('linkSeparatorCount').value = action.linkSeparatorCount;
        // Update the preview with the loaded settings
        setTimeout(updateFormatPreview, 0);
    } else {
        formatOptionsContainer.style.display = 'none';
    }

    // Show the modal and mark it as editing
    modal.classList.add('active');
    modal.editingCard = card;

    // Set modal title for editing
    const modalTitleEl = document.getElementById('modalTitle');
    if (modalTitleEl) modalTitleEl.textContent = 'Edit Action';

    // Expand advanced options when editing (so user can see current settings)
    const collapsibleSectionEl = document.querySelector('.collapsible-section');
    if (collapsibleSectionEl) collapsibleSectionEl.classList.remove('collapsed');
}
