import { useEffect, useMemo, useState } from 'react';
import TripCard from '../components/TripCard';
import { listTrips } from '../services/trips';
import { useAuth } from '../context/auth';
// Payments temporarily disabled (Razorpay removed)
import { createBookingWithId } from '../services/bookings';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const t = await listTrips();
        setTrips(t || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => (t.title || '').toLowerCase().includes(q) || (t.stops || []).join(' ').toLowerCase().includes(q));
  }, [trips, query]);

  const pay = async (trip) => {
    if (!user) return;
  // backendUrl not needed when payments are disabled
    // Payments are disabled. Create a pending booking directly client-side.
    const now = new Date().toISOString();
    try {
      const id = `pending_${Date.now()}`;
      await createBookingWithId({ id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'pending', date: now });
      // Optionally show a message or open a local confirmation modal here
    } catch (e) { console.warn('Client pending booking create failed (permissions?):', e?.message || e); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <section className="bg-gradient-to-r from-[#FF8A00] to-[#FD366E] text-white rounded-lg p-8 mb-6 shadow-lg overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Discover curated trips & unforgettable experiences</h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">Handpicked itineraries, local guides and easy bookings — find your next adventure.</p>
          <div className="mt-4 flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trips, destinations or stops" className="flex-1 px-3 py-2 rounded-md text-black" />
            <button onClick={() => setQuery('')} className="bg-white/20 px-4 rounded-md">Clear</button>
          </div>
        </div>
      </section>

      {loading ? (
        <div>Loading trips...</div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <TripCard trip={t} onPay={pay} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
