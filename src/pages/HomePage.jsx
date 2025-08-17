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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
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
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
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
