import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const money = (c) => `$${(c / 100).toFixed(2)}`;

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const { token } = useAuth();

  useEffect(() => { api.get(`/products/products/${id}`).then((r) => setP(r.data)); }, [id]);
  if (!p) return <p>Loading…</p>;

  const add = async () => {
    if (!token) return alert('Please log in first.');
    await api.post('/orders/cart', { product_id: p.id, quantity: qty });
    alert('Added to cart!');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <img src={p.image_url} alt={p.name} className="w-full rounded shadow-sm" />
      <div>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <p className="text-sm text-gray-500 mt-1">SKU: {p.sku} • Category: {p.category_name}</p>
        <p className="mt-4">{p.description}</p>
        <p className="text-2xl font-bold mt-4">{money(p.price_cents)}</p>
        <p className="text-sm text-gray-500 mt-1">In stock: {p.in_stock}</p>
        <div className="mt-4 flex items-center gap-2">
          <input type="number" min="1" max={p.in_stock || 1} value={qty}
                 onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                 className="border rounded w-20 px-2 py-1" />
          <button onClick={add} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add to cart</button>
        </div>
      </div>
    </div>
  );
}
