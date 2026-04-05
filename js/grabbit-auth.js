/**
 * GrabbitAuth — Supabase Auth via REST API (no external library)
 *
 * Uses fetch calls directly to the Supabase Auth REST API so this module
 * works in both Chrome MV3 service workers (no localStorage) AND regular
 * page contexts. Session is stored in chrome.storage.local.
 */

const SUPABASE_URL  = 'https://xtemoktforlrgxwdtpqb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZW1va3Rmb3Jscmd4d2R0cHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODk4NjQsImV4cCI6MjA4OTI2NTg2NH0.-33sDEWPNwbMiNG9r1-7h474BeBryL1VG9vcI3vT_hY';
const AUTH_BASE     = `${SUPABASE_URL}/auth/v1`;
const SESSION_KEY   = 'grabbit_auth_session';

/** Default headers for every auth request */
const authHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    ...extra,
});

export const GrabbitAuth = {

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Create a new account. Returns { success, error }.
     * Supabase will send a confirmation email (if enabled in Dashboard).
     */
    async signUp(email, password) {
        try {
            const res = await fetch(`${AUTH_BASE}/signup`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.msg || data.message || 'Sign-up failed.' };

            // If email confirmation is required, data.session will be null
            if (data.session) await this._saveSession(data);
            return {
                success: true,
                needsConfirmation: !data.session,
                error: null,
            };
        } catch (e) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    /**
     * Sign in with email + password. Returns { success, error }.
     */
    async signIn(email, password) {
        try {
            const res = await fetch(`${AUTH_BASE}/token?grant_type=password`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.error_description || data.msg || data.message || 'Invalid email or password.';
                return { success: false, error: msg };
            }
            await this._saveSession(data);
            return { success: true, error: null };
        } catch (e) {
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    /**
     * Sign out — clears local session, invalidates token on server.
     */
    async signOut() {
        try {
            const session = await this.getSession();
            if (session?.access_token) {
                await fetch(`${AUTH_BASE}/logout`, {
                    method: 'POST',
                    headers: authHeaders({ 'Authorization': `Bearer ${session.access_token}` }),
                }).catch(() => {}); // best-effort
            }
        } finally {
            await this._clearSession();
        }
    },

    /**
     * Send a password reset email.
     */
    async resetPassword(email) {
        try {
            const res = await fetch(`${AUTH_BASE}/recover`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const d = await res.json();
                return { success: false, error: d.msg || 'Failed to send reset email.' };
            }
            return { success: true, error: null };
        } catch (e) {
            return { success: false, error: 'Network error.' };
        }
    },

    /**
     * Get the current session, refreshing automatically if the access token
     * is expired. Returns null if not authenticated.
     */
    async getSession() {
        const stored = await chrome.storage.local.get(SESSION_KEY);
        const session = stored[SESSION_KEY];
        if (!session) return null;

        // Refresh 60 seconds before expiry
        const nowSec = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at - 60 < nowSec) {
            if (session.refresh_token) return await this._refresh(session.refresh_token);
            await this._clearSession();
            return null;
        }
        return session;
    },

    /**
     * Get the current user with subscription status.
     * Returns { isPremium, email, userId, session } or null if not signed in.
     */
    async getUser() {
        const session = await this.getSession();
        if (!session) return { isPremium: false, email: null, userId: null, session: null };

        try {
            // Query grabbit_subscribers using the user's JWT — RLS lets them read their own row
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/grabbit_subscribers?select=status,current_period_end,monthly_limit,monthly_usage,last_usage_month,plan_type,month_reset_requests&limit=1`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON,
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                }
            );

            if (!res.ok) return { isPremium: false, email: session.user?.email, userId: session.user?.id, session };

            const rows = await res.json();
            const sub = rows?.[0];
            const isPremium = sub ? _checkPremiumStatus(sub) : false;

            // DEBUG — remove after confirming
            console.log('[GrabbitAuth] REST status:', res.status);
            console.log('[GrabbitAuth] subscriber rows:', JSON.stringify(rows));
            console.log('[GrabbitAuth] isPremium:', isPremium, 'sub:', JSON.stringify(sub));

            return {
                isPremium,
                email: session.user?.email || null,
                userId: session.user?.id || null,
                session,
                subscription: sub || null,
            };
        } catch (e) {
            console.warn('[GrabbitAuth] getUser error:', e);
            return { isPremium: false, email: session.user?.email, userId: session.user?.id, session };
        }
    },

    /**
     * Get just the access_token (used by background.js for AI calls).
     * Auto-refreshes if needed. Throws if not authenticated.
     */
    async getAccessToken() {
        const session = await this.getSession();
        if (!session?.access_token) {
            throw new Error('Not logged in. Please sign in via the Pro Account page.');
        }
        return session.access_token;
    },

    // ─── Private helpers ─────────────────────────────────────────────────────

    async _refresh(refreshToken) {
        try {
            const res = await fetch(`${AUTH_BASE}/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) {
                await this._clearSession();
                return null;
            }
            const data = await res.json();
            await this._saveSession(data);
            return data;
        } catch (e) {
            await this._clearSession();
            return null;
        }
    },

    async _saveSession(data) {
        const nowSec = Math.floor(Date.now() / 1000);
        const session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: nowSec + (data.expires_in ?? 3600),
            user: data.user ?? null,
        };
        await chrome.storage.local.set({ [SESSION_KEY]: session });
    },

    async _clearSession() {
        await chrome.storage.local.remove([
            SESSION_KEY,
            'cachedCredits',
            'cachedCreditsTimestamp',
        ]);
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mirrors the premium status check in Edge Functions (with 3-day grace period) */
function _checkPremiumStatus(sub) {
    if (!sub) return false;
    if (sub.current_period_end) {
        const expiry = new Date(sub.current_period_end).getTime();
        const grace  = expiry + 3 * 24 * 60 * 60 * 1000;
        if (grace < Date.now()) return false;
    }
    return ['active', 'trialing'].includes(sub.status);
}
