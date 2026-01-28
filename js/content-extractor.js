/**
 * Product Content Extractor
 * Intelligently extracts product information from various e-commerce sites
 * Used within the context of the page during scripting.executeScript
 */

export function extractProductData() {
    const data = {
        title: '',
        price: '',
        description: '',
        specs: [],
        url: window.location.href,
        siteName: window.location.hostname
    };

    // 1. Extract Title
    data.title = document.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('[data-testid="product-title"]')?.textContent?.trim() ||
        document.querySelector('.product-title')?.textContent?.trim() ||
        document.querySelector('meta[property="og:title"]')?.content ||
        document.title;

    // 2. Extract Price
    const priceSelectors = [
        '[data-price]',
        '.price',
        '.product-price',
        '[class*="price-item"]',
        '[class*="Price"]',
        '[id*="price"]',
        '.a-price-whole', // Amazon
        '.pdp-price',
        '[data-testid="price"]'
    ];
    for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent && el.textContent.trim().length > 0) {
            data.price = el.textContent.trim();
            break;
        }
    }

    // 3. Extract Description
    const descSelectors = [
        '[data-testid="product-description"]',
        '.product-description',
        '#product-description',
        '[class*="description"]',
        'meta[name="description"]',
        '#feature-bullets' // Amazon
    ];
    for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el) {
            const content = el.content || el.textContent?.trim();
            if (content && content.length > 20) {
                data.description = content;
                break;
            }
        }
    }

    // 4. Extract Specifications / Features
    const specContainers = document.querySelectorAll('table, dl, ul.specs, .specifications, .technical-details, #productDetails_techSpec_section_1');
    specContainers.forEach(container => {
        const text = container.innerText.trim();
        if (text.length > 50 && data.specs.length < 5) { // Limit to 5 meaningful blocks
            data.specs.push(text.substring(0, 1000));
        }
    });

    // 5. Fallback: Get significant text content if description is thin
    if (!data.description || data.description.length < 100) {
        const mainContent = document.querySelector('main, #content, .main-content, article');
        if (mainContent) {
            data.description = mainContent.innerText.substring(0, 2000).trim();
        }
    }

    return {
        title: data.title,
        price: data.price,
        description: data.description,
        specs: data.specs,
        url: data.url,
        siteName: data.siteName,
        rawContent: `
Title: ${data.title}
Price: ${data.price}
URL: ${data.url}
Site: ${data.siteName}

Description:
${data.description}

Specifications:
${data.specs.join('\n\n')}
        `.trim()
    };
}
