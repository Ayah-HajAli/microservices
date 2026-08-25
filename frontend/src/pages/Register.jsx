import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [err, setErr] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await register(email, password, fullName); navigate('/'); }
    catch (e2) { setErr(e2.response?.data?.message || e2.response?.data?.error || 'Register failed'); }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow-sm border">
      <h1 className="text-xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create account</button>
      </form>
      <p className="text-sm mt-3">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link></p>
    </div>
  );
}
