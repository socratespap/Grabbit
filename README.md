# Grabbit Chrome Extension

Grabbit is a powerful Chrome extension that allows users to select multiple links on a webpage using a drag-select interface and perform various actions like opening them in new tabs, new windows, or copying URLs to clipboard.

## Features

- Drag-select multiple links using customizable mouse and keyboard combinations
- Smart selection to automatically remove duplicate URLs
- Customizable selection box colors
- Multiple action types:
  - Open links in new tabs
  - Open links in new windows
  - Copy URLs to clipboard
- Real-time link counter
- Smooth auto-scrolling while selecting
- Configurable settings through an options page

## File Structure

### manifest.json V3
The extension manifest file that defines permissions, content scripts, and basic extension information. It specifies the extension's structure and required permissions like storage, clipboard access, and tab management.

### background.js
A service worker that handles background tasks, specifically managing the creation of new tabs when links are opened.

### grabbit.js
The core content script that implements the drag-select functionality:
- Handles mouse events and selection box creation
- Manages link highlighting and selection
- Implements auto-scrolling
- Processes selected links based on user actions

### popup.js & popup.html
The extension's popup interface that appears when clicking the extension icon:
- Allows quick copying of URLs from selected tabs
- Provides functionality to open copied links
- Features a clean, modern UI with visual feedback

### options.js & options.html
The settings page that allows users to:
- Create and manage custom actions
- Configure key combinations
- Customize selection box colors
- Enable/disable smart selection
- Set action types for different combinations

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

Or directly from the chome extension store:
[https://chrome.google.com/webstore/detail/Grabbit/](https://chromewebstore.google.com/detail/grabbit/madmdgpjgagdmmmiddpiggdnpgjglcdk)

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

## Technical Details

The extension uses:
- Chrome Storage Sync API for settings persistence
- Modern JavaScript features for DOM manipulation
- Chrome Extensions Manifest V3
- Custom event handling for mouse and keyboard interactions

## Tested on

- Windows 10
- Windows 11
- Chrome Version (Version 131.0.6778.205 (Official Build) (64-bit))
- Chrome Latest Version Version 133.0.6943.142 (Official Build) (64-bit)


## Known Issues

- 🔴 ESC will cancel selection but have a conflict with windows shortcuts if pressed with ctrl || shift || alt
- 🔴 Unknown compatibility with other browsers or operating systems.
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Right mouse for open links - Copy links with CTRL + Right Mouse, release the CTRL, it does not change to open links while the opposite works.
- 🟢 Add two actions. Action 1: Ctrl + Right Mouse for copy link. Action 2: Ctrl + Left mouse for open links. Only action with right mouse works
- 🔴 Lifting keyboard key and no action is found for mouse only actions, is still selecting
- 🟢 Removed unused context menu permission
- 🔴 Not compatible with Netsuite
- 🔴 Fix naming of buttons in Mac

## Features to be added

- 🟢 Open Links/tabs in reverse order
- 🟢 Copy links with titles
- 🟢  Provide different color on add new action
- 🔴 Append Urls to clipboard. Clipboard = selected links + clipboard
- 🟢 Add rating button
- 🟢 Open tabs next to active tab
- 🟢 Recognize <a> tags that are not visible
- 🔴 Include Compatibility with Youtube Subscriptions links
- 🟢 Add delay when opening tabs
- 🔴 Include option when copying URLs ("Title <tab> Url, instead of Title \n Url")
- 🔴 Create Bookmarks
- 🔴 Fix compatibility with Netsuite

## Version 1.0.1 Changelog:

Removed unused context menu permission

## Version 1.0.2 Changelog:

Added activeTab permission

## Version 1.0.3 Changelog:

Opens Tabs next to active tab
Recognize <a> tags that are not visible

## Version 1.0.4 Changelog:
-Open Links/tabs in reverse order option added
-Show correct combination keys for each OS (Option and Command for MacOs)

## Version 1.0.5 Changelog:
Added delay option when tabs are opened by TheTacoScott

## Version 1.0.6 Changelog:
-fix memory leak for ESC by oaustegard
-debounce link selection by oaustegard

## Version 1.0.7 Changelog:
-Small fix for youtube subscriptions but still have work to do
-Fix reverse order bug
-Fixed too much debounce link delay
-Won't allow user to add duplicate actions with the same combination keys

## Contributions
- TheTacoScott - https://github.com/TheTacoScott
- oaustegard - https://github.com/oaustegard

-This is a Linkclump replacement/alternative
-This is a Copy All Urls replacement/alternative

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
