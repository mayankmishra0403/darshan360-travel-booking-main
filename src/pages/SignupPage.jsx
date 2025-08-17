import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    try {
      const remembered = localStorage.getItem('remember_email');
      if (remembered) {
        setForm((f) => ({ ...f, email: remembered }));
        setRemember(true);
      }
    } catch (err) { console.debug('localStorage read failed', err); }
  }, []);

  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please complete all fields');
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError('');
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form);
      if (remember) localStorage.setItem('remember_email', form.email);
      else localStorage.removeItem('remember_email');
      nav('/');
    } catch (err) {
      setError(err?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-gray-500">Sign up to book trips and manage your adventures</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@domain.com"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Password</label>
            </div>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Choose a password"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 pr-10"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-2 text-sm text-gray-500">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="text-gray-600">Remember my email</span>
            </label>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button disabled={loading} type="submit" className="w-full bg-blue-600 disabled:opacity-60 text-white py-2 rounded-lg font-semibold">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="text-sm text-gray-400">or</div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button onClick={() => loginWithGoogle()} className="w-full border border-gray-200 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.911 29.143 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.704 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.128-7.662 19.128-20 0-1.341-.138-2.651-.517-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.815C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.704 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.086 0 9.705-1.74 13.304-4.712l-6.137-5.192C28.973 35.461 26.651 36 24 36c-5.116 0-9.563-3.063-11.309-7.436l-6.5 5.017C9.468 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.911 29.143 36 24 36c-5.116 0-9.563-3.063-11.309-7.436l-6.5 5.017C9.468 39.556 16.227 44 24 44c10.494 0 19.128-7.662 19.128-20 0-1.341-.138-2.651-.517-3.917z"/></svg>
          Continue with Google
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link className="text-blue-600 font-medium" to="/login">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
