/**
 * Utility functions for Grabbit Options
 * Contains helper functions for colors, tooltips, and key labels
 */

import { currentOS } from './env.js';

/**
 * Generates a unique color for a new action from a predefined set of colors
 * Avoids using colors that are already in use by other actions
 * @param {HTMLElement} savedActionsContainer - Container with existing action cards
 * @returns {string} A hex color code
 */
export function generateUniqueColor(savedActionsContainer) {
    // Define our 6 specific colors
    const colors = [
        '#FF0000', // red
        '#0000FF', // blue
        '#008000', // green
        '#FFD700', // yellow
        '#00FFFF', // aqua
        '#FFA500'  // orange
    ];

    // Get all existing action colors
    const existingColors = Array.from(savedActionsContainer.children)
        .map(card => card.actionData?.boxColor)
        .filter(Boolean);

    // Filter out colors that are already in use
    const availableColors = colors.filter(color =>
        !existingColors.includes(color)
    );

    // If all colors are used, return the first color from the original list
    if (availableColors.length === 0) {
        return colors[0];
    }

    // Return a random color from available colors
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors[randomIndex];
}

/**
 * Updates key labels in the UI based on the user's operating system
 * (e.g., showing Command ⌘ instead of Ctrl on macOS)
 * @param {HTMLElement} combinedKeySelect - The modifier key dropdown element
 */
export function updateKeyLabels(combinedKeySelect) {
    if (!combinedKeySelect) return;

    // Update the combinedKey dropdown options based on OS
    const ctrlOption = combinedKeySelect.querySelector('option[value="ctrl"]');
    if (ctrlOption) {
        ctrlOption.textContent = currentOS === 'mac' ? 'Command ⌘' : 'Ctrl';
    }

    // Update the Alt option to show as Option for macOS
    const altOption = combinedKeySelect.querySelector('option[value="alt"]');
    if (altOption) {
        altOption.textContent = currentOS === 'mac' ? 'Option ⌥' : 'Alt';
    }

    // Update the Shift option to include symbol for macOS
    const shiftOption = combinedKeySelect.querySelector('option[value="shift"]');
    if (shiftOption) {
        shiftOption.textContent = currentOS === 'mac' ? 'Shift ⇧' : 'Shift';
    }
}

/**
 * Initializes dynamic positioning for fixed tooltips
 * Required because fixed positioning needs viewport coordinates
 */
export function initializeTooltips() {
    const tooltipTriggers = document.querySelectorAll('.smart-select-info');

    tooltipTriggers.forEach(trigger => {
        const tooltip = trigger.querySelector('.tooltip');
        if (!tooltip) return;

        trigger.addEventListener('mouseenter', () => {
            const rect = trigger.getBoundingClientRect();
            // Position tooltip above the trigger, centered horizontally
            tooltip.style.left = rect.left + (rect.width / 2) + 'px';
            tooltip.style.top = (rect.top - 8) + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
        });
    });
}

/**
 * Checks if a key+mouse combination already exists in saved actions
 * @param {Object} newCombination - The combination to check
 * @param {HTMLElement} savedActionsContainer - Container with existing action cards
 * @param {HTMLElement} editingCard - The card being edited (to exclude from check)
 * @returns {boolean} True if the combination is a duplicate
 */
export function isDuplicateCombination(newCombination, savedActionsContainer, editingCard = null) {
    // Get all existing actions
    const existingActions = Array.from(savedActionsContainer.children);

    // Check each action for matching combination
    return existingActions.some(card => {
        // Skip the card being edited
        if (editingCard === card) return false;

        const action = card.actionData;
        return action.combination.key === newCombination.key &&
            action.combination.mouseButton === newCombination.mouseButton;
    });
}
