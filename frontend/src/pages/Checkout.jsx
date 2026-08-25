import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Checkout() {
  const [addr, setAddr] = useState({ line1: '', city: '', postal_code: '', country: 'US' });
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const { data } = await api.post('/orders/orders/checkout', { shipping_address: addr });
      alert(`Order ${data.id.slice(0, 8)} placed!`);
      navigate('/orders');
    } catch (e2) { setErr(e2.response?.data?.error || 'Checkout failed'); }
  };

  const f = (k, v) => setAddr({ ...addr, [k]: v });

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow-sm border">
      <h1 className="text-xl font-semibold mb-4">Checkout</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Address line 1" value={addr.line1} onChange={(e) => f('line1', e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="City" value={addr.city} onChange={(e) => f('city', e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Postal code" value={addr.postal_code} onChange={(e) => f('postal_code', e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Country (2 letter)" maxLength={2} value={addr.country} onChange={(e) => f('country', e.target.value.toUpperCase())} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Place order</button>
      </form>
    </div>
  );
}
