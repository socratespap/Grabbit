//=============================================================================
// STATE MANAGEMENT
//=============================================================================

/**
 * Central state object for better organization and tracking of application state
 * @type {Object}
 */
const GrabbitState = {
    isMouseDown: false,         // Flag to track if mouse is down
    isSelectionActive: false,   // Flag to track if drag threshold has been crossed
    startX: 0,                  // Starting X position
    startY: 0,                  // Starting Y position
    lastMouseX: 0,              // Last mouse X position for tracking movement
    lastMouseY: 0,              // Last mouse Y position for tracking movement
    initialScrollY: 0,          // Initial scroll position
    currentScrollY: 0,          // Current scroll position
    selectionBox: null,         // DOM element for selection box
    counterLabel: null,         // DOM element for counter label
    selectedLinks: new Set(),   // Set of selected link elements
    currentMatchedAction: null, // Current matched action configuration
    previousAction: null,       // Previous matched action for state tracking
    currentMouseButton: null,   // Current mouse button being used
    scrollInterval: null,       // Interval ID for auto-scrolling
    savedActions: [],           // Saved actions from storage
    cachedLinks: []             // Cache for link elements and their positions
};

//=============================================================================
// CONSTANTS
//=============================================================================

/**
 * Application constants for better readability and maintenance
 * @type {Object}
 */
const CONSTANTS = {
    SCROLL_THRESHOLD: 20,       // Pixels from viewport edge to trigger scrolling
    SCROLL_SPEED: 35,           // Pixels per frame on scroll
    SCROLL_INTERVAL: 16,        // Milliseconds between scroll updates (~60fps)
    DEBOUNCE_DELAY: 5,          // Milliseconds for debouncing link selection
    DEFAULT_BOX_COLOR: '#2196F3', // Default selection box color
    DRAG_THRESHOLD: 5           // Pixels to drag before activating selection
};
