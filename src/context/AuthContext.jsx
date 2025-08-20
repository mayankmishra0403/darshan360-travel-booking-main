import { useEffect, useState } from 'react';
import { account } from '../lib/backend';
import PropTypes from 'prop-types';
import { AuthCtx } from './auth';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sessionUser = await account.get();
        setUser(sessionUser);
        const admins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
        setIsAdmin(sessionUser?.email && admins.includes(sessionUser.email));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signup({ name, email, password }) {
    const id = `user_${Date.now()}`;
    await account.create(id, email, password, name);
    await account.createEmailSession(email, password);
    const u = await account.get();
    setUser(u);
    return u;
  }

  async function login({ email, password }) {
    await account.createEmailSession(email, password);
    const u = await account.get();
    setUser(u);
    return u;
  }

  async function loginWithGoogle() {
    try {
  // For local development prefer VITE_APP_URL_LOCAL (if provided), otherwise
  // prefer VITE_APP_URL, and finally fall back to window.location.origin.
  // This ensures that when running on localhost we send a localhost redirect to Appwrite.
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const localUrl = import.meta.env.VITE_APP_URL_LOCAL || '';
  const prodUrl = import.meta.env.VITE_APP_URL || '';
  const base = (isLocalHost && localUrl) ? localUrl : (prodUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
  const origin = base.replace(/\/$/, '');
  const success = `${origin}/login`;
  const failure = `${origin}/login`;
  console.log('Creating OAuth2 session with success/failure:', success, failure);
  await account.createOAuth2Session('google', success, failure);
    } catch (err) {
      console.warn('OAuth not configured or popup blocked', err?.message || err);
    }
  }

  async function logout() {
    try {
      await account.deleteSession('current');
    } catch {
      // ignore
    }
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAdmin,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};