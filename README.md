# Grabbit - Chrome Extension

![Users](https://img.shields.io/badge/Users-50,000%2B-blue?style=for-the-badge&logo=googlechrome&logoColor=white)
![Rating](https://img.shields.io/badge/Rating-4.1%20%2F%205%20Stars-brightgreen?style=for-the-badge&logo=starship&logoColor=white)

**Grabbit** is a powerful Chrome Extension (Manifest V3) that enables users to select multiple links on a webpage using a customizable drag-select interface. Users can perform various actions on selected links, such as opening them in new tabs/windows or copying their URLs to the clipboard.

[Available on the Chrome Web Store](https://chromewebstore.google.com/detail/grabbit/madmdgpjgagdmmmiddpiggdnpgjglcdk)

## BrowserStack

This project is tested with BrowserStack

## Key Features

*   **Drag-Select:** Intuitive visual selection box.
*   **Custom Actions:** Configurable mouse/keyboard combinations including **A-Z keys** (e.g., G + Right Click to Copy).
*   **Adaptive Smart Selection:** Intelligent pattern-based filtering that automatically detects and selects consistent groups of links (e.g., repeating video titles, grid items) while ignoring clutter.
*   **Linkify:** Automatically converts plain text URLs on web pages into clickable links. Includes an **Aggressive Mode** for domain-only recognition (e.g., `google.com`) and support for links inside code blocks.
*   **Exclusion Filters:** Global keyword and Regular Expression (Regex) filtering to automatically skip unwanted links during drag-selection. Manageable via a dynamic tag-based UI.
*   **Disabled Domains:** Blocklist feature to completely disable Grabbit (Selection, Linkify, Visited tracking) on specific domains. Includes a visual "OFF" badge and a popup overlay with an "Enable" button.
*   **Options Page:** Extensive customization for colors, behavior, and granular filtering rules.
*   **Enhanced Copy Formatting:** Expanded "Copy URLs with Titles" action with support for **Markdown**, **JSON**, and customizable separators (Comma, Dot, Tab, etc.).
*   **Create Bookmarks:** Select multiple links and instantly save them as bookmarks in a folder named after the current page title.
*   **Advanced Options:** Dedicated section for power-user features. Now includes **animated toggle switches**, a dynamic UI that adapts to selected features, and a robust filter/domain management system.
*   **Configurable "Mark as Visited":** (New) Per-action setting in Advanced Options to visually mark links as visited (purple) in the browser.
*   **Dynamic Link Detection:** (New) Automatically detects and allows selection of new links that appear during a drag (e.g., from **infinite scroll** or lazy loading).
*   **AI Product Comparison:** (New) Select multiple product tabs and generate a comprehensive AI-powered comparison table with a clear winner, pros/cons, and feature breakdown.
*   **AI Article Summarization:** (New) Summarize articles and blog posts with AI-generated key takeaways, topic tags, and bottom line analysis.
*   **Modern Architecture:** Refactored into a modular structure for better maintainability and performance.


## Architecture & Technology

The project is built using standard web technologies and the Chrome WebExtensions API. It does **not** require a build step (no Webpack/Rollup) and runs directly as an unpacked extension.

### High-Level Structure

```
Frontend (Chrome Extension)
├── Content Scripts (injected into webpages)
│   ├── Event handling (drag selection, mouse/keyboard)
│   ├── UI rendering (selection box, counter label)
│   ├── Business logic (collision detection, link processing)
│   └── Special features (linkify, visited tracking, smart selection)
├── Background Service Worker (privileged operations)
│   ├── Tab/window management
│   ├── Bookmark creation
│   ├── Clipboard operations
│   ├── Payment integration (ExtPay)
│   └── AI features coordination (comparison, summarization)
├── Options Page (settings UI)
│   ├── Action management (create/edit/delete actions)
│   ├── Advanced options (filters, disabled domains, linkify)
│   ├── Popup customization (button order, visibility)
│   └── Format preview (copy formatting)
├── Popup (quick actions)
│   ├── Tab management (copy/open URLs)
│   └── AI feature triggers (compare, summarize)
└── AI Features Pages
    ├── Product Comparison (AI Features/compare/)
    └── Article Summarization (AI Features/summarize/)

Backend (WordPress Plugin)
├── Secure API proxy
├── ExtPay integration (payment validation)
├── Rate limiting (daily quotas)
└── User management (subscribers, usage tracking)
```

### Component Interaction Flow

1. **User Action**: Content scripts detect mouse/keyboard input on webpages
2. **Event Processing**: `grabbit.js` orchestrates event handling through modular components
3. **Action Execution**: For privileged operations (tabs, bookmarks), messages sent to `background.js`
4. **AI Features**: Comparison data sent through WordPress backend proxy (API keys never exposed to client)
5. **Result Display**: UI components render feedback (selection box, success messages, comparison tables)
6. **Settings Management**: Options pages use modular components (sidebar, footer) with auto-initialization
7. **Popup Actions**: Popup loads configuration from storage, renders buttons based on user preferences
8. **Premium Features**: ExtPay validates subscription, backend enforces rate limiting

### Core Technologies
*   **JavaScript (Vanilla):** Core logic, utilizing ES6+ features.
*   **HTML/CSS:** UI for Popup and Options pages. Leveraging **CSS Variables** for a centralized design system.
*   **Chrome APIs:** `storage`, `tabs`, `windows`, `clipboard`, `scripting`, `bookmarks`.
*   **Manifest V3:** Adheres to the latest Chrome extension security and background service worker requirements.
*   **Backend (PHP/WordPress):** Secure server-side proxy for handling AI requests and Stripe integration.
*   **AI:** OpenRouter API for product comparison and article summarization.
*   **Payments:** ExtPay (Chrome extension payment platform), Stripe API.

### Directory Structure

*   **`manifest.json`**: The entry point. Defines permissions, background scripts, and the order of content script injection.
*   **`css/`**: Global styles and design tokens.
    *   `variables.css`: **Single Source of Truth** for design tokens (colors, gradients, fonts, shadows, transitions).
    *   `options.css`: Main layout and component styles for the settings page.
    *   `sidebar.css`: Styles for the navigation sidebar.
*   **`popup/`**: The small window that appears when clicking the extension icon.
    *   `popup.html`: Structure of the popup, featuring a **Modern Glassmorphism** design.
    *   `popup.js`: Logic for quick actions (e.g., "Copy all tabs"). Handles dynamic success states for nested button elements.
    *   `popup.css`: **Complete Redesign** featuring animated background orbs, dark glassmorphism cards, and gradient icon boxes. Standardized using global variables.
*   **`options.html` / `js/options/`**: The full settings page for configuring actions and appearance, now refactored into ES modules.
*   **Advanced Options:** Dedicated sub-page for power-user settings.
    *   `advancedOptions.html`: Layout for experimental features including Linkify, **Exclusion Filters**, and **Disabled Domains**.
    *   `advancedOptions.js`: Logic for saving/loading advanced settings, managing the exclusion filter list, and the domain blocklist.
    *   `advancedOptions.css`: Specific styling for advanced controls (toggle switches, filter tags).
*   **`AI Features/compare/`**: (New) Standalone page for AI-powered product comparisons.
    *   `compare.html`: Comparison page structure.
    *   `compare.js`: Logic for comparison workflow and UI.
    *   `compare.css`: Premium Glassmorphism styling.
*   **`AI Features/summarize/`**: (New) Standalone page for AI-powered article summarization.
    *   `summarize.html`: Summary page structure.
    *   `summarize.js`: Logic for summarization workflow and UI.
    *   `summarize.css`: Premium Glassmorphism styling.
*   **`wordpress-plugin/`**: Server-side backend code.
    *   `grabbit-backend.php`: Secure proxy and user management plugin.
    *   `README.md`: Backend setup guide.
*   **`js/linkify.js`**: (New) Scans the page for plain text URLs and converts them to clickable `<a>` tags if enabled.
*   **`js/visited.js`**: (New) Handles persistent tracking and visual marking of visited links to bypass browser redirect limitations.

### 4. Modular Options Page
The options page has been refactored from a single monolithic file into multiple ES modules, improving code reuse and testing:
- **`main.js`**: Orchestrates initialization.
- **`env.js`**: Environment constants (OS detection, Extension context).
- **`storage.js`**: Handles saving/loading actions to `chrome.storage.sync`.
- **`utils.js`**: Helpers for colors, key labels, and tooltips.
- **`preview.js`**: Live format preview for "Copy URLs & Titles".
- **`card.js`**: Component for managing action cards.
- **`modal.js`**: Manages the "Add/Edit Action" modal lifecycle.
- **`popup-config.js`**: Popup button management and drag-and-drop reordering.

### 5. Critical Content Script Loading Order

The order in `manifest.json` → `content_scripts` → `js` is **critical**. Scripts share a global scope:

1. `js/state.js` - **MUST LOAD FIRST** - Defines `GrabbitState` global object and `CONSTANTS`
2. `js/utils.js` - Helper functions used by other modules
3. `js/ui.js` - DOM manipulation functions
4. `js/visited.js` - Visited link tracking
5. `js/smart-select.js` - Adaptive pattern-based selection
6. `js/logic.js` - Core business logic
7. `js/linkify.js` - Text-to-link conversion
8. `js/grabbit.js` - **MUST LOAD LAST** - Main entry point and event orchestrator

**Never reorder these scripts without understanding dependencies**. Many modules reference `GrabbitState` or functions from earlier-loaded scripts.

## CSS Architecture & Design System

The project uses a **"No Build Step"** CSS architecture that leverages modern browser features to maintain a clean and scalable codebase.

### 1. Centralized Variables (`css/variables.css`)
All design tokens are defined in the `:root` pseudo-class within `variables.css`. This file acts as the single source of truth for:
*   **Color Palette**: Integrated primary/secondary colors and status colors (success, warning, error).
*   **Gradients**: Standardized linear gradients for buttons, backgrounds, and the sidebar.
*   **Typography**: A unified font stack across all extension pages.
*   **Shadows & Transitions**: Consistent depth and motion tokens.

### 2. Externalized & Redesigned Popup Styles
To maintain separation of concerns and benefit from caching, styles have been extracted from `popup.html` into `popup.css`. The popup has been completely redesigned with a premium aesthetic:
*   **Glassmorphism**: Using `backdrop-filter` and semi-transparent backgrounds for a modern "frosted glass" look.
*   **Animated Components**: Decorative floating background orbs and pulsing logo glows for a living UI.
*   **Visual Hierarchy**: Buttons now feature distinct icon boxes with custom gradients, primary titles, and descriptive subtitles.
*   **Dynamic States**: Success states are handled gracefully with color transitions and content updates via JavaScript.

### 3. Component-Based Styles
Styles are organized by component area (Options, Sidebar, Popup), each inheriting variables from the global pool. This allows for rapid UI adjustments without global "find and replace" operations.

## Codebase Reference

### Content Scripts (Shared Scope)

**`js/grabbit.js`** - Main Entry Point & Event Orchestrator
- Initializes by loading saved actions from `chrome.storage.sync`
- Core event listeners: `mousedown` (start tracking), `mousemove` (check 5px drag threshold), `mouseup` (finalize selection), `keydown` (modifiers/ESC), `window.blur` (cleanup)
- Delegates specific logic to specialized modules
- Activates selection UI only after 5px drag threshold (prevents accidental selections)

**`js/state.js`** - State Management
- `GrabbitState`: Global state object (mouse position, selection status, cached links, active modifiers, filters)
- `CONSTANTS`: Drag threshold (5px), scroll speed, link refresh interval (500ms for infinite scroll), debounce delays

**`js/logic.js`** - Core Business Logic
- `updateSelectionBox()`: Calculates geometry relative to document
- `handleScroll(mouseY)`: LinkClump-style auto-scrolling near viewport edges
- `isLinkExcluded(url)`: Checks URLs against keyword/regex filters
- `updateSelectedLinks()`: Collision detection, Smart Select orchestration, exclusion filtering
- `processSelectedLinks(matchedAction)`: Executes actions (open/copy/bookmark) with deduplication and formatting

**`js/ui.js`** - DOM & Visuals
- `createSelectionBox()`: Absolute-positioned selection overlay
- `createCounterLabel()`: Floating status label with action text
- `updateVisualStyles()`: Syncs box colors, border styles, counter text
- `cleanupSelection()`: Removes UI, resets state, clears intervals

**`js/utils.js`** - Helper Functions
- `getOS()`: Cross-platform OS detection
- `checkKeyCombination(e, mouseButton)`: Matches input against saved actions
- `getMouseButton(e)`: Normalizes mouse button codes
- `isElementSticky(element)`: Collision detection helper for sticky headers
- `isDomainDisabled(disabledDomains)`: Checks current domain against blocklist
- `debounce(func, wait)`: Performance wrapper for high-frequency events
- `getAllLinks(root)`: Deep link discovery including Shadow DOM traversal

**`js/smart-select.js`** - Adaptive Pattern-Based Selection
- `apply(linksInBox)`: Analyzes links in selection, builds frequency map of signatures
- `getLinkSignature(link, style)`: Generates unique signature based on structure, tag name, font weight/size
- `isLinkImportant(link, style)`: Heuristic engine for semantically/visually important links (headings, bold)
- Filters selection to repeating patterns (count >= 2), prioritizing "important" links

**`js/visited.js`** - Persistent Visited State Management
- Bypasses privacy restrictions (e.g., Google Search redirects) using `chrome.storage.local`
- `injectGrabbitVisitedStyles()`: Injects CSS for `.grabbit-visited` class
- `applyGrabbitVisitedStyling()`: Restores visited styling on page load
- `markLinksAsGrabbitVisited(urls, anchorElements)`: Persists and updates UI

**`js/linkify.js`** - Text-to-Link Conversion
- Regex engine for `http`, `https`, `ftp`, `www` URLs
- Aggressive Mode: Prefix-less domain recognition (e.g., `github.com/user/repo`)
- DOM traversal: Recursive walk, skipping `<a>`, `<script>`, `<style>`, `<textarea>`
- Code block support: Includes `<code>` and `<pre>` tags
- Shadow DOM support: Handles URLs inside Shadow Roots
- Linkified elements get `.grabbit-linkified` class

### Background Service Worker

**`js/background.js`** - Privileged API Bridge
- `chrome.runtime.onInstalled`: Sets defaults on first run
- `chrome.runtime.onMessage`: Bridges content script requests to privileged APIs
  - `tabs.create`: Opens links in new tabs
  - `windows.create`: Opens links in new windows
  - `bookmarks.create`: Creates bookmarks
  - Clipboard operations via `chrome.clipboard`
- `updateIconState(tabId, url)`: Manages "OFF" badge for disabled domains
- `createBookmarksInFolder(parentId)`: Recursive helper for batch bookmark creation
- Coordinates AI comparison workflow with backend

### Options Page (Modular ES6)

**`js/options/main.js`** - Orchestrator
- `initialize()`: Main entry point
- `setupExtensionButtons()`: Pin and Rate button logic

**`js/options/modal.js`** - Add/Edit Dialog
- `openModal()` / `closeModal()`: Lifecycle management
- `handleSaveAction()`: Form validation and persistence
- `setupFormValidation()`: Real-time UI feedback
- `updateFormatOptionVisibility()`: Dynamic UI toggling

**`js/options/card.js`** - Action Cards
- `createActionCard(action)`: Visual representation of saved actions
- `openEditModal(action, card)`: Pre-populates modal for editing

**`js/options/preview.js`** - Format Preview
- `updateFormatPreview()`: Live terminal-style preview for copy formatting
- `setupPreviewListeners()`: Attaches change events

**`js/options/storage.js`** - Persistence
- `saveActionsToStorage(actions)`: Syncs to `chrome.storage.sync`
- `loadActionsFromStorage()`: Retrieves settings on load

**`js/options/env.js`** - Environment Detection
- `isExtension`: Checks if running in Chrome extension context
- `currentOS`: Cross-platform OS detection for UI customization

**`js/options/utils.js`** - Options Page Utilities
- `generateUniqueColor()`: Assigns colors to action cards from predefined palette
- `updateKeyLabels()`: Updates modifier key labels based on OS (e.g., Command ⌘ on Mac)
- `initializeTooltips()`: Sets up fixed positioning for tooltips
- `isDuplicateCombination()`: Validates for duplicate key+mouse combinations

**`js/options/popup-config.js`** - Popup Button Management
- `POPUP_BUTTONS`: Registry of all popup buttons with metadata
- `loadPopupConfig()` / `savePopupConfig()`: Persist button order and enabled state
- `initializePopupConfig()`: Renders drag-and-drop button list
- Drag-and-drop reordering with `setupDragAndDrop()`
- Toggle switches for enabling/disabling buttons
- `getButtonIcon()`: Returns SVG HTML for button icons

### AI Features Pages

**`AI Features/compare/compare.js`** - Comparison Workflow & UI
- Checks for pending comparison data from `chrome.storage.local`
- `runComparison()`: Orchestrates 3-step process (Extract → Analyze → Build)
- Communicates with `background.js` to trigger AI analysis
- Handles error states (premium required, daily limit reached)
- `renderResults(data)`: Builds Winner Banner, Products Grid, Features Table
- `updateStep(stepNumber)`: Progress tracker visualization

**`AI Features/summarize/summarize.js`** - Summarization Workflow & UI
- Checks for pending summary data from `chrome.storage.local`
- `runSummary()`: Orchestrates summarization process (Extract → Summarize → Render)
- Communicates with `background.js` to trigger AI analysis
- Handles error states (premium required, daily limit reached)
- `renderResults(data)`: Builds Summary Banner, Key Takeaways, Topics, Bottom Line

### Popup (Quick Access Interface)

**`popup/popup.js`** - Main Popup Script
- Loads popup configuration from `popup-config.js`
- Renders enabled buttons in configured order
- **Copy Selected Tabs**: Copies URLs of currently selected tabs
- **Copy All Tabs**: Copies all open tab URLs in current window
- **Open Copied Links**: Opens links from clipboard (one per line)
- **Compare Products**: Triggers AI product comparison workflow
- **Summarize Page**: Triggers AI article summarization workflow
- Premium badge display and ExtPay integration
- Glassmorphism UI with animated backgrounds

**`popup/popup.html`** - Popup Interface
- Glassmorphism design with animated background orbs
- Dynamic button rendering based on configuration
- Premium features with PRO badges
- Responsive layout for various screen sizes

**`popup/popup.css`** - Popup Styling
- Glassmorphism effects with backdrop-filter
- Animated gradient backgrounds and orbs
- Button hover effects and transitions
- Premium badge styling
- Inherits all design tokens from `css/variables.css`

### Reusable Components

**`js/components/sidebar.js`** - Navigation Sidebar Component
- `GrabbitSidebar` class: Auto-initializing component
- Renders navigation menu with links to Main Options, Popup Options, Advanced Options
- Handles active section highlighting and hash-based navigation
- Internal page section switching without page reload

**`js/components/footer.js`** - Footer Component
- `GrabbitFooter` class: Auto-initializing component
- Renders footer with support links (PayPal, Revolut)
- Displays contributor list with GitHub links
- "Contribute on GitHub" callout button
- Handles rate and pin extension button functionality

### Premium & Payment Integration

**`js/premium.js`** - ExtPay Payment Manager
- `Premium.init()`: Initializes ExtPay background service
- `Premium.getUser()`: Returns payment status, email, trial status
- `Premium.openPaymentPage()`: Opens ExtPay payment flow
- `Premium.openLoginPage()`: Opens ExtPay login for existing users
- `Premium.validateWithBackend(email)`: Validates license with WordPress backend
- Syncs with ExtPay dashboard (extension ID: `grabbit-premium`)

**`js/ExtPay.js`** - Third-Party Payment Library
- External ExtPay library for Chrome extension payments
- Handles subscription management, trial periods, payment processing
- Injected as content script on `extensionpay.com` domain
- DO NOT MODIFY - External dependency

### Content Extraction

**`js/content-extractor.js`** - Product Content Extractor
- `extractProductData()`: Intelligently extracts product information for AI comparison
- **Title Extraction**: H1, product-title selectors, OG meta tags, document.title fallback
- **Price Extraction**: Multiple selector strategies (Amazon `.a-price-whole`, `.pdp-price`, etc.)
- **Description Extraction**: Product descriptions, meta descriptions, feature bullets (Amazon)
- **Specs Extraction**: Tables, definition lists, spec containers (limited to 5 blocks)
- Returns structured object with title, price, description, specs, URL, site name
- Used via `scripting.executeScript` in background.js for AI features

### Advanced Options Page

**`advancedOptions/advancedOptions.js`** - Advanced Settings Management
- **Linkify Settings**: Toggle linkify on/off, aggressive mode toggle
- **Exclusion Filters**: Add/remove keyword/regex patterns to filter out links
- **Disabled Domains**: Blocklist for domains where Grabbit should not activate
- Real-time validation, duplicate checking, status messages
- Persists all settings to `chrome.storage.sync`

**`advancedOptions/advancedOptions.html`** - Advanced Options UI
- Separate page from main options.html
- Linkify controls (enable/disable, aggressive mode)
- Exclusion filter management with tag-based UI
- Disabled domains blocklist management
- Loaded via sidebar navigation

**`advancedOptions/advancedOptions.css`** - Advanced Options Styling
- Form controls, toggle switches, input fields
- Tag-based filter list styling
- Status message animations
- Inherits from `css/variables.css`

### Popup Customization

**`popup/popupOptions/popupOptions.js`** - Popup Button Customization
- Allows users to reorder and enable/disable popup buttons
- Drag-and-drop interface for button reordering
- Toggle switches for button visibility
- Persists configuration to `chrome.storage.sync`

**`popup/popupOptions/popupOptions.html`** - Popup Options UI
- Separate settings page for popup customization
- Lists all popup buttons with icons, titles, subtitles
- Drag handles for reordering
- Reset to defaults button

**`popup/popupOptions/popupOptions.css`** - Popup Options Styling
- Drag-and-drop visual feedback
- Toggle switch styling
- Button preview cards
- PRO badge styling for premium features

## Development & Installation

Since there is no build process, you can work directly on the source files.

1.  **Load Unpacked:**
    *   Open Chrome and go to `chrome://extensions/`.
    *   Enable **Developer Mode** (top right).
    *   Click **Load unpacked**.
    *   Select the root directory of this project (where `manifest.json` is located).

2.  **Reloading Changes:**
    *   After modifying any file (especially `manifest.json` or background scripts), go to `chrome://extensions/` and click the **Reload** (circular arrow) icon on the Grabbit card.
    *   **Crucial:** You must also refresh any web pages where you are testing the content script for the changes to take effect.

## Key Development Patterns

### Global State Management
- `GrabbitState` in `js/state.js` is the single source of truth for:
  - Mouse positions (startX, startY, currentX, currentY)
  - Selection status (isSelecting, selectionBox, counterLabel)
  - Matched action and modifiers
  - Cached links and refresh interval
  - Active exclusion filters and disabled domains

### Event Handling Flow
1. `mousedown` in `grabbit.js`: Stores start position, doesn't activate UI
2. `mousemove`: Checks 5px drag threshold, then calls `activateSelection()`
3. `activateSelection()`: Creates UI elements, starts link refresh timer
4. `updateSelectedLinks()`: Collision detection, Smart Select, filtering
5. `mouseup`: Calls `processSelectedLinks()` with matched action
6. `cleanupSelection()`: Removes UI, resets state, clears intervals

### Action Matching System
- Actions stored in `chrome.storage.sync` with structure:
  ```javascript
  {
    mouseButton: 0|1|2,  // 0=left, 1=middle, 2=right
    modifierKey: "ctrl"|"shift"|"alt"|"meta"|"A"-"Z"|"",
    actionType: "open"|"copy"|"bookmark",
    settings: { /* action-specific config */ }
  }
  ```
- `checkKeyCombination()` in `utils.js` matches input against saved actions
- Modifiers include Ctrl, Shift, Alt, Meta, and letter keys A-Z

### Smart Selection Algorithm
1. Build frequency map of link signatures in selection box
2. Signature = structure + tag name + font weight + font size
3. If patterns repeat (count >= 2), filter to match those patterns
4. Prioritize "important" links (headings, bold text)
5. Reduces selection clutter on complex pages

### Infinite Scroll Support
- `refreshCachedLinks()` called every 500ms during selection
- Scans DOM for new links that appeared since selection started
- Handles lazy loading and infinite scroll scenarios
- Updates link cache without interrupting drag operation

## Common Tasks

### Adding a New Action Type
1. Update action type enum in `js/options/modal.js`
2. Add UI configuration in modal form
3. Add handling in `processSelectedLinks()` in `js/logic.js`
4. Add background message handler in `js/background.js` (if privileged API needed)
5. Test on various websites

### Modifying CSS
1. Check if token exists in `css/variables.css`
2. If not, add new token to `:root`
3. Reference token in component CSS
4. Test across different pages to ensure no conflicts

### Adding New Content Script Module
1. Create file in `js/` directory
2. Add to `manifest.json` → `content_scripts` → `js` array
3. **Critical**: Place in correct dependency order (state → utils → feature modules → grabbit.js)
4. If using `GrabbitState`, ensure it loads after `state.js`
5. Test by reloading extension and refreshing test pages

### Using Reusable Components

**Sidebar Component:**
- Add `<div id="sidebar-placeholder"></div>` to any settings page HTML
- Include `<script src="js/components/sidebar.js"></script>` before closing body tag
- Component auto-initializes on DOMContentLoaded
- Set active section with `data-active-section` attribute: `<div id="sidebar-placeholder" data-active-section="popup-options"></div>`

**Footer Component:**
- Add `<div id="footer-placeholder"></div>` to any settings page HTML
- Include `<script src="js/components/footer.js"></script>` before closing body tag
- Component auto-initializes and renders footer with support links and contributors
- Handles rate and pin button functionality automatically

Both components use class-based architecture with `render()` and `initLogic()` methods for easy customization.

### Customizing Popup Buttons

1. Navigate to Options page → Popup Options
2. Drag buttons to reorder (changes reflect immediately in popup)
3. Use toggle switches to enable/disable buttons
4. Configuration persists to `chrome.storage.sync` via `popup-config.js`
5. Popup reads configuration on load and renders buttons accordingly
6. To add new button types:
   - Add to `POPUP_BUTTONS` registry in `js/options/popup-config.js`
   - Implement handler in `popup/popup.js`
   - Add icon SVG to `getButtonIcon()` function

## Debugging

### Debugging Content Scripts
1. Open Chrome DevTools on test webpage
2. Check Console for errors
3. Inspect `GrabbitState` in Console: `console.log(GrabbitState)`
4. Use `debugger;` statements in content script files
5. Remember to reload extension and refresh page after code changes

### Debugging Background Script
1. Go to `chrome://extensions/`
2. Click "Service worker" link under Grabbit
3. Opens DevTools for background worker
4. Check Console for errors
5. Inspect messages received/sent

## Testing

### Testing Link Selection

**Recommended Test Sites:**
- Hacker News (news.ycombinator.com) - Clean link lists
- Reddit - Complex nested links
- Amazon/e-commerce sites - Product links for AI comparison
- Google Search - Test visited link tracking and redirects

**Testing Edge Cases:**
- Sticky headers that overlap content
- Infinite scroll (Twitter, Facebook feeds)
- Shadow DOM (web components)
- Links within iframes
- Very long pages (test auto-scrolling)

## Usage

1. Click the extension icon to access quick actions
2. Visit the options page to configure custom actions
3. On any webpage:
	- Hold configured mouse button (and key if set)
	- Drag to select multiple links
	- Release to perform the configured action

## Configuration

Access the options page to:
- Create new actions with custom key combinations
- Set different colors for selection boxes
- Configure smart selection options
- Manage existing actions
- Set default behaviors

## Tested via BrowserStack on

- Windows 10
- Windows 11, Chrome Latest Version (28 Jan 2026)
- MacOS Tahoe, Chrome Latest Version (28 Jan 2026)
- Linux, Chrome Latest Version (28 Jan 2026)

## Known Issues & Limitations

- 🔴 ESC key conflicts with Windows shortcuts when used with Ctrl/Shift/Alt
- 🔴 **Letter keys (A-Z)** as modifiers may not work with some laptop trackpads (palm rejection)
- 🔴 Not compatible with Netsuite
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Right mouse for open links - Copy links with CTRL + Right Mouse, release the CTRL, it does not change to open links while the opposite works.
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Ctrl + Left mouse for open links. Only action with right mouse works
- 🟢 Lifting keyboard key and no action is found for mouse only actions, is still selecting
- 🟢 Removed unused context menu permission
- 🟢 Fix naming of buttons in Mac
- ⚠️ Limited to Chrome (Manifest V3)
- ⚠️ No automated test suite (manual testing only)
- ⚠️ ExtPay.js is a third-party dependency - updates may require testing payment flow
- ⚠️ AI features require active internet connection and valid subscription

## Features to be added

- 🟢 Open Links/tabs in reverse order
- 🟢 Copy links with titles
- 🟢  Provide different color on add new action
- 🟢  Added A-Z keys as modifier options for actions
- 🔴 Append Urls to clipboard. Clipboard = selected links + clipboard
- 🟢 Add rating button
- 🟢 Open tabs next to active tab
- 🟢 Recognize <a> tags that are not visible
- 🟢 Include Compatibility with Youtube Subscriptions links
- 🟢 Add delay when opening tabs
- 🟢 Include option when copying URLs ("Title tab Url, instead of Title \n Url")
- 🟢 Create Bookmarks
- 🔴 Fix compatibility with Netsuite
- 🔴 Improve trackpad compatibility for letter key modifiers

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML, CSS
- **Chrome APIs**: storage, tabs, windows, clipboard, scripting, bookmarks
- **Backend**: PHP/WordPress plugin
- **AI**: OpenRouter API
- **Payments**: ExtPay (Chrome extension payment platform), Stripe API
- **Database**: WordPress MySQL database
- **Content Extraction**: Custom DOM parsing for e-commerce sites
- **Component Architecture**: Class-based reusable components with auto-initialization
- **Design System**: CSS Variables, Glassmorphism design, component-based styling
- **Testing**: Manual testing on BrowserStack across multiple platforms

## Changelog

Please refer to the [changelog](changelog.md) for detailed changes in each version.

## Contributions
- @TheTacoScott - https://github.com/TheTacoScott
- @oaustegard - https://github.com/oaustegard
- @digirat - https://github.com/digirat

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Tags

- This is a Linkclump replacement/alternative
- This is a Copy All Urls replacement/alternative
- This is a Copy All Urls replacement/alternative
