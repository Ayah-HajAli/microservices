import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const money = (c) => `$${(c / 100).toFixed(2)}`;

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total_cents: 0 });
  const load = () => api.get('/orders/cart').then((r) => setCart(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (id) => { await api.delete(`/orders/cart/${id}`); load(); };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Your cart</h1>
      {cart.items.length === 0 ? (
        <p>Cart is empty. <Link className="text-blue-600 hover:underline" to="/">Browse products</Link></p>
      ) : (
        <div className="bg-white rounded shadow-sm border">
          <ul className="divide-y">
            {cart.items.map((it) => (
              <li key={it.product_id} className="flex items-center p-3 gap-3">
                <img src={it.image_url} alt="" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-semibold">{it.name}</p>
                  <p className="text-sm text-gray-500">{money(it.price_cents)} × {it.quantity}</p>
                </div>
                <div className="font-semibold">{money(it.price_cents * it.quantity)}</div>
                <button className="text-red-600 text-sm" onClick={() => remove(it.product_id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="p-3 border-t flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">{money(cart.total_cents)}</span>
          </div>
          <div className="p-3 border-t text-right">
            <Link to="/checkout" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
