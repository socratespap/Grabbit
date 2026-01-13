## Version 3.6.0 Changelog:
- **Optional Bookmarks Permission**: Moved the "bookmarks" permission to optional permissions to improve user privacy.
- **Runtime Permission Request**: The extension now only requests bookmark access when you specifically use the "Create Bookmarks" action.
- **Improved Transparency**: Reduced initial installation permission footprint.

## Version 3.5.9 Changelog:
- **Dynamic Link Detection**: Implemented periodic link re-caching (every 500ms) while the selection box is active.
- **Support for Infinite Scroll**: Newly loaded links (e.g., from lazy loading or infinite scrolling) are now automatically recognized and selectable without restarting the selection.
- **Performance Optimized**: Re-caching only scans for new link elements that weren't already in the cache.
- **Robust Cleanup**: Improved state management to ensure all intervals are correctly cleared when selection ends.

## Version 3.5.8 Changelog:
- **Update Notification System**: Added a new notification system to alert users when a new version is installed.
- **Extension Icon Badge**: Shows a green "!" badge on the extension logo across all tabs when an update occurs.
- **Interactive Version Badge**: The version label in the popup footer is now interactive and shows a pulsing notification dot when an update is pending.
- **Changelog Integration**: Clicking the version badge automatically clears the notification and opens the official changelog in a new tab.

## Version 3.5.7 Changelog:
- **Storage Migration & Validation**: Implemented automatic migration logic that validates and repairs saved actions on extension install/update.
- **Upgrade Compatibility Fix**: Prevents extension breakage when users upgrade from very old versions with incompatible storage schemas.
- **Data Preservation**: Actions with missing properties are automatically repaired with sensible defaults; only completely corrupted actions are removed.
- **Console Logging**: Added informative console messages when migration or repair occurs.

## Version 3.5.6 Changelog:
- **Simplified Pattern-Based Smart Select**: Completely rewrote the Smart Select algorithm. It now detects repeating link patterns and automatically filters to select only consistent link types.
- **Frequency-Based Filtering**: If a link pattern appears 2+ times, only those matching links are selected. If all links are unique, all are selected.
- **Important Pattern Priority**: When multiple patterns repeat, "important" patterns (headings, bold text) are prioritized over standard ones.
- **New Module: `js/smart-select.js`**: Extracted Smart Select logic into a standalone module for better maintainability.

## Version 3.5.5 Changelog:
- **Universal Adaptive Smart Select**: Upgraded Smart Select to "learn" from your first selection. If you start dragging on a specific type of link (e.g., a YouTube video title, a DeviantArt card, or a bold Reddit post), Grabbit will automatically filter subsequent selections to match that exact type, ignoring clutter like channel names or author links.
- **Deep Inspection Engine**: Enhanced the detection logic to support modern complex websites where links wrap headings or bold text (common in card/grid layouts), ensuring robust performance across virtually all sites.

## Version 3.5.4 Changelog:
- **Improved Link Detection (Google Search)**: Implemented smart filtering for Google Search results to only capture primary results.
- **Internal Link Filtering**: Automatically skips Google tracking URLs, search query links, and embedded ngrams when browsing Google Search.
- **Nested Link Prevention**: Added a global safeguard to skip anchor tags that are descendants of other anchor tags, preventing duplicate/junk selections on complex pages.

## Version 3.5.3 Changelog:
- **New Feature: Configurable "Mark as Visited"**: Users can now enable or disable the "Mark links as visited" behavior on a per-action basis via the Advanced Options in the Action Modal.

## Version 3.5.2 Changelog:
- **Removed `history` Permission**: Addressed user complaints about the "Read your browsing history" permission request by removing the `chrome.history` API usage.
- **Reduced Permission Footprint**: The extension no longer explicitly adds opened links to browser history; Chrome handles this natively when tabs are viewed.

## Version 3.5.1 Changelog:
- **UI Overhaul: Modern Toggle Switches**: Replaced all advanced option checkboxes and "On/Off" dropdowns in the Action Modal with beautiful, animated toggle switches.
- **Improved UX**: Enhanced the visual consistency of the configuration modal with sleek gradients and smoother interaction feedback.
- **Premium Aesthetics**: Integrated the same high-end toggle style from the Advanced Options page into the main Action Modal for a cohesive design experience.

## Version 3.5.0 Changelog:
- **New Feature: Disabled Domains (Blocklist)**: Users can now specify domains where Grabbit will be completely inactive.
- **Visual "OFF" State**: The extension icon now displays a dark gray "OFF" badge when browsing a blocked domain.
- **Smart Popup Overlay**: Implemented a dedicated "Disabled" state in the popup with an easy "Enable for this site" button.
- **Global Feature Blocking**: Ensures all core modules (Drag-Select, Linkify, Visited Tracking) respect the domain blocklist.

## Version 3.4.0 Changelog:
- **New Feature: A-Z Modifier Support**: Users can now use any letter key (A-Z) as a modifier for actions, in addition to Ctrl, Shift, and Alt.
- **Improved Action Flexibility**: Significantly expanded the range of possible custom keyboard + mouse shortcuts.
- **Smart Key Tracking**: Implemented a robust real-time tracking system for letter keys to ensure reliable multi-key activation.
- **Trackpad Compatibility Warning**: Added an intelligent warning notice in the options UI to alert users about potential palm rejection or hardware limitations on some laptop trackpads when using letter keys.
- **State Management Update**: Integrated a new `pressedKeys` state container for consistent handling of non-standard modifier combinations.

## Version 3.3.0 Changelog:
- **New Feature: Create Bookmarks**: Users can now select multiple links and save them directly to a bookmark folder.
- **Dynamic Folder Management**: Automatically creates bookmark folders named after the current page title and intelligently reuses existing folders with the same name.
- **Improved UI Feedback**: The selection counter label now dynamically updates to "be saved as bookmarks" when the bookmarking action is active.
- **Core Updates**: Added "bookmarks" permission support to core extension logic.

## Version 3.2.8 Changelog:
- **Major Copy Action Upgrade**: Enhanced "Copy URLs with Titles" action with **Markdown** and **JSON** support.
- **Custom Separators**: Added options for **Comma** and **Dot** separators in addition to Newline, Space, and Tab.
- **Format-Aware UI**: The Action Modal now intelligently hides irrelevant separator options when Markdown or JSON formats are selected.
- **Action Card Updates**: Saved action cards now clearly display the chosen format (Markdown/JSON) and separator type.

## Version 3.2.7 Changelog:
- **Modular Codebase**: Refactored `options.js` into 7 separate ES modules (`main`, `env`, `storage`, `utils`, `preview`, `card`, `modal`) for improved maintainability.
- **Modernized Options Page**: Updated `options.html` to use native ES module imports.

## Version 3.2.6 Changelog:
- **New Feature: Format Preview**: Added a live, syntax-highlighted preview to the "Copy URLs with Titles" action. Users can now see exactly how their output will look in real-time while adjusting format patterns, separators, and link spacing.
- **UI Enhancement**: Implemented a code-themed terminal preview box in the action configuration modal for immediate visual feedback.

## Version 3.2.5 Changelog:
- **New Feature: Global Exclusion Filters**: Users can now define keywords and Regular Expressions to automatically exclude specific links from being selected.
- **Improved Filter Management**: Added a dedicated UI in Advanced Options to add, view, and remove filter tags.
- **Performance Optimization**: Implemented pre-compiled regex objects for fast URL matching during drag-selection.
- **Robust Pattern Matching**: Includes fallback to case-insensitive substring matching for invalid regex entries.

## Version 3.2.4 Changelog:
- **Linkify: Code Block Support**: Enabled linkification within `<code>` and `<pre>` tags.
- **Aggressive Linkify Mode**: Added a new optional toggle to recognize prefix-less domains (e.g., `google.com`).
- **Enhanced Detection Engine**: Improved regex to support subdomains, deep paths, and complex query parameters for both standard and aggressive modes.
- **Dynamic Advanced UI**: Enhanced user experience by hiding Aggressive Linkify options when the main feature is disabled.
- **UI Organization**: Added a dedicated section heading for Linkify in Advanced Options for better future extensibility.
- **Expanded Testing**: Updated `test_links.html` with complex real-world URL scenarios and a dedicated section for "Potential False Positives".

## Version 3.2.3 Changelog:
- **New Feature: Linkify**: Automatically converts plain text URLs on web pages into clickable links.
- **Advanced Options Page**: Integrated experimental features into a dedicated "Advanced Options" settings page.
- **UI Refinement**: Cleaned up sidebar navigation by merging Global and Advanced options for a more intuitive settings experience.
- **Engine Optimization**: Added `js/linkify.js` with comprehensive URL regex matching and Shadow DOM support.

## Version 3.2.2 Changelog:
- **Major Popup UI Redesign**: Implemented a modern glassmorphism aesthetic with a dark premium theme.
- **Animated Components**: Added decorative floating background orbs and pulsing logo effects.
- **Enhanced Button Layout**: Replaced basic buttons with interactive cards featuring gradient icon boxes, titles, and subtitles.
- **Refined UX**: Improved visual hierarchy, smooth hover transitions, and dynamic success states for better interaction feedback.

## Version 2.0.9 Changelog:
- Centralized CSS architecture using a unified variable system (`variables.css`).
- Extracted inline styles from `popup.html` into a dedicated `popup.css` stylesheet.
- Standardized all design tokens (colors, fonts, gradients, shadows) for consistent branding.
- Improved codebase maintainability by removing hardcoded visual values.

## Version 2.0.8 Changelog:
- Redesigned the Action Modal UI with a modern, compact two-column layout and scrollable body.
- Implemented glassmorphism styling, premium gradients, and interactive collapsible sections.
- Improved iconography and fixed character encoding issues in the Options UI.
- Set "Smart Select" to off by default for new actions to improve initial user experience.
- Optimized CSS by removing redundant styles and fixing syntax errors.
- Synchronized saved action card left borders with their respective selection box colors.

## Version 2.0.7 Changelog:
- Implemented LinkClump-style Smart Select: dynamic filtering that switches to heading-only (H1-H6) mode when a heading link is touched.
- Split "Smart Select" into two independent features: "Smart Select (heading filter)" and "Avoid Duplicates".
- Updated Options UI with separate toggles for granular control over filtering and deduplication.

## Version 2.0.6 Changelog:
- Implemented Persistent Visited Link Marking.
- Added `js/visited.js` to track and visually mark links opened via Grabbit using `chrome.storage.local`.
- Bypassed browser limitations where redirect URLs (like Google Search) fail to show native `:visited` styling.
- Integrated `chrome.history` API to ensure opened links are correctly added to the browser's global history.

## Version 2.0.5 Changelog:
- Implemented robust Cross-Platform Key Recognition.
- Centralized OS detection in `js/utils.js` for Windows, macOS, and Linux.
- Improved ESC key handling: selection cancellation now works consistently and prevents default page behavior while Grabbit is active.
- Corrected key mapping for macOS (Command ⌘, Option ⌥, Shift ⇧) in Options UI and selection logic.

## Version 2.0.4 Changelog:
- Implemented Drag Threshold for selection activation.
- Selection box now waits for a 5-pixel drag before appearing, preventing accidental activation on simple clicks.
- Improved UX by removing visual flashes and zero-size selections on accidental triggers.

## Version 2.0.3 Changelog:
- Added Shadow DOM support for link detection.
- Links inside Shadow DOM components are now properly recognized and selectable.

## Version 2.0.2 Changelog:
- Modularized Settings into sections (Main, Popup, Advanced, Global).
- Created standalone Advanced Options page.
- Updated Sidebar component to include Advanced Options navigation.
- Implemented real-time section switching for all pages.
- Enforced absolute paths for extension resources.

## Version 2.0.1 Changelog:
- Refactor grabbit.js into smaller parts:
logic.js
ui.js
utils.js
state.js

## Version 2.0.0 Changelog:

- New Brand Logo
- New Brand Images in Chrome's Store
- New Sidebar UI
- New Options Page UI
- Added border thickness and style customization.

## Version 1.0.8 Changelog:
- Added "Copy all tab URLs" in popup.html
- Changed delay timer from 0 to 30 seconds with step 0.5
- Added advanced option 'Open tabs at the end of opened tabs' when 'Open links in new tabs' is selected
- Added custom options for "Copy Title & Urls" action

## Version 1.0.7 Changelog:
- Small fix for youtube subscriptions but still have work to do
- Fix reverse order bug
- Fixed too much debounce link delay
- Won't allow user to add duplicate actions with the same combination keys
- Added new action - Copy URL Titles

## Version 1.0.6 Changelog:
- fix memory leak for ESC by oaustegard
- debounce link selection by oaustegard

## Version 1.0.5 Changelog:
Added delay option when tabs are opened by TheTacoScott

## Version 1.0.4 Changelog:
- Open Links/tabs in reverse order option added
- Show correct combination keys for each OS (Option and Command for MacOs)

## Version 1.0.3 Changelog:

- Opens Tabs next to active tab
- Recognize <a> tags that are not visible

## Version 1.0.2 Changelog:

Added activeTab permission

## Version 1.0.1 Changelog:

Removed unused context menu permission