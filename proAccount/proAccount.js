/**
 * Pro Account Page JavaScript
 * Handles ExtPay integration for login, subscription, and account management
 */

// DOM Elements (initialized in init)
let loadingState, statusDisplay, errorState, subscriptionBadge;
let emailRow, userEmail, subscribedSinceRow, subscribedSince, nextBillingRow, nextBilling;
let creditsSection, creditsReset, creditsTotal;
let freeActions, proActions;
let loginBtn, subscribeBtn, logoutBtn, retryBtn, cancelSubscriptionLink;

/**
 * Initialize DOM elements
 */
function initElements() {
    loadingState = document.getElementById('loading-state');
    statusDisplay = document.getElementById('status-display');
    errorState = document.getElementById('error-state');
    subscriptionBadge = document.getElementById('subscription-badge');
    emailRow = document.getElementById('email-row');
    userEmail = document.getElementById('user-email');
    subscribedSinceRow = document.getElementById('subscribed-since-row');
    subscribedSince = document.getElementById('subscribed-since');
    nextBillingRow = document.getElementById('next-billing-row');
    nextBilling = document.getElementById('next-billing');
    creditsSection = document.getElementById('credits-section');
    creditsReset = document.getElementById('credits-reset');
    creditsTotal = document.getElementById('credits-total');
    freeActions = document.getElementById('free-actions');
    proActions = document.getElementById('pro-actions');
    loginBtn = document.getElementById('login-btn');
    subscribeBtn = document.getElementById('subscribe-btn');
    logoutBtn = document.getElementById('logout-btn');
    retryBtn = document.getElementById('retry-btn');
    cancelSubscriptionLink = document.getElementById('cancel-subscription-link');

    // Add event listeners here to ensure buttons exist
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (subscribeBtn) subscribeBtn.addEventListener('click', handleSubscribe);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (retryBtn) retryBtn.addEventListener('click', fetchUserStatus);
    if (cancelSubscriptionLink) cancelSubscriptionLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'CANCEL_SUBSCRIPTION' });
    });
}

/**
 * Show a specific state (loading, status, or error)
 */
function showState(state) {
    loadingState.style.display = 'none';
    statusDisplay.style.display = 'none';
    errorState.style.display = 'none';

    switch (state) {
        case 'loading':
            loadingState.style.display = 'flex';
            break;
        case 'status':
            statusDisplay.style.display = 'block';
            break;
        case 'error':
            errorState.style.display = 'block';
            break;
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calculate days until end of month (for credits reset)
 */
function getDaysUntilReset() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = lastDay.getDate() - now.getDate();
    return daysLeft;
}

/**
 * Calculate next billing date (one month from paidAt)
 */
function getNextBillingDate(paidAt) {
    if (!paidAt) return null;
    const paidDate = new Date(paidAt);
    const now = new Date();

    // Calculate next billing date based on subscription anniversary
    let nextBilling = new Date(paidDate);
    while (nextBilling <= now) {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    return nextBilling;
}

/**
 * Update credit value styling based on amount
 */
function updateCreditStyle(element, value) {
    element.textContent = value;
    element.classList.remove('low', 'empty');
    if (value === 0) {
        element.classList.add('empty');
    } else if (value <= 5) {
        element.classList.add('low');
    }
}

/**
 * Update the UI with user status
 */
function updateUI(user, credits = null) {
    showState('status');

    // Update badge
    if (user.paid) {
        subscriptionBadge.textContent = 'PRO ✓';
        subscriptionBadge.className = 'status-badge badge-pro';
        freeActions.style.display = 'none';
        proActions.style.display = 'block';
    } else if (user.trialActive) {
        subscriptionBadge.textContent = 'TRIAL';
        subscriptionBadge.className = 'status-badge badge-trial';
        freeActions.style.display = 'block';
        proActions.style.display = 'none';
    } else {
        subscriptionBadge.textContent = 'FREE';
        subscriptionBadge.className = 'status-badge badge-free';
        freeActions.style.display = 'block';
        proActions.style.display = 'none';
    }

    // Update email
    if (user.email) {
        emailRow.style.display = 'flex';
        userEmail.textContent = user.email;
    } else {
        emailRow.style.display = 'none';
    }

    // Update subscribed since and billing
    if (user.paid) {
        subscribedSinceRow.style.display = 'flex';
        subscribedSince.textContent = user.paidAt ? formatDate(user.paidAt) : '-';

        // Calculate and show next billing date
        const nextBillingDate = getNextBillingDate(user.paidAt);
        nextBillingRow.style.display = 'flex';
        nextBilling.textContent = nextBillingDate ? formatDate(nextBillingDate) : '-';
    } else {
        subscribedSinceRow.style.display = 'none';
        nextBillingRow.style.display = 'none';
    }

    // Update credits section
    // Update credits section
    if (user.paid) {
        creditsSection.style.display = 'block';

        // Update credits reset countdown
        const daysLeft = getDaysUntilReset();
        creditsReset.textContent = `Resets in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
        console.log('[ProAccount] Displaying credits section, credits object:', credits);

        if (credits && credits._remaining !== undefined) {
            updateCreditStyle(creditsTotal, credits._remaining);
        } else {
            // No cached credits yet - user needs to use an AI feature first
            creditsTotal.textContent = '—';
            creditsTotal.classList.remove('low', 'empty');
            // Update description to explain
            const desc = document.querySelector('.credits-description');
            if (desc) {
                desc.textContent = 'Use an AI feature to see your remaining credits';
            }
        }
    } else {
        creditsSection.style.display = 'none';
    }
}

/**
 * Fetch user status from background script
 */
async function fetchUserStatus() {
    showState('loading');

    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_PRO_STATUS' });
        console.log('[ProAccount] Received response:', response);
        console.log('[ProAccount] User:', response.user);
        console.log('[ProAccount] Credits:', response.credits);

        if (response.error) {
            throw new Error(response.error);
        }

        updateUI(response.user, response.credits);
    } catch (error) {
        console.error('Error fetching user status:', error);
        document.getElementById('error-message').textContent =
            error.message || 'Unable to load account information. Please try again.';
        showState('error');
    }
}

/**
 * Handle login button click
 */
async function handleLogin() {
    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Opening...';

        await chrome.runtime.sendMessage({ action: 'OPEN_LOGIN_PAGE' });

        // Re-enable after a delay
        setTimeout(() => {
            loginBtn.disabled = false;
            loginBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" fill="currentColor" />
                </svg>
                Log In
            `;
            // Refresh status after login attempt
            fetchUserStatus();
        }, 2000);
    } catch (error) {
        console.error('Error opening login page:', error);
        loginBtn.disabled = false;
    }
}

/**
 * Handle subscribe button click
 */
async function handleSubscribe() {
    try {
        subscribeBtn.disabled = true;
        subscribeBtn.textContent = 'Opening...';

        await chrome.runtime.sendMessage({ action: 'OPEN_PAYMENT_PAGE' });

        // Re-enable after a delay
        setTimeout(() => {
            subscribeBtn.disabled = false;
            subscribeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
                </svg>
                Subscribe to Pro
            `;
            // Refresh status after subscription attempt
            fetchUserStatus();
        }, 2000);
    } catch (error) {
        console.error('Error opening payment page:', error);
        subscribeBtn.disabled = false;
    }
}

/**
 * Handle logout button click
 */
async function handleLogout() {
    try {
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Logging out...';
        }

        await chrome.runtime.sendMessage({ action: 'LOGOUT' });

        // Reset button state after a delay (logging out usually opens a new tab/window)
        setTimeout(() => {
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                    </svg>
                    Log Out
                `;
            }
            // Refresh status - though user might still be logged in until they act on the ExtPay page
            fetchUserStatus();
        }, 1000);
    } catch (error) {
        console.error('Error logging out:', error);
        if (logoutBtn) logoutBtn.disabled = false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    fetchUserStatus();
});
