/**
 * Grabbit Advanced Options JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Advanced Options initialized');

    const linkifyToggle = document.getElementById('linkify-toggle');
    const linkifyAggressive = document.getElementById('linkify-aggressive');
    const aggressiveContainer = document.getElementById('linkify-aggressive-container');
    const status = document.getElementById('status');

    // Exclusion Filters elements
    const filterInput = document.getElementById('filter-input');
    const addFilterBtn = document.getElementById('add-filter-btn');
    const filterList = document.getElementById('filter-list');
    const clearFiltersContainer = document.getElementById('clear-filters-container');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');

    // Disabled Domains elements
    const disabledDomainInput = document.getElementById('disabled-domain-input');
    const addDisabledDomainBtn = document.getElementById('add-disabled-domain-btn');
    const disabledDomainsList = document.getElementById('disabled-domains-list');

    // Local state for filters
    let exclusionFilters = [];
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
    if (filterInput && addFilterBtn && filterList) {
        // Load saved filters
        chrome.storage.sync.get(['exclusionFilters', 'disabledDomains'], (result) => {
            exclusionFilters = result.exclusionFilters || [];
            disabledDomains = result.disabledDomains || [];
            renderFilterList();
            renderDisabledDomainsList();
        });

        // Add filter on button click
        addFilterBtn.addEventListener('click', addFilter);

        // Add filter on Enter key
        filterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addFilter();
            }
        });

        // Clear all filters
        if (clearAllFiltersBtn) {
            clearAllFiltersBtn.addEventListener('click', () => {
                exclusionFilters = [];
                saveFilters();
                renderFilterList();
                showStatus('All filters cleared!');
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
     * Adds a new filter from the input field
     */
    function addFilter() {
        const value = filterInput.value.trim();
        if (!value) {
            showStatus('Please enter a filter pattern', true);
            return;
        }

        // Check for duplicates
        if (exclusionFilters.includes(value)) {
            showStatus('Filter already exists', true);
            return;
        }

        exclusionFilters.push(value);
        saveFilters();
        renderFilterList();
        filterInput.value = '';
        showStatus('Filter added!');
    }

    /**
     * Removes a filter at the specified index
     * @param {number} index - Index of filter to remove
     */
    function removeFilter(index) {
        exclusionFilters.splice(index, 1);
        saveFilters();
        renderFilterList();
        showStatus('Filter removed!');
    }

    /**
     * Saves the current filters to chrome.storage.sync
     */
    function saveFilters() {
        chrome.storage.sync.set({ exclusionFilters: exclusionFilters });
    }

    /**
     * Renders the filter list UI
     */
    function renderFilterList() {
        filterList.innerHTML = '';

        exclusionFilters.forEach((filter, index) => {
            const li = document.createElement('li');
            li.className = 'filter-tag';

            const span = document.createElement('span');
            span.textContent = filter;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Remove filter';
            deleteBtn.addEventListener('click', () => removeFilter(index));

            li.appendChild(span);
            li.appendChild(deleteBtn);
            filterList.appendChild(li);
        });

        // Show/hide clear all button
        if (clearFiltersContainer) {
            clearFiltersContainer.style.display = exclusionFilters.length > 0 ? 'block' : 'none';
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
