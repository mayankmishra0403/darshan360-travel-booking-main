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
  // Prefer an explicit env-configured app URL. Register both the origin and the /login path
  // in your Appwrite console (e.g. https://darshan360.netlify.app and https://darshan360.netlify.app/login).
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
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