import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">🛒 Shop</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:underline">Products</Link>
          {token && <Link to="/cart" className="hover:underline">Cart</Link>}
          {token && <Link to="/orders" className="hover:underline">Orders</Link>}
          {token ? (
            <>
              <span className="text-gray-500">{user?.email}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-red-600 hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
