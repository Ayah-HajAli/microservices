import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await login(email, password); navigate('/'); }
    catch (e2) { setErr(e2.response?.data?.error || 'Login failed'); }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow-sm border">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Log in</button>
      </form>
      <p className="text-sm mt-3">No account? <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link></p>
    </div>
  );
}
