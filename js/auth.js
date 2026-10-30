/**
 * MUSE ATELIER - Authentication & Session Security Manager
 * 
 * Provides secure client-side admin authentication, session tokens with
 * expiry, SHA-256 credential hashing, and route protection guards.
 */

const AUTH_KEYS = {
  CREDENTIALS: 'muse_auth_credentials_v2',
  SESSION: 'muse_auth_session_v2'
};

// Default bootstrap admin credentials
const DEFAULT_AUTH = {
  username: 'admin',
  // SHA-256 hash of 'muse2026!' -> '28eeb3756a9cb9c99341aa4eec16602a5c35acf53a03fd26c2be3a6ebb140fc2'
  passwordHash: '28eeb3756a9cb9c99341aa4eec16602a5c35acf53a03fd26c2be3a6ebb140fc2',
  role: 'Administrator',
  createdAt: '2026-01-01T00:00:00Z'
};

class AuthManager {
  constructor() {
    this.initCredentials();
  }

  // Compute standard SHA-256 hash of a string
  async hashString(str) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Simple fallback if subtle crypto is somehow not supported
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return String(Math.abs(hash));
  }

  initCredentials() {
    try {
      if (!localStorage.getItem(AUTH_KEYS.CREDENTIALS)) {
        localStorage.setItem(AUTH_KEYS.CREDENTIALS, JSON.stringify(DEFAULT_AUTH));
      }
    } catch (e) {
      console.warn('Auth credentials init warning:', e);
    }
  }

  getCredentials() {
    try {
      const stored = localStorage.getItem(AUTH_KEYS.CREDENTIALS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading auth credentials:', e);
    }
    return DEFAULT_AUTH;
  }

  async login(username, password, rememberMe = false) {
    const cleanUser = (username || '').trim().toLowerCase();
    let backendSuccess = false;
    let sessionToken = null;
    let userRole = 'Administrator';
    let expiresAt = rememberMe 
      ? Date.now() + (30 * 24 * 60 * 60 * 1000)
      : Date.now() + (12 * 60 * 60 * 1000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password, remember: rememberMe })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.token) {
          backendSuccess = true;
          sessionToken = data.token;
          if (data.user) {
            userRole = data.user.role || 'Administrator';
            if (data.user.expiresAt) expiresAt = data.user.expiresAt;
          }
        }
      } else if (res.status === 401) {
        return { success: false, message: 'Invalid username or password.' };
      }
    } catch (e) {
      // Backend may be offline, fall back to client-side credential verification
    }

    if (!backendSuccess) {
      const creds = this.getCredentials();
      if (cleanUser !== creds.username.toLowerCase()) {
        return { success: false, message: 'Invalid username or password.' };
      }

      const inputHash = await this.hashString(password);
      if (inputHash !== creds.passwordHash) {
        return { success: false, message: 'Invalid username or password.' };
      }

      sessionToken = 'eluma_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      userRole = creds.role || 'Administrator';
    }

    const sessionData = {
      token: sessionToken,
      username: cleanUser,
      role: userRole,
      expiresAt: expiresAt,
      rememberMe: rememberMe,
      loggedInAt: new Date().toISOString()
    };

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(sessionData));

    // Clear the other storage to prevent conflicts
    if (rememberMe) {
      sessionStorage.removeItem(AUTH_KEYS.SESSION);
    } else {
      localStorage.removeItem(AUTH_KEYS.SESSION);
    }

    return { success: true, user: sessionData };
  }

  getSession() {
    try {
      // Check sessionStorage first, then localStorage
      let raw = sessionStorage.getItem(AUTH_KEYS.SESSION);
      if (!raw) {
        raw = localStorage.getItem(AUTH_KEYS.SESSION);
      }
      if (!raw) return null;

      const session = JSON.parse(raw);
      if (session && session.expiresAt && Date.now() < session.expiresAt) {
        return session;
      }
      // Expired session
      this.logout();
      return null;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated() {
    return this.getSession() !== null;
  }

  getCurrentUser() {
    const session = this.getSession();
    return session ? { username: session.username, role: session.role } : null;
  }

  async logout() {
    const s = this.getSession();
    if (s && s.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${s.token}` }
        });
      } catch (e) {}
    }
    sessionStorage.removeItem(AUTH_KEYS.SESSION);
    localStorage.removeItem(AUTH_KEYS.SESSION);
  }

  async changePassword(oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const creds = this.getCredentials();
    const oldHash = await this.hashString(oldPassword);

    if (oldHash !== creds.passwordHash) {
      return { success: false, message: 'Current password does not match.' };
    }

    const newHash = await this.hashString(newPassword);
    creds.passwordHash = newHash;
    creds.updatedAt = new Date().toISOString();

    localStorage.setItem(AUTH_KEYS.CREDENTIALS, JSON.stringify(creds));
    return { success: true, message: 'Password updated successfully!' };
  }

  // Guard for admin pages
  requireAuth(redirectUrl = 'admin.html#login') {
    if (!this.isAuthenticated()) {
      return false;
    }
    return true;
  }
}

// Global Auth Singleton
window.Auth = new AuthManager();
