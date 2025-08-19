import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { listBookingsByUser } from '../services/bookings';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // not authenticated — send to login
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoadingBookings(true);
      setError(null);
      try {
        const docs = await listBookingsByUser(user.$id);
        setBookings(docs || []);
      } catch (err) {
        console.warn('Failed to load bookings for profile:', err?.message || err);
        setError('Failed to load bookings');
      } finally {
        setLoadingBookings(false);
      }
    }
    load();
  }, [user]);

  function handleSignOut() {
    logout();
    navigate('/');
  }

  function handleClearLocalFallback() {
    try {
      localStorage.removeItem('local_bookings');
      // reload bookings
      if (user) listBookingsByUser(user.$id).then((docs) => setBookings(docs || [])).catch(() => {});
    } catch (e) {
      console.warn('Failed to clear local bookings:', e?.message || e);
    }
  }

  const total = bookings.length;
  const paid = bookings.filter((b) => (b.status || '').toLowerCase() === 'paid').length;
  const pending = bookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="flex gap-2">
          <button
            onClick={handleClearLocalFallback}
            className="px-3 py-2 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200"
          >
            Clear local bookings
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 bg-white rounded shadow p-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            {user?.name ? user.name.split(' ').map(s => s[0]).slice(0,2).join('') : user?.email?.[0]?.toUpperCase()}
          </div>
          <h2 className="mt-3 font-semibold">{user?.name || 'Unnamed'}</h2>
          <div className="text-sm text-gray-600">{user?.email}</div>
          <div className="text-xs text-gray-400 mt-2">ID: {user?.$id}</div>
        </div>

        <div className="col-span-2 bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Bookings</h3>
            <div className="text-sm text-gray-600">Total: {total}</div>
          </div>

          <div className="flex gap-3 text-sm mb-4">
            <div className="px-3 py-1 rounded bg-green-100 text-green-800">Paid: {paid}</div>
            <div className="px-3 py-1 rounded bg-yellow-100 text-yellow-800">Pending: {pending}</div>
          </div>

          {loadingBookings ? (
            <div className="text-gray-500">Loading bookings...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="text-gray-500">You have no bookings yet. Browse trips to book your next adventure.</div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <Link to={`/trips/${b.tripId}`} className="font-semibold text-indigo-600 hover:underline">
                      {b.tripTitle || 'Trip'}
                    </Link>
                    <div className="text-sm text-gray-600">Date: {b.date || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={
                        `px-2 py-1 rounded text-sm ${((b.status||'').toLowerCase() === 'paid') ? 'bg-green-100 text-green-800' : ((b.status||'').toLowerCase() === 'failed') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`
                      }
                    >
                      {b.status || 'pending'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">ID: {b.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
