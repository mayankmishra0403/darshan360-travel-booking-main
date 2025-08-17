import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      nav('/');
    } catch (e) {
      setError(e.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Create Account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="text" required placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
        <input type="email" required placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="bg-[#FD366E] text-white px-4 py-2 rounded w-full">{loading ? 'Signing up...' : 'Sign Up'}</button>
      </form>
      <p className="mt-3 text-sm">Already have an account? <Link className="text-[#FD366E]" to="/login">Login</Link></p>
    </div>
  );
}
