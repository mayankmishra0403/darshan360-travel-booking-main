import { useEffect, useMemo, useState } from 'react';
import TripCard from '../components/TripCard';
import { listTrips } from '../services/trips';
import { useAuth } from '../context/auth';
import { openRazorpay } from '../services/razorpay';
import { createBookingWithId, updateBooking } from '../services/bookings';
import { createPaymentWithId, updatePayment } from '../services/payments';
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
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const orderRes = await fetch(`${backendUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(trip.price) * 100, currency: 'INR', receipt: `trip_${trip.id}`, trip, userId: user.$id }),
      credentials: 'include',
    }).then((r) => r.json());

    // If server cannot record bookings, create a pending booking client-side
    if (!orderRes.serverCreatesBookings) {
      const now = new Date().toISOString();
      try {
        await createBookingWithId({ id: orderRes.id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'pending', date: now });
      } catch (e) { console.warn('Client pending booking create failed (permissions?):', e?.message || e); }
    }

    if (!orderRes.serverCreatesPayments) {
      const now = new Date().toISOString();
      try {
        await createPaymentWithId({ id: orderRes.id, data: { orderId: orderRes.id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'created', amount: Number(trip.price) * 100, currency: 'INR', date: now } });
      } catch (e) { console.warn('Client pending payment create failed (permissions?):', e?.message || e); }
    }
    await openRazorpay({
      key,
      order: orderRes,
      user,
      onSuccess: async (resp) => {
        try {
          const resp2 = await fetch(`${backendUrl}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: orderRes, razorpay: resp, trip, userId: user.$id }),
          }).then((r) => r.json());
          if (!resp2?.recorded) {
            try {
              await updateBooking({ id: orderRes.id, status: 'paid', date: new Date().toISOString() });
            } catch (e) { console.warn('Client booking update to paid failed:', e?.message || e); }
          }
          if (!resp2?.paymentsRecorded) {
            try {
              await updatePayment({ id: orderRes.id, data: { status: 'paid', paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature, date: new Date().toISOString() } });
            } catch (e) { console.warn('Client payment update to paid failed:', e?.message || e); }
          }
        } catch (e) { console.error(e); }
      },
      onFailure: async (failure) => {
        try {
          const resp3 = await fetch(`${backendUrl}/record-payment-failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: orderRes, trip, userId: user.$id, failure }),
          }).then((r) => r.json());
          if (!resp3?.recorded) {
            try {
              await updateBooking({ id: orderRes.id, status: 'failed', date: new Date().toISOString() });
            } catch (e) { console.warn('Client booking update to failed failed:', e?.message || e); }
          }
          if (!resp3?.paymentsRecorded) {
            try {
              await updatePayment({ id: orderRes.id, data: { status: 'failed', failure, date: new Date().toISOString() } });
            } catch (e) { console.warn('Client payment update to failed failed:', e?.message || e); }
          }
        } catch (e) { console.error(e); }
      }
    });
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
