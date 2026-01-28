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

### Core Technologies
*   **JavaScript (Vanilla):** Core logic, utilizing ES6+ features.
*   **HTML/CSS:** UI for Popup and Options pages. Leveraging **CSS Variables** for a centralized design system.
*   **Chrome APIs:** `storage`, `tabs`, `windows`, `clipboard`, `scripting`, `bookmarks`.
*   **Manifest V3:** Adheres to the latest Chrome extension security and background service worker requirements.
*   **Backend (PHP/WordPress):** Secure server-side proxy for handling Gemini AI requests and Stripe integration.

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
*   **`compare/`**: (New) Standalone page for AI-powered product comparisons.
    *   `compare.html`: Comparison page structure.
    *   `compare.js`: Logic for comparison workflow and UI.
    *   `compare.css`: Premium Glassmorphism styling.
*   **`summarize/`**: (New) Standalone page for AI-powered article summarization.
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

### `js/grabbit.js`
**Role:** Main Entry Point & Event Orchestrator
*   **Initialization:** Loads saved actions from `chrome.storage.sync`.
*   **Event Listeners:** `mousedown` (starts tracking), `mousemove` (checks drag threshold), `mouseup` (finalizes selection), `keydown` (handles modifiers/ESC), `window.blur` (cleanup).

### `js/state.js`
**Role:** State Management
*   **GrabbitState:** Global state object (mouse position, selection status, cached links, smartSelectActive, exclusionFilters).
*   **CONSTANTS:** Configuration values (drag threshold, scroll speed, debounce delay).

### `js/ui.js`
**Role:** DOM & Visuals
*   Handles creation and updating of the selection box and counter label.

### `js/utils.js`
**Role:** Helper Functions
*   OS detection, key combination matching, debounce implementation, and DOM traversal (including Shadow DOM).

### `js/logic.js`
**Role:** Core Business Logic
*   **updateSelectionBox()**: Calculates geometry.
*   **handleScroll()**: Auto-scrolling.
*   **isLinkExcluded()**: Checks URLs against keyword and regex exclusion patterns.
*   **processSelectedLinks()**: Executes actions (open/copy), handles deduplication, and reverse ordering.
*   **updateSelectedLinks()**: Collision detection, Smart Select (heading-based filtering), and Exclusion Filtering.

### `js/smart-select.js`
**Role:** Adaptive Pattern-Based Selection
*   **Purpose:** Implements the "Adaptive Smart Select" algorithm that finds and selects links based on repeating visual/structural patterns.

### `js/visited.js`
**Role:** Persistent Visited State Management
*   Bypasses privacy restrictions (like Google Search redirects) by using `chrome.storage.local` to track and style visited links.

### `js/linkify.js`
**Role:** Text-to-Link Conversion
*   Converts plain text URLs to clickable links using sophisticated regex. Supports "Aggressive Mode" for domain-only recognition and works within code blocks and Shadow DOM.

### `compare/compare.js`
**Role:** AI Comparison Logic
*   Orchestrates the 3-step comparison process (Extract -> Analyze -> Build), handles API errors, and renders the dynamic comparison results table.

### `summarize/summarize.js`
**Role:** AI Summarization Logic
*   Orchestrates the article summarization workflow (Extract -> Summarize -> Render), handles API errors, and renders the summary results with key takeaways and topics.

### `wordpress-plugin/grabbit-backend.php`
**Role:** Backend Infrastructure
*   Acts as a secure server-side proxy for Gemini API requests to protect the API key. Handles user validation, Stripe webhook integration, and daily rate limiting.

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

## Known Issues

- 🔴 ESC will cancel selection but have a conflict with windows shortcuts if pressed with ctrl || shift || alt
- 🔴 **Letter keys (A-Z)** as modifiers may not work correctly with some laptop trackpads due to palm rejection or hardware limitations.
- 🔴 Unknown compatibility with other browsers or operating systems.
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Right mouse for open links - Copy links with CTRL + Right Mouse, release the CTRL, it does not change to open links while the opposite works.
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Ctrl + Left mouse for open links. Only action with right mouse works
- 🟢 Lifting keyboard key and no action is found for mouse only actions, is still selecting
- 🟢 Removed unused context menu permission
- 🔴 Not compatible with Netsuite
- 🟢 Fix naming of buttons in Mac

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