import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { account } from '../lib/backend';
import { AuthCtx } from './auth';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminAllowlist = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await account.get();
        if (mounted) setUser(u);
      } catch (e) {
        // not logged in
        console.warn('Auth init:', e?.message || e);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const login = async ({ email, password }) => {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setUser(u);
  };

  const signup = async ({ name, email, password }) => {
    await account.create('unique()', email, password, name);
    await login({ email, password });
  };

  const logout = async () => {
    await account.deleteSessions();
    setUser(null);
  };

  const loginWithGoogle = async () => {
    const success = import.meta.env.VITE_GOOGLE_SUCCESS_REDIRECT || `${window.location.origin}/`;
    const failure = import.meta.env.VITE_GOOGLE_FAILURE_REDIRECT || `${window.location.origin}/login`;
    // This will redirect the browser to Google and back to success/failure URLs
    await account.createOAuth2Session('google', success, failure);
  };

  const isAdmin = !!(user && user.email && adminAllowlist.includes(String(user.email).toLowerCase()));
  const value = { user, loading, isAdmin, login, signup, logout, loginWithGoogle };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
