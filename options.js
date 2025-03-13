// Global state management
// Check if we're in a Chrome extension context to handle API calls safely
const isExtension = typeof chrome !== 'undefined' && chrome.storage;

// OS Detection Function
function detectOS() {
    const platform = navigator.userAgent.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    if (platform.includes('linux')) return 'linux';
    return 'windows'; // Default to Windows if unable to detect
}

// Get the current OS
const currentOS = detectOS();

// DOM Elements - Get all the important buttons and containers we need
const actionButton = document.querySelector('.action-button');     // The big "Add New Action" button
const modal = document.getElementById('actionModal');              // The popup window
const closeButton = document.querySelector('.modal-close');        // The X button to close the popup
const cancelButton = document.getElementById('cancelButton');      // The Cancel button in the popup
const combinedKeySelect = document.getElementById('combinedKey');  // The dropdown for keyboard keys
const savedActionsContainer = document.getElementById('savedActions'); // Where we show all saved actions
const boxColorInput = document.getElementById('boxColor');         // Color picker for selection box

// Storage Functions
// Function to save actions to Chrome storage
function saveActionsToStorage(actions) {
    if (!isExtension) return;
    chrome.storage.sync.set({ savedActions: actions }, function() {
        console.log('Actions saved:', actions);
    });
}

// Function to save box color to Chrome storage
function saveBoxColorToStorage(color) {
    if (!isExtension) return;
    chrome.storage.sync.set({ boxColor: color }, function() {
        console.log('Box color saved:', color);
    });
}

// Function to load actions from Chrome storage
function loadActionsFromStorage() {
    if (!isExtension) return;
    chrome.storage.sync.get(['savedActions', 'boxColor'], function(result) {
        // Load saved actions
        if (result.savedActions) {
            result.savedActions.forEach(action => {
                savedActionsContainer.appendChild(createActionCard(action));
            });
        }
        // Load saved box color
        if (result.boxColor) {
            boxColorInput.value = result.boxColor;
        }
    });
}

// Function to update key labels based on OS
function updateKeyLabels() {
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

// Action Card Management
// Function to create a new action card with all its functionality
function createActionCard(action) {
    const card = document.createElement('div');
    card.className = 'card saved-action';

    // Create combination text for display
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
if (action.copyUrlsAndTitles) features.push('Copy URLs & Titles');
if (action.reverseOrder) features.push('Reverse Order');
if ((action.openLinks || action.openWindow) && action.tabDelay > 0) features.push(`${action.tabDelay}s Delay`);



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
        // Populate the modal with current action data
        document.getElementById('combinedKey').value = action.combination.key;
        document.getElementById('mouseButton').value = action.combination.mouseButton;
        document.getElementById('actionType').value = action.openLinks ? 'openLinks' : (action.openWindow ? 'openWindow' : (action.copyUrlsAndTitles ? 'copyUrlsAndTitles' : 'copyUrls'));
        document.getElementById('smartSelect').value = action.smartSelect;
        document.getElementById('reverseOrder').checked = action.reverseOrder || false;
        document.getElementById('boxColor').value = action.boxColor || '#2196F3'; // Load saved color or default
        document.getElementById('tabDelay').value = action.tabDelay || 0; // Load saved delay or default
        document.getElementById('delayValue').textContent = action.tabDelay || 0; // Update display value
        
        // Show/hide delay option based on action type
        const delayContainer = document.getElementById('delayOptionContainer');
        if (action.openLinks || action.openWindow) {
            delayContainer.style.display = 'flex';
        } else {
            delayContainer.style.display = 'none';
        }

        // Show the modal and mark it as editing
        modal.classList.add('active');
        modal.editingCard = card;
    });

    // Add delete functionality to the card
    const deleteButton = card.querySelector('.delete-action');
    deleteButton.addEventListener('click', () => {
        card.remove();
        // Update storage after deletion
        const remainingActions = Array.from(savedActionsContainer.children).map(card => card.actionData);
        saveActionsToStorage(remainingActions);
    });

    return card;
}

function generateUniqueColor() {
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
        .map(card => card.actionData.boxColor);
    
    // Filter out colors that are already in use
    const availableColors = colors.filter(color => 
        !existingColors.includes(color)
    );
    
    // If all colors are used, return the first color from the original list
    // This ensures we always return a color even if all are used
    if (availableColors.length === 0) {
        return colors[0];
    }
    
    // Return a random color from available colors
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors[randomIndex];

}

// Modal Management
// Function to open the modal
actionButton.addEventListener('click', () => {
    modal.classList.add('active');

    // Set a unique color when opening the modal
    document.getElementById('boxColor').value = generateUniqueColor();
});

// Function to close the modal and reset its state
const closeModal = () => {
    modal.classList.remove('active');
    modal.editingCard = null;
    // Reset all form selections
    document.getElementById('combinedKey').value = 'none';
    document.getElementById('mouseButton').value = '';
    document.getElementById('actionType').value = '';
    document.getElementById('reverseOrder').checked = false;
    document.getElementById('tabDelay').value = 0;
    document.getElementById('delayValue').textContent = '0';
    // Reset all error messages
    document.querySelectorAll('.error-message').forEach(error => error.classList.remove('visible'));
    // Hide delay option by default
    document.getElementById('delayOptionContainer').style.display = 'none';
};

// Add close functionality to buttons
closeButton.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Function to check if a key+mouse combination already exists
function isDuplicateCombination(newCombination, editingCard = null) {
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

// Form Validation and Submission
// Save button click handler
document.getElementById('saveButton').addEventListener('click', () => {
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
    if (isDuplicateCombination(newCombination, modal.editingCard)) {
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
        smartSelect: document.getElementById('smartSelect').value,
        reverseOrder: document.getElementById('reverseOrder').checked,
        boxColor: document.getElementById('boxColor').value,
        tabDelay: parseInt(document.getElementById('tabDelay').value, 10) // Add the tab delay value
    };

    // Handle editing vs creating new action
    if (modal.editingCard) {
        const updatedCard = createActionCard(action);
        modal.editingCard.replaceWith(updatedCard);
        modal.editingCard = null;
    } else {
        savedActionsContainer.appendChild(createActionCard(action));
    }

    // Save all actions to storage
    const allActions = Array.from(savedActionsContainer.children).map(card => card.actionData);
    saveActionsToStorage(allActions);
    
    closeModal();
});

// Box Color Management
// Handle box color changes
boxColorInput.addEventListener('change', (e) => {
    saveBoxColorToStorage(e.target.value);
});

// Load saved actions when the page loads
if (isExtension) {
    document.addEventListener('DOMContentLoaded', () => {
        loadActionsFromStorage();
        updateKeyLabels();
    });
} else {
    // For non-extension environments (like local testing)
    updateKeyLabels();
}

// Form Validation
// Add validation handlers for required fields
document.getElementById('mouseButton').addEventListener('change', (e) => {
    const mouseButtonError = document.getElementById('mouseButtonError');
    if (!e.target.value) {
        mouseButtonError.classList.add('visible');
    } else {
        mouseButtonError.classList.remove('visible');
    }
});

document.getElementById('actionType').addEventListener('change', (e) => {
    const actionTypeError = document.getElementById('actionTypeError');
    if (!e.target.value) {
        actionTypeError.classList.add('visible');
    } else {
        actionTypeError.classList.remove('visible');
    }
    
    // Show/hide delay option based on action type
    const delayContainer = document.getElementById('delayOptionContainer');
    if (e.target.value === 'openLinks' || e.target.value === 'openWindow') {
        delayContainer.style.display = 'flex';
    } else {
        delayContainer.style.display = 'none';
    }
});

// Add event listener for the delay slider
const tabDelaySlider = document.getElementById('tabDelay');
const delayValueDisplay = document.getElementById('delayValue');

tabDelaySlider.addEventListener('input', (e) => {
    delayValueDisplay.textContent = e.target.value;
});

// handle pin extension button
const pinExtensionButton = document.getElementById('pinExtensionButton');
pinExtensionButton.addEventListener('click', async () => {
    try {
        // Chrome API to get extension ID
        const extensionId = chrome.runtime.id;
        // Chrome API to pin the extension
        await chrome.action.setPopup({ popup: 'popup.html' });
        await chrome.action.enable();
        // This will open the extensions menu to allow user to pin
        await chrome.tabs.create({
            url: 'chrome://extensions/?id=' + extensionId
        });
    } catch (error) {
        console.error('Failed to pin extension:', error);
    }
});

// Handle rate extension button
document.getElementById('rateExtensionButton').addEventListener('click', () => {
    const extensionId = chrome.runtime.id;
    chrome.tabs.create({
        url: `https://chrome.google.com/webstore/detail/${extensionId}/reviews`
    });
});
