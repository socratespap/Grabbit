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