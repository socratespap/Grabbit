/**
 * Format Preview module for Grabbit Options
 * Handles the live preview for "Copy URLs & Titles" formatting
 */

/**
 * Updates the format preview to show how URLs with titles will look
 * based on the current format options settings
 */
export function updateFormatPreview() {
    const formatPreview = document.getElementById('formatPreview');
    if (!formatPreview) return;

    // Get current format settings
    const formatPattern = document.getElementById('formatPattern')?.value || 'titleFirst';
    const separatorType = document.getElementById('separatorType')?.value || 'newline';
    const separatorCount = parseInt(document.getElementById('separatorCount')?.value || '1', 10);
    const linkSeparatorCount = parseInt(document.getElementById('linkSeparatorCount')?.value || '0', 10);

    // Sample data for preview
    const sampleLinks = [
        { title: 'Google Homepage', url: 'https://google.com' },
        { title: 'GitHub', url: 'https://github.com' }
    ];

    // Determine the separator string
    let separator = '';
    switch (separatorType) {
        case 'newline':
            separator = '\n'.repeat(separatorCount);
            break;
        case 'space':
            separator = ' '.repeat(separatorCount);
            break;
        case 'tab':
            separator = '\t'.repeat(separatorCount);
            break;
    }

    // Build the preview output
    const formattedLinks = sampleLinks.map(link => {
        if (formatPattern === 'titleFirst') {
            return `<span class="preview-title">${link.title}</span>${separator}<span class="preview-url">${link.url}</span>`;
        } else {
            return `<span class="preview-url">${link.url}</span>${separator}<span class="preview-title">${link.title}</span>`;
        }
    });

    // Join links with the link separator (extra blank lines between links)
    const linkSeparator = '\n'.repeat(linkSeparatorCount + 1);
    const output = formattedLinks.join(linkSeparator);

    // Display in preview with proper formatting
    // Convert tabs and newlines to visible representation for display
    formatPreview.innerHTML = output
        .replace(/\t/g, '<span class="preview-separator">→</span>')
        .replace(/\n/g, '<br>');
}

/**
 * Sets up event listeners for format options to update preview in real-time
 */
export function setupPreviewListeners() {
    document.getElementById('formatPattern')?.addEventListener('change', updateFormatPreview);
    document.getElementById('separatorType')?.addEventListener('change', updateFormatPreview);
    document.getElementById('separatorCount')?.addEventListener('input', updateFormatPreview);
    document.getElementById('linkSeparatorCount')?.addEventListener('input', updateFormatPreview);
}
