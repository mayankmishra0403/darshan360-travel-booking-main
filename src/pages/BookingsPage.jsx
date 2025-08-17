import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { listBookingsByUser } from '../services/bookings';

export default function BookingsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await listBookingsByUser(user.$id);
        setItems(list);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">My Bookings</h1>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No bookings yet.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li key={b.id} className="border rounded p-3 bg-white flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.tripTitle || b.tripId}</div>
                <div className="text-sm text-gray-600">Date: {b.date || 'TBD'}</div>
              </div>
              <span className={`px-2 py-1 rounded text-white ${b.status === 'paid' ? 'bg-green-600' : b.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'}`}>{b.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
