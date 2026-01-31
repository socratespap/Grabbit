/**
 * Footer Component for Grabbit
 * Handles the footer template and its interactions
 */

const SVGS = {
    PAYPAL: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="#27346a" d="M18.998825 2.02199C17.91065 0.7817275 15.94365 0.25 13.427375 0.25H6.12425c-0.514825 0 -0.9523 0.37442 -1.0329 0.882095L2.0504975 20.417925c-0.060455 0.380275 0.23401 0.7248 0.6194775 0.7248h4.508625l1.132375 -7.182225 -0.0351 0.224925c0.0806 -0.5077 0.514825 -0.8821 1.029 -0.8821h2.1425c4.208975 0 7.50465 -1.7096 8.467325 -6.65505 0.028625 -0.14625 0.053325 -0.2886 0.074775 -0.427725 -0.121575 -0.06435 -0.121575 -0.06435 0 0 0.28665 -1.8279 -0.00195 -3.07205 -0.99065 -4.19856Z" stroke-width="0.25"></path><path fill="#27346a" d="M10.03615 5.562075c0.12025 -0.0572 0.254175 -0.08905 0.394575 -0.08905h5.7255c0.677975 0 1.31045 0.0442 1.88835 0.13715 0.16575 0.02665 0.3263 0.0572 0.482325 0.0923 0.156 0.03445 0.30745 0.07345 0.454375 0.11635 0.07345 0.02145 0.1456 0.043575 0.21645 0.066975 0.284075 0.0949 0.548625 0.2054 0.79175 0.33475 0.28665 -1.82855 -0.00195 -3.07205 -0.99065 -4.19856C17.91 0.7817275 15.94365 0.25 13.427375 0.25H6.1236c-0.514175 0 -0.95165 0.37442 -1.03225 0.882095L2.0504975 20.417275c-0.0604525 0.380925 0.2340125 0.7248 0.6188275 0.7248h4.509275l2.349225 -14.897475c0.0481 -0.3055 0.244425 -0.555775 0.508325 -0.682525Z" stroke-width="0.25"></path><path fill="#2790c3" d="M19.914675 6.6483c-0.9627 4.9448 -4.258375 6.65505 -8.467325 6.65505h-2.143175c-0.514175 0 -0.9484 0.374425 -1.02835 0.8821l-1.408625 8.93015c-0.05265 0.3328 0.204775 0.634425 0.541475 0.634425h3.80075c0.449825 0 0.8327 -0.327625 0.9029 -0.771575l0.03705 -0.193725 0.71635 -4.539825 0.04615 -0.250925c0.0702 -0.443975 0.453075 -0.771575 0.902875 -0.771575h0.5688c3.681775 0 6.564675 -1.495725 7.407125 -5.8217 0.35165 -1.80775 0.16965 -3.317125 -0.76055 -4.377325 -0.2821 -0.321125 -0.632475 -0.586325 -1.0407 -0.8028 -0.0221 0.139775 -0.04615 0.281475 -0.07475 0.427725Z" stroke-width="0.25"></path><path fill="#1f264f" d="M18.982 5.81885c-0.1469 -0.0429 -0.29835 -0.081925 -0.454375 -0.116375 -0.156 -0.03445 -0.3172 -0.065 -0.482325 -0.09165 -0.578525 -0.0936 -1.21035 -0.1378 -1.888975 -0.1378H10.431475c-0.14105 0 -0.274975 0.03185 -0.394575 0.0897 -0.26455 0.12675 -0.460225 0.376375 -0.508325 0.682525l-1.21685 7.71525 -0.035125 0.224925c0.079975 -0.507675 0.5142 -0.8821 1.028375 -0.8821h2.14315c4.208975 0 7.504625 -1.7096 8.467325 -6.65505 0.0286 -0.14625 0.05265 -0.28795 0.07475 -0.427725 -0.24375 -0.1287 -0.507675 -0.23985 -0.791725 -0.3341 -0.07085 -0.0234 -0.143 -0.04615 -0.216475 -0.0676Z" stroke-width="0.25"></path></svg>',
    REVOLUT: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.9133 6.9566C20.9133 3.1208 17.7898 0 13.9503 0H2.424v3.8605h10.9782c1.7376 0 3.177 1.3651 3.2087 3.043 0.016 0.84 -0.2994 1.633 -0.8878 2.2324 -0.5886 0.5998 -1.375 0.9303 -2.2144 0.9303H9.2322a0.2756 0.2756 0 0 0 -0.2755 0.2752v3.431c0 0.0585 0.018 0.1142 0.052 0.1612L16.2646 24h5.3114l-7.2727 -10.094c3.6625 -0.1838 6.61 -3.2612 6.61 -6.9494zM6.8943 5.9229H2.424V24h4.4704z" fill="currentColor" stroke-width="1"></path></svg>',
    GITHUB: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="github-icon"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>'
};

class GrabbitFooter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);

        this.contributors = [
            { name: '@TheTacoScott', url: 'https://github.com/TheTacoScott' },
            { name: '@oaustegard', url: 'https://github.com/oaustegard' },
            { name: '@digirat', url: 'https://github.com/digirat' },
            { name: 'Subtiltee', url: 'https://subtiltee.com/all-extensions' }
        ];

        this.supportLinks = [
            {
                name: '',
                url: 'https://paypal.me/tinycobra',
                icon: SVGS.PAYPAL,
                className: 'paypal-button'
            },
            {
                name: '',
                url: 'https://revolut.me/socratespap',
                icon: SVGS.REVOLUT,
                className: 'revolut-button'
            }
        ];

        if (this.container) {
            this.render();
            this.initLogic();
        }
    }

    renderSupportButtons() {
        return this.supportLinks.map(link => `
            <a href="${link.url}" target="_blank" class="footer-btn ${link.className}">
                ${link.icon}
                ${link.name ? `<span>${link.name}</span>` : ''}
            </a>
        `).join('');
    }

    renderContributors() {
        return this.contributors.map(contributor => `
            <a href="${contributor.url}" target="_blank" class="contributor-tag">
                ${SVGS.GITHUB}
                <span>${contributor.name}</span>
            </a>
        `).join('');
    }

    render() {
        this.container.innerHTML = `
            <footer class="footer">
                <div class="footer-content">
                    <!-- Brand Column -->
                    <div class="footer-col brand-col">
                        <div class="footer-brand">
                            <img src="/icons/icon48.png" alt="Grabbit" class="footer-logo">
                            <span class="brand-name">Grabbit</span>
                        </div>
                        <p class="brand-desc">
                            The ultimate drag-select productivity tool for Chrome. 
                            Built by <a href="https://socratisp.com" target="_blank" class="text-link">Socrates</a>.
                        </p>
                        <div class="footer-meta">
                            <span>© ${new Date().getFullYear()} Grabbit</span>
                        </div>
                    </div>

                    <!-- Community Column -->
                    <div class="footer-col community-col">
                        <h4 class="footer-heading">Community</h4>
                        <div class="contributors-wrapper">
                            ${this.renderContributors()}
                        </div>
                        <a href="https://github.com/socratespap/Grabbit" target="_blank" class="github-cta">
                            ${SVGS.GITHUB}
                            <span>Contribute on GitHub</span>
                        </a>
                    </div>

                    <!-- Support Column -->
                    <div class="footer-col support-col">
                        <h4 class="footer-heading">Support Development</h4>
                        <p class="support-text">Your support keeps this project alive and ad-free.</p>
                        <div class="support-actions">
                            ${this.renderSupportButtons()}
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    initLogic() {
        // Rate button functionality (if rate button exists)
        const rateButton = document.getElementById('rateExtensionButton');
        if (rateButton) {
            rateButton.addEventListener('click', () => {
                chrome.webstore.postRating();
            });
        }

        // Pin button functionality (if pin button exists)
        const pinButton = document.getElementById('pinExtensionButton');
        if (pinButton) {
            pinButton.addEventListener('click', () => {
                // Open a guide on how to pin extensions
                window.open('https://support.google.com/chrome_webstore/answer/3060053', '_blank');
            });
        }
    }
}

// Auto-initialize if the script is loaded and a placeholder exists
document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        new GrabbitFooter('footer-placeholder');
    }
});
