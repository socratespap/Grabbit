/**
 * Sidebar Component for Grabbit
 * Handles both the template and the navigation logic
 */

class GrabbitSidebar {
    constructor(containerId, activeSection = 'main-options') {
        this.container = document.getElementById(containerId);
        this.activeSection = activeSection;
        if (this.container) {
            this.render();
            this.initLogic();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <img src="/icons/icon48.png" alt="Grabbit Logo" class="sidebar-logo">
                    <h2>Grabbit</h2>
                </div>
                <nav class="sidebar-nav">
                    <a href="/options.html#main-options" class="sidebar-link ${this.activeSection === 'main-options' ? 'active' : ''}" data-section="main-options">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />
                        </svg>
                        Main Options
                    </a>
                    <a href="/popup/popupOptions/popupOptions.html" class="sidebar-link ${this.activeSection === 'popup-options' ? 'active' : ''}" data-section="popup-options">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14z" fill="currentColor" />
                            <path d="M7 10h10v2H7z" fill="currentColor" />
                            <path d="M7 14h7v2H7z" fill="currentColor" />
                        </svg>
                        Popup Options
                    </a>
                    <a href="/advancedOptions/advancedOptions.html" class="sidebar-link ${this.activeSection === 'advanced-options' ? 'active' : ''}" data-section="advanced-options">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor" />
                        </svg>
                        Advanced Options
                    </a>
                    <a href="/options.html#global-options" class="sidebar-link ${this.activeSection === 'global-options' ? 'active' : ''}" data-section="global-options">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor" />
                        </svg>
                        Global Options
                    </a>
                </nav>
            </div>
        `;
    }

    initLogic() {
        const sidebarLinks = this.container.querySelectorAll('.sidebar-link');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetSectionId = link.getAttribute('data-section');
                const targetSection = document.getElementById(targetSectionId);

                // If the target section exists on the current page, we handle internal switching
                if (targetSection) {
                    e.preventDefault();

                    // Remove active class from all links
                    sidebarLinks.forEach(l => l.classList.remove('active'));

                    // Add active class to clicked link
                    link.classList.add('active');

                    // Show target section and hide others (if we have other sections on the same page)
                    const sections = ['main-options', 'popup-options', 'global-options', 'advanced-options'];
                    sections.forEach(sectionId => {
                        const section = document.getElementById(sectionId);
                        if (section) {
                            section.style.display = sectionId === targetSectionId ? 'block' : 'none';
                        }
                    });

                    // Update hash without jumping if it's the options page
                    if (window.location.pathname.endsWith('options.html')) {
                        history.pushState(null, null, `#${targetSectionId}`);
                    }
                }
                // Otherwise, the default link behavior (navigation to options.html) will happen
            });
        });
    }
}

// Auto-initialize if the script is loaded and a placeholder exists
document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (placeholder) {
        // Determine active section from hash or data attribute
        const currentHash = window.location.hash.substring(1) || 'main-options';
        const defaultSection = placeholder.getAttribute('data-active-section') || currentHash;
        new GrabbitSidebar('sidebar-placeholder', defaultSection);
    }
});
