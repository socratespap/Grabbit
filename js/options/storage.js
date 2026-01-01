/**
 * Storage module for Grabbit Options
 * Manages Chrome storage interactions for actions and settings
 */

import { isExtension } from './env.js';

/**
 * Saves user-defined actions to Chrome storage
 * @param {Array} actions - Array of action objects to save
 */
export function saveActionsToStorage(actions) {
    if (!isExtension) return;
    chrome.storage.sync.set({ savedActions: actions }, function () {
        console.log('Actions saved:', actions);
    });
}

/**
 * Saves the selection box color preference to Chrome storage
 * @param {string} color - Hex color code
 */
export function saveBoxColorToStorage(color) {
    if (!isExtension) return;
    chrome.storage.sync.set({ boxColor: color }, function () {
        console.log('Box color saved:', color);
    });
}

/**
 * Loads saved actions and preferences from Chrome storage
 * @param {Function} onActionsLoaded - Callback to handle loaded actions
 * @param {HTMLElement} boxColorInput - The color input element to update
 */
export function loadActionsFromStorage(onActionsLoaded, boxColorInput) {
    if (!isExtension) return;
    chrome.storage.sync.get(['savedActions', 'boxColor'], function (result) {
        // Load saved actions
        if (result.savedActions && onActionsLoaded) {
            onActionsLoaded(result.savedActions);
        }
        // Load saved box color
        if (result.boxColor && boxColorInput) {
            boxColorInput.value = result.boxColor;
        }
    });
}
