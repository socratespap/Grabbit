/**
 * Grabbit Premium State Manager
 * Handles ExtPay integration and license validation
 */

import ExtPay from './ExtPay.js';

const EXTENSION_ID = 'grabbit-premium'; // Configured in ExtPay dashboard
const extpay = ExtPay(EXTENSION_ID);

export const Premium = {
    /**
     * Initialize ExtPay - call this in background.js
     */
    async init() {
        extpay.startBackground();
    },

    /**
     * Get current user payment status
     * @returns {Promise<{paid: boolean, email: string|null, trialActive: boolean}>}
     */
    async getUser() {
        try {
            const user = await extpay.getUser();
            return {
                paid: user.paid || false,
                email: user.email || null,
                trialActive: user.trialStartedAt && !user.paid,
                paidAt: user.paidAt || null
            };
        } catch (e) {
            console.error('ExtPay getUser error:', e);
            return { paid: false, email: null, trialActive: false };
        }
    },

    /**
     * Open ExtPay payment page
     */
    openPaymentPage() {
        extpay.openPaymentPage();
    },

    /**
     * Open ExtPay login page (for existing users)
     */
    openLoginPage() {
        extpay.openLoginPage();
    },

    /**
     * Validate license with WordPress backend
     * @param {string} email - User's email from ExtPay
     * @returns {Promise<{valid: boolean, remainingCredits: number}>}
     */
    async validateWithBackend(email) {
        try {
            const response = await fetch('https://grabbit.socratisp.com/wp-json/grabbit/v1/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`Backend validation failed: ${response.status}`);
            }

            return await response.json();
        } catch (e) {
            console.error('Backend validation error:', e);
            // In case of error (e.g. offline), we might want to default to denying or allowing based on ExtPay
            // For now, fail safe if ExtPay says paid
            return { valid: false, remainingCredits: 0 };
        }
    }
};
