import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 border">
        <h1 className="text-3xl font-bold">Employee Registration</h1>
        <p className="text-gray-500 mt-2">New accounts are created as Employee.</p>
        {error && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}
        <div className="space-y-4 mt-6">
          <input className="w-full border rounded-lg p-3" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full border rounded-lg p-3" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border rounded-lg p-3" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <input className="w-full border rounded-lg p-3" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
        </div>
        <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold">Create Employee Account</button>
        <p className="text-center text-sm text-gray-500 mt-4">Already registered? <Link to="/login" className="text-blue-600">Login</Link></p>
      </form>
    </div>
  );
}
