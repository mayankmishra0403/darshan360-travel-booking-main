import { useEffect, useMemo, useState } from 'react';
import TripCard from '../components/TripCard';
import { listTrips } from '../services/trips';
import { useAuth } from '../context/auth';
import { createBookingWithIdFallback } from '../services/bookings';
import { createPaymentWithId } from '../services/payments';
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
        if (t && t.length > 0) {
          setTrips(t);
        } else {
          // Demo trips if none from backend
          setTrips([
            {
              id: 'demo-chitrakoot',
              title: 'Chitrakoot Spiritual Retreat',
              price: 4999,
              date: '2025-09-10',
              imageIds: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
              stops: ['Ramghat', 'Kamadgiri', 'Gupt Godavari'],
            },
            {
              id: 'demo-ramsetu',
              title: 'Ram Setu Adventure',
              price: 7999,
              date: '2025-10-05',
              imageIds: ['https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80'],
              stops: ['Dhanushkodi', 'Rameswaram Temple', 'Pamban Bridge'],
            },
            {
              id: 'demo-varanasi',
              title: 'Varanasi Ganga Aarti',
              price: 5999,
              date: '2025-11-15',
              imageIds: ['https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80'],
              stops: ['Dashashwamedh Ghat', 'Kashi Vishwanath', 'Sarnath'],
            },
            {
              id: 'demo-hampi',
              title: 'Hampi Heritage Walk',
              price: 6999,
              date: '2025-12-01',
              imageIds: ['https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80'],
              stops: ['Virupaksha Temple', 'Vittala Temple', 'Lotus Mahal'],
            },
            {
              id: 'demo-leh',
              title: 'Leh-Ladakh Road Trip',
              price: 15999,
              date: '2026-01-20',
              imageIds: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'],
              stops: ['Pangong Lake', 'Khardung La', 'Nubra Valley'],
            },
            {
              id: 'demo-goa',
              title: 'Goa Beach Escape',
              price: 8999,
              date: '2025-12-20',
              imageIds: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
              stops: ['Baga Beach', 'Fort Aguada', 'Dudhsagar Falls'],
            },
          ]);
        }
      } catch (e) {
        console.error(e);
        // fallback demo trips
        setTrips([
          {
            id: 'demo-chitrakoot',
            title: 'Chitrakoot Spiritual Retreat',
            price: 4999,
            date: '2025-09-10',
            imageIds: [],
            stops: ['Ramghat', 'Kamadgiri', 'Gupt Godavari'],
          },
          {
            id: 'demo-ramsetu',
            title: 'Ram Setu Adventure',
            price: 7999,
            date: '2025-10-05',
            imageIds: [],
            stops: ['Dhanushkodi', 'Rameswaram Temple', 'Pamban Bridge'],
          },
          {
            id: 'demo-varanasi',
            title: 'Varanasi Ganga Aarti',
            price: 5999,
            date: '2025-11-15',
            imageIds: [],
            stops: ['Dashashwamedh Ghat', 'Kashi Vishwanath', 'Sarnath'],
          },
          {
            id: 'demo-hampi',
            title: 'Hampi Heritage Walk',
            price: 6999,
            date: '2025-12-01',
            imageIds: [],
            stops: ['Virupaksha Temple', 'Vittala Temple', 'Lotus Mahal'],
          },
          {
            id: 'demo-leh',
            title: 'Leh-Ladakh Road Trip',
            price: 15999,
            date: '2026-01-20',
            imageIds: [],
            stops: ['Pangong Lake', 'Khardung La', 'Nubra Valley'],
          },
          {
            id: 'demo-goa',
            title: 'Goa Beach Escape',
            price: 8999,
            date: '2025-12-20',
            imageIds: [],
            stops: ['Baga Beach', 'Fort Aguada', 'Dudhsagar Falls'],
          },
        ]);
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
    // Create a client-side pending booking and payment record so the user
    // is marked as having initiated a booking even without server-side flow.
    const now = new Date().toISOString();
    const id = `upi_${Date.now()}`;
    try {
      await createBookingWithIdFallback({ id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'pending', date: now });
    } catch (e) {
      console.warn('Client pending booking create failed (permissions?):', e?.message || e);
    }

    try {
      await createPaymentWithId({ id, data: { orderId: id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'created', amount: Number(trip.price) * 100, currency: 'INR', date: now } });
    } catch (e) {
      console.warn('Client pending payment create failed (permissions?):', e?.message || e);
    }

    // Open Razorpay.me UPI link in a new tab for the user to complete payment.
    // Replace this URL with your desired Razorpay.me link (UPI) if it changes.
    const upiLink = 'http://razorpay.me/@mayanksoni8625';
    window.open(upiLink, '_blank', 'noopener');

    // Optionally show a toast/modal instructing the user to return after payment
    // so an admin or an automated process can verify and mark the booking paid.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
      {/* Floating background bubbles */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br from-blue-300 via-purple-200 to-orange-200 opacity-40 animate-bubble${i % 3}`}
            style={{
              width: `${16 + Math.random() * 28}px`,
              height: `${16 + Math.random() * 28}px`,
              left: `${Math.random() * 95}%`,
              bottom: `${Math.random() * 85}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Discover Your Next
              <span className="block text-yellow-300">Adventure</span>
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Handpicked destinations, expert local guides, and seamless booking experiences. 
              Turn your travel dreams into unforgettable memories.
            </p>
            
            {/* Enhanced Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative flex bg-white/10 backdrop-blur-md rounded-full p-2 shadow-2xl">
                <div className="flex-1 flex items-center">
                  <svg className="w-5 h-5 text-white/70 ml-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search destinations, experiences, or adventures..." 
                    className="w-full bg-transparent text-white placeholder-white/70 focus:outline-none text-lg"
                  />
                </div>
                <button 
                  onClick={() => setQuery('')}
                  className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105"
                >
                  Explore
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl"></div>
      </section>

      {/* Trips Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Featured Destinations
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Carefully curated experiences that showcase the best of each destination
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Discovering amazing trips...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your search or browse all destinations</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filtered.map((t, index) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.95, rotate: -2 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.04, rotate: 2, boxShadow: '0 8px 32px 0 #a78bfa33' }}
                exit={{ opacity: 0, y: 40, scale: 0.9, rotate: -4 }}
                transition={{ delay: index * 0.08, duration: 0.45, type: 'spring', stiffness: 120 }}
              >
                <TripCard trip={t} onPay={pay} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
