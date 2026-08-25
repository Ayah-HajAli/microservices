import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function Products() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useAuth();

  // Load products
  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category) {
        params.category = category;
      }

      const response = await api.get('/products/products', {
        params,
      });

      // API returns:
      // {
      //   items: [...]
      // }
      const products = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

      setItems(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      setItems([]);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/products/categories');

        const categories = Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

        setCats(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCats([]);
      }
    };

    loadCategories();
  }, []);

  // Load products initially and whenever category changes
  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Add product to cart
  const addToCart = async (id) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }

    try {
      await api.post('/orders/cart', {
        product_id: id,
        quantity: 1,
      });

      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add product to cart:', error);

      alert(
        error?.response?.data?.error ||
          'Failed to add product to cart.'
      );
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Products
      </h1>

      {/* Search and category filters */}
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              load();
            }
          }}
          placeholder="Search..."
          className="border rounded px-3 py-1.5 flex-1"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-1.5"
        >
          <option value="">
            All categories
          </option>

          {cats.map((c) => (
            <option
              key={c.id || c.slug}
              value={c.slug}
            >
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={load}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 rounded p-3 mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded shadow-sm border p-3 flex flex-col"
            >
              <Link to={`/products/${p.id}`}>
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />

                <h3 className="font-semibold">
                  {p.name}
                </h3>
              </Link>

              <p className="text-sm text-gray-500 flex-1">
                {p.description}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold">
                  {money(p.price_cents)}
                </span>

                <button
                  onClick={() => addToCart(p.id)}
                  disabled={Number(p.in_stock || 0) <= 0}
                  className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-green-700"
                >
                  {Number(p.in_stock || 0) > 0
                    ? 'Add to cart'
                    : 'Out of stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}