/**
 * Environment detection module for Grabbit Options
 * Handles OS detection and extension context checking
 */

// Check if we're in a Chrome extension context to handle API calls safely
export const isExtension = typeof chrome !== 'undefined' && chrome.storage;

// Get the current OS for UI customization
// Uses shared getOS() from utils.js if available, with fallback
export const currentOS = typeof getOS !== 'undefined' ? getOS() : 'windows';
