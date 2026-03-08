/**
 * Grabbit Advanced Options JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Advanced Options initialized');

    const linkifyToggle = document.getElementById('linkify-toggle');
    const linkifyAggressive = document.getElementById('linkify-aggressive');
    const aggressiveContainer = document.getElementById('linkify-aggressive-container');
    const status = document.getElementById('status');

    // URL Filters elements (backwards-compatible storage key: exclusionFilters)
    const urlFilterInput = document.getElementById('filter-input');
    const addUrlFilterBtn = document.getElementById('add-filter-btn');
    const urlFilterList = document.getElementById('filter-list');
    const clearUrlFiltersContainer = document.getElementById('clear-filters-container');
    const clearAllUrlFiltersBtn = document.getElementById('clear-all-filters-btn');

    // Link Text Filters elements (new storage key: linkTextExclusionFilters)
    const linkTextFilterInput = document.getElementById('link-text-filter-input');
    const addLinkTextFilterBtn = document.getElementById('add-link-text-filter-btn');
    const linkTextFilterList = document.getElementById('link-text-filter-list');
    const clearLinkTextFiltersContainer = document.getElementById('clear-link-text-filters-container');
    const clearAllLinkTextFiltersBtn = document.getElementById('clear-all-link-text-filters-btn');

    // Disabled Domains elements
    const disabledDomainInput = document.getElementById('disabled-domain-input');
    const addDisabledDomainBtn = document.getElementById('add-disabled-domain-btn');
    const disabledDomainsList = document.getElementById('disabled-domains-list');

    // Local state for filters
    let exclusionFilters = [];
    let linkTextExclusionFilters = [];
    let disabledDomains = [];

    // === Linkify Section ===
    if (linkifyToggle && linkifyAggressive) {
        // Load saved settings
        chrome.storage.sync.get(['linkifyEnabled', 'linkifyAggressive'], (result) => {
            linkifyToggle.checked = result.linkifyEnabled || false;
            linkifyAggressive.checked = result.linkifyAggressive || false;
            updateAggressiveUI();
        });

        // Save settings on change
        linkifyToggle.addEventListener('change', () => {
            chrome.storage.sync.set({ linkifyEnabled: linkifyToggle.checked }, () => {
                showStatus('Settings saved!');
                updateAggressiveUI();
            });
        });

        linkifyAggressive.addEventListener('change', () => {
            chrome.storage.sync.set({ linkifyAggressive: linkifyAggressive.checked }, () => {
                showStatus('Settings saved!');
            });
        });

        function updateAggressiveUI() {
            if (linkifyToggle.checked) {
                aggressiveContainer.style.display = 'flex';
            } else {
                aggressiveContainer.style.display = 'none';
            }
        }
    }

    // === Exclusion Filters Section ===
    // Load saved filters
    chrome.storage.sync.get(['exclusionFilters', 'linkTextExclusionFilters', 'disabledDomains'], (result) => {
        exclusionFilters = result.exclusionFilters || [];
        linkTextExclusionFilters = result.linkTextExclusionFilters || [];
        disabledDomains = result.disabledDomains || [];
        renderUrlFilterList();
        renderLinkTextFilterList();
        renderDisabledDomainsList();
    });

    // === URL Filters Section ===
    if (urlFilterInput && addUrlFilterBtn && urlFilterList) {
        addUrlFilterBtn.addEventListener('click', addUrlFilter);

        // Add filter on Enter key
        urlFilterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addUrlFilter();
            }
        });

        // Clear all URL filters
        if (clearAllUrlFiltersBtn) {
            clearAllUrlFiltersBtn.addEventListener('click', () => {
                exclusionFilters = [];
                saveUrlFilters();
                renderUrlFilterList();
                showStatus('All filters cleared!');
            });
        }
    }

    // === Link Text Filters Section ===
    if (linkTextFilterInput && addLinkTextFilterBtn && linkTextFilterList) {
        addLinkTextFilterBtn.addEventListener('click', addLinkTextFilter);

        linkTextFilterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addLinkTextFilter();
            }
        });

        if (clearAllLinkTextFiltersBtn) {
            clearAllLinkTextFiltersBtn.addEventListener('click', () => {
                linkTextExclusionFilters = [];
                saveLinkTextFilters();
                renderLinkTextFilterList();
                showStatus('All link text filters cleared!');
            });
        }
    }

    // === Disabled Domains Section ===
    if (disabledDomainInput && addDisabledDomainBtn && disabledDomainsList) {
        addDisabledDomainBtn.addEventListener('click', addDisabledDomain);
        disabledDomainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addDisabledDomain();
            }
        });
    }

    /**
     * Adds a new disabled domain
     */
    function addDisabledDomain() {
        const value = disabledDomainInput.value.trim();
        if (!value) {
            showStatus('Please enter a domain', true);
            return;
        }

        if (disabledDomains.includes(value)) {
            showStatus('Domain already in blocklist', true);
            return;
        }

        disabledDomains.push(value);
        saveDisabledDomains();
        renderDisabledDomainsList();
        disabledDomainInput.value = '';
        showStatus('Domain added to blocklist!');
    }

    /**
     * Removes a disabled domain at the specified index
     * @param {number} index
     */
    function removeDisabledDomain(index) {
        disabledDomains.splice(index, 1);
        saveDisabledDomains();
        renderDisabledDomainsList();
        showStatus('Domain removed from blocklist!');
    }

    /**
     * Saves disabled domains to storage
     */
    function saveDisabledDomains() {
        chrome.storage.sync.set({ disabledDomains: disabledDomains });
    }

    /**
     * Renders the disabled domains list
     */
    function renderDisabledDomainsList() {
        if (!disabledDomainsList) return;

        disabledDomainsList.innerHTML = '';

        disabledDomains.forEach((domain, index) => {
            const li = document.createElement('li');
            li.className = 'filter-tag'; // Reuse filter-tag style

            const span = document.createElement('span');
            span.textContent = domain;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Remove domain';
            deleteBtn.addEventListener('click', () => removeDisabledDomain(index));

            li.appendChild(span);
            li.appendChild(deleteBtn);
            disabledDomainsList.appendChild(li);
        });
    }

    /**
     * Adds a new URL filter from the input field
     */
    function addUrlFilter() {
        const value = urlFilterInput.value.trim();
        if (!value) {
            showStatus('Please enter a URL filter pattern', true);
            return;
        }

        // Check for duplicates
        if (exclusionFilters.includes(value)) {
            showStatus('Filter already exists', true);
            return;
        }

        exclusionFilters.push(value);
        saveUrlFilters();
        renderUrlFilterList();
        urlFilterInput.value = '';
        showStatus('Filter added!');
    }

    /**
     * Removes a URL filter at the specified index
     * @param {number} index - Index of filter to remove
     */
    function removeUrlFilter(index) {
        exclusionFilters.splice(index, 1);
        saveUrlFilters();
        renderUrlFilterList();
        showStatus('Filter removed!');
    }

    /**
     * Saves the current URL filters to chrome.storage.sync
     */
    function saveUrlFilters() {
        chrome.storage.sync.set({ exclusionFilters: exclusionFilters });
    }

    /**
     * Renders the URL filter list UI
     */
    function renderUrlFilterList() {
        if (!urlFilterList) return;

        urlFilterList.innerHTML = '';

        exclusionFilters.forEach((filter, index) => {
            const li = document.createElement('li');
            li.className = 'filter-tag';

            const span = document.createElement('span');
            span.textContent = filter;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Remove filter';
            deleteBtn.addEventListener('click', () => removeUrlFilter(index));

            li.appendChild(span);
            li.appendChild(deleteBtn);
            urlFilterList.appendChild(li);
        });

        if (clearUrlFiltersContainer) {
            clearUrlFiltersContainer.style.display = exclusionFilters.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Adds a new link text filter from the input field
     */
    function addLinkTextFilter() {
        const value = linkTextFilterInput.value.trim();
        if (!value) {
            showStatus('Please enter a text filter pattern', true);
            return;
        }

        if (linkTextExclusionFilters.includes(value)) {
            showStatus('Text filter already exists', true);
            return;
        }

        linkTextExclusionFilters.push(value);
        saveLinkTextFilters();
        renderLinkTextFilterList();
        linkTextFilterInput.value = '';
        showStatus('Text filter added!');
    }

    /**
     * Removes a link text filter at the specified index
     * @param {number} index - Index of filter to remove
     */
    function removeLinkTextFilter(index) {
        linkTextExclusionFilters.splice(index, 1);
        saveLinkTextFilters();
        renderLinkTextFilterList();
        showStatus('Text filter removed!');
    }

    /**
     * Saves the current link text filters to chrome.storage.sync
     */
    function saveLinkTextFilters() {
        chrome.storage.sync.set({ linkTextExclusionFilters: linkTextExclusionFilters });
    }

    /**
     * Renders the link text filter list UI
     */
    function renderLinkTextFilterList() {
        if (!linkTextFilterList) return;

        linkTextFilterList.innerHTML = '';

        linkTextExclusionFilters.forEach((filter, index) => {
            const li = document.createElement('li');
            li.className = 'filter-tag';

            const span = document.createElement('span');
            span.textContent = filter;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Remove text filter';
            deleteBtn.addEventListener('click', () => removeLinkTextFilter(index));

            li.appendChild(span);
            li.appendChild(deleteBtn);
            linkTextFilterList.appendChild(li);
        });

        // Show/hide clear all button
        if (clearLinkTextFiltersContainer) {
            clearLinkTextFiltersContainer.style.display = linkTextExclusionFilters.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Shows a status message
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether this is an error message
     */
    function showStatus(message, isError = false) {
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? '#d32f2f' : 'green';
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    }
});
