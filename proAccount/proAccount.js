/**
 * Pro Account Page — Auth-first flow
 *
 * Flow:
 *   1. Not logged in  → show Sign In / Sign Up forms only
 *   2. Logged in, Free → show account info + upgrade options (payment buttons)
 *   3. Logged in, Pro  → show account info + credits + manage billing
 */

// ─── DOM refs ─────────────────────────────────────────────────────────────────
let loadingState, loginState, statusDisplay, errorState;
let subscriptionBadge, emailRow, userEmail, trialExpiryRow, trialExpiryDate;
let creditsSection, creditsReset, creditsTotal;
let upgradeBox, proActions;
let logoutBtn, retryBtn;
let cancelSubscriptionLink;

// Auth tabs / forms
let tabSignIn, tabSignUp, signInForm, signUpForm;
let loginEmailInput, loginPasswordInput, loginSubmitBtn, loginError;
let signupEmailInput, signupPasswordInput, signupSubmitBtn, signupError;
let forgotPasswordLink, resetStatusMsg;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cacheDomRefs();
    bindEvents();
    fetchUserStatus();
});

function cacheDomRefs() {
    loadingState   = document.getElementById('loading-state');
    loginState     = document.getElementById('login-state');
    statusDisplay  = document.getElementById('status-display');
    errorState     = document.getElementById('error-state');

    subscriptionBadge = document.getElementById('subscription-badge');
    emailRow          = document.getElementById('email-row');
    userEmail         = document.getElementById('user-email');
    trialExpiryRow    = document.getElementById('trial-expiry-row');
    trialExpiryDate   = document.getElementById('trial-expiry-date');
    creditsSection    = document.getElementById('credits-section');
    creditsReset      = document.getElementById('credits-reset');
    creditsTotal      = document.getElementById('credits-total');
    upgradeBox        = document.getElementById('upgrade-box');
    proActions        = document.getElementById('pro-actions');
    logoutBtn         = document.getElementById('logout-btn');
    retryBtn          = document.getElementById('retry-btn');
    cancelSubscriptionLink = document.getElementById('cancel-subscription-link');

    tabSignIn  = document.getElementById('tab-signin');
    tabSignUp  = document.getElementById('tab-signup');
    signInForm = document.getElementById('signin-form');
    signUpForm = document.getElementById('signup-form');

    loginEmailInput    = document.getElementById('login-email-input');
    loginPasswordInput = document.getElementById('login-password-input');
    loginSubmitBtn     = document.getElementById('login-submit-btn');
    loginError         = document.getElementById('login-error');

    signupEmailInput    = document.getElementById('signup-email-input');
    signupPasswordInput = document.getElementById('signup-password-input');
    signupSubmitBtn     = document.getElementById('signup-submit-btn');
    signupError         = document.getElementById('signup-error');

    forgotPasswordLink = document.getElementById('forgot-password-link');
    resetStatusMsg     = document.getElementById('reset-status-msg');
}

function bindEvents() {
    // Auth tab switching
    tabSignIn?.addEventListener('click', () => switchAuthTab('signin'));
    tabSignUp?.addEventListener('click', () => switchAuthTab('signup'));

    // Sign In
    loginSubmitBtn?.addEventListener('click', handleSignIn);
    loginEmailInput?.addEventListener('keydown',    e => { if (e.key === 'Enter') loginPasswordInput?.focus(); });
    loginPasswordInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignIn(); });

    // Sign Up
    signupSubmitBtn?.addEventListener('click', handleSignUp);
    signupEmailInput?.addEventListener('keydown',    e => { if (e.key === 'Enter') signupPasswordInput?.focus(); });
    signupPasswordInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignUp(); });

    // Forgot password
    forgotPasswordLink?.addEventListener('click', async e => {
        e.preventDefault();
        const email = loginEmailInput?.value?.trim();
        if (!email) { showFormError(loginError, 'Enter your email above first.'); return; }
        forgotPasswordLink.textContent = 'Sending…';
        const result = await chrome.runtime.sendMessage({ action: 'GRABBIT_LOGIN', type: 'reset_password', email });
        forgotPasswordLink.textContent = 'Forgot password?';
        if (result.success) {
            if (resetStatusMsg) { resetStatusMsg.textContent = 'Reset email sent! Check your inbox.'; resetStatusMsg.style.display = 'block'; }
        } else {
            showFormError(loginError, result.error || 'Failed to send reset email.');
        }
    });

    // Payment buttons (visible only to logged-in free users)
    document.getElementById('subscribe-monthly-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_PAYMENT_PAGE', plan: 'monthly' });
    });
    document.getElementById('subscribe-yearly-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_PAYMENT_PAGE', plan: 'yearly' });
    });

    // Manage billing / cancel
    document.getElementById('billing-portal-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_BILLING_PORTAL' });
    });
    cancelSubscriptionLink?.addEventListener('click', e => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'CANCEL_SUBSCRIPTION' });
    });

    // Logout
    logoutBtn?.addEventListener('click', handleLogout);

    // Retry on error
    retryBtn?.addEventListener('click', fetchUserStatus);
}

// ─── Auth tab switch ──────────────────────────────────────────────────────────
function switchAuthTab(tab) {
    const isSignIn = tab === 'signin';
    const indicator = document.getElementById('tab-indicator');
    
    tabSignIn?.classList.toggle('active', isSignIn);
    tabSignUp?.classList.toggle('active', !isSignIn);

    if (indicator) {
        indicator.style.transform = isSignIn ? 'translateX(0)' : 'translateX(100%)';
    }

    if (signInForm) {
        signInForm.style.display = isSignIn ? 'flex' : 'none';
        signInForm.style.animation = 'fadeIn 0.3s ease';
    }
    if (signUpForm) {
        signUpForm.style.display = isSignIn ? 'none' : 'flex';
        signUpForm.style.animation = 'fadeIn 0.3s ease';
    }
}

// ─── State panels ─────────────────────────────────────────────────────────────
function showStatePanel(state) {
    [loadingState, loginState, statusDisplay, errorState].forEach(el => {
        if (el) el.style.display = 'none';
    });
    switch (state) {
        case 'loading': if (loadingState)  loadingState.style.display  = 'flex'; break;
        case 'login':   if (loginState)    loginState.style.display    = 'block'; break;
        case 'status':  if (statusDisplay) statusDisplay.style.display = 'block'; break;
        case 'error':   if (errorState)    errorState.style.display    = 'block'; break;
    }
}

// ─── Fetch & render user status ───────────────────────────────────────────────
async function fetchUserStatus() {
    showStatePanel('loading');
    try {
        const resp = await chrome.runtime.sendMessage({ action: 'GET_PRO_STATUS' });
        if (resp.error) throw new Error(resp.error);

        // Not authenticated — show login/signup forms
        if (!resp.user.email) {
            showStatePanel('login');
            return;
        }

        // Authenticated — show account state
        renderAccountUI(resp.user, resp.credits);
    } catch (err) {
        document.getElementById('error-message').textContent =
            err.message || 'Unable to load account information.';
        showStatePanel('error');
    }
}

function renderAccountUI(user, credits) {
    showStatePanel('status');
    const isPro = user.paid;

    // Badge
    if (user.trialActive) {
        subscriptionBadge.textContent = 'TRIAL';
        subscriptionBadge.className   = 'status-badge badge-trial';
    } else if (isPro) {
        const planLabel = user.planType === 'yearly' ? 'PRO (Yearly)' : user.planType === 'monthly' ? 'PRO (Monthly)' : 'PRO ✓';
        subscriptionBadge.textContent = planLabel;
        subscriptionBadge.className   = 'status-badge badge-pro';
    } else {
        subscriptionBadge.textContent = 'FREE';
        subscriptionBadge.className   = 'status-badge badge-free';
    }

    // Email
    if (user.email && emailRow) {
        emailRow.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email;
    }

    // Trial Expiry
    if (user.trialActive && user.expiryDate && trialExpiryRow) {
        trialExpiryRow.style.display = 'flex';
        if (trialExpiryDate) {
            const date = new Date(user.expiryDate);
            trialExpiryDate.textContent = date.toLocaleDateString();
        }
    } else if (trialExpiryRow) {
        trialExpiryRow.style.display = 'none';
    }

    // Credits (Pro or Trial — both have AI access)
    if ((isPro || user.trialActive) && creditsSection) {
        creditsSection.style.display = 'block';
        const daysLeft = getDaysUntilReset(user.resetDate);
        if (creditsReset) creditsReset.textContent = `Resets in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
        if (credits?._remaining !== undefined) {
            updateCreditStyle(creditsTotal, credits._remaining);
        } else {
            if (creditsTotal) { creditsTotal.textContent = '—'; creditsTotal.classList.remove('low', 'empty'); }
        }
    } else if (creditsSection) {
        creditsSection.style.display = 'none';
    }

    // Action zones: upgrade box vs pro actions
    // Trialing users have already selected a plan, so we hide the upgrade box
    // and show the manage billing options instead.
    if (upgradeBox) upgradeBox.style.display = isPro ? 'none' : 'block';
    if (proActions)  proActions.style.display  = isPro ? 'block' : 'none';
}

function getDaysUntilReset(resetDateISO) {
    if (!resetDateISO) {
        // Fallback to end of current month if no date provided
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    }
    const now = new Date();
    const reset = new Date(resetDateISO);
    const diffMs = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function updateCreditStyle(el, value) {
    if (!el) return;
    el.textContent = value;
    el.classList.remove('low', 'empty');
    if (value === 0) el.classList.add('empty');
    else if (value <= 5) el.classList.add('low');
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
async function handleSignIn() {
    const email    = loginEmailInput?.value?.trim();
    const password = loginPasswordInput?.value;
    if (!email || !email.includes('@')) { showFormError(loginError, 'Enter a valid email address.'); return; }
    if (!password) { showFormError(loginError, 'Enter your password.'); return; }

    setButtonLoading(loginSubmitBtn, true, 'Signing in…');
    hideFormError(loginError);
    if (resetStatusMsg) resetStatusMsg.style.display = 'none';

    const result = await chrome.runtime.sendMessage({ action: 'GRABBIT_LOGIN', type: 'signin', email, password });
    setButtonLoading(loginSubmitBtn, false, 'Sign In');

    if (result.success) {
        fetchUserStatus();
    } else {
        showFormError(loginError, result.error || 'Sign-in failed. Please try again.');
    }
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
async function handleSignUp() {
    const email    = signupEmailInput?.value?.trim();
    const password = signupPasswordInput?.value;
    if (!email || !email.includes('@')) { showFormError(signupError, 'Enter a valid email address.'); return; }
    if (!password || password.length < 8) { showFormError(signupError, 'Password must be at least 8 characters.'); return; }

    setButtonLoading(signupSubmitBtn, true, 'Creating account…');
    hideFormError(signupError);

    const result = await chrome.runtime.sendMessage({ action: 'GRABBIT_LOGIN', type: 'signup', email, password });
    setButtonLoading(signupSubmitBtn, false, 'Create Account');

    if (result.success) {
        if (result.needsConfirmation) {
            showFormError(signupError, '✅ Check your email to confirm your account, then sign in.', 'success');
            switchAuthTab('signin');
            if (loginEmailInput) loginEmailInput.value = email;
        } else {
            fetchUserStatus();
        }
    } else {
        showFormError(signupError, result.error || 'Sign-up failed. Please try again.');
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function handleLogout() {
    if (!logoutBtn) return;
    setButtonLoading(logoutBtn, true, 'Logging out…');
    await chrome.runtime.sendMessage({ action: 'LOGOUT' });
    // Reset form state
    if (loginEmailInput)    loginEmailInput.value = '';
    if (loginPasswordInput) loginPasswordInput.value = '';
    hideFormError(loginError);
    if (resetStatusMsg) resetStatusMsg.style.display = 'none';
    setButtonLoading(logoutBtn, false, 'Log Out');
    showStatePanel('login');
    switchAuthTab('signin');
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
function showFormError(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'success' ? '#4CAF50' : '#e53935';
    el.style.display = 'block';
}

function hideFormError(el) {
    if (el) el.style.display = 'none';
}

function setButtonLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = label;
}
