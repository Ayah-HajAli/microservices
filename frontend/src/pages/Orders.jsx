import { useEffect, useState } from 'react';
import { api } from '../api/client';

const money = (c) => `$${(c / 100).toFixed(2)}`;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/orders/orders').then((r) => setOrders(r.data.items)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My orders</h1>
      {orders.length === 0 ? <p>No orders yet.</p> : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="bg-white p-4 rounded shadow-sm border">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">#{o.id.slice(0, 8)}</span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">{o.status}</span>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {o.items.map((it, i) => <li key={i}>{it.product_name} × {it.quantity}  ({money(it.line_total_cents)})</li>)}
              </ul>
              <div className="mt-2 text-right font-bold">{money(o.total_cents)}</div>
              <div className="text-xs text-gray-400 text-right">{new Date(o.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
