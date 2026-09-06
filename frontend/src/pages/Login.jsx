import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 border">
        <h1 className="text-3xl font-bold text-gray-900" style={{ textAlign: 'center' }}>Attendance Management System</h1>
        <p className="text-gray-500 mt-2" style={{ textAlign: 'center' }}>Employee and HR login</p>
        {error && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}
        <div className="space-y-4 mt-6">
          <input className="w-full border rounded-lg p-3" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full border rounded-lg p-3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Login</button>
        <p className="text-center text-sm text-gray-500 mt-4">New employee? <Link to="/register" className="text-blue-600">Register here</Link></p>
        {/* <div className="mt-6 text-sm bg-gray-50 rounded-lg p-4">
          <p><strong>HR:</strong> hr@attendance.com / admin123</p>
        </div> */}
      </form>
    </div>
  );
}
