import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      nav('/');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="bg-[#FD366E] text-white px-4 py-2 rounded w-full">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="px-3 text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
      <button onClick={loginWithGoogle} className="w-full border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.911 29.143 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.704 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.128-7.662 19.128-20 0-1.341-.138-2.651-.517-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.815C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.704 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.086 0 9.705-1.74 13.304-4.712l-6.137-5.192C28.973 35.461 26.651 36 24 36c-5.116 0-9.563-3.063-11.309-7.436l-6.5 5.017C9.468 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.911 29.143 36 24 36c-5.116 0-9.563-3.063-11.309-7.436l-6.5 5.017C9.468 39.556 16.227 44 24 44c10.494 0 19.128-7.662 19.128-20 0-1.341-.138-2.651-.517-3.917z"/></svg>
        Continue with Google
      </button>
      <p className="mt-3 text-sm">No account? <Link className="text-[#FD366E]" to="/signup">Sign up</Link></p>
    </div>
  );
}
