import { motion } from 'framer-motion';
import heroImgFallback from '../../WhatsApp Image 2025-08-18 at 16.38.24_c7950d41.jpg';
import { useEffect, useState, useRef } from 'react';
import { listTrips } from '../services/trips';
import { getTripImageUrl } from '../services/trips';
import { useAuth } from '../context/auth';
import { createBookingWithIdFallback } from '../services/bookings';
import { createPaymentWithId } from '../services/payments';
import { Link } from 'react-router-dom';
// ...existing code...

export default function HomePage() {
  const [bg, setBg] = useState(null);
  const [firstTrip, setFirstTrip] = useState(null);
  const { user } = useAuth();
  const razorpayFormRef = useRef(null);

  useEffect(() => {
    const form = razorpayFormRef.current;
    if (!form) return;
    if (form.dataset.razorpayInitialized === 'true') return;
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.async = true;
      script.setAttribute('data-payment_button_id', 'pl_R8LRTyYQ22F9Ql');
      form.appendChild(script);
      form.dataset.razorpayInitialized = 'true';
    } catch (err) {
      console.warn('Failed to inject Razorpay script into HomePage form', err?.message || err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const trips = await listTrips();
        // Keep a copy for the Featured section.
        if (mounted) setFeaturedTrips(Array.isArray(trips) ? trips : []);
        // Prefer a trip marked as priority. Otherwise fallback to the first trip.
        let first = null;
        if (Array.isArray(trips) && trips.length) {
          first = trips.find((t) => t.priority) || trips[0];
        }
        const imgId = first?.imageIds?.[0];
        const url = imgId ? getTripImageUrl(imgId) : null;
        if (mounted) {
          setBg(url || heroImgFallback);
          setFirstTrip(first);
        }
      } catch {
        if (mounted) setBg(heroImgFallback);
      }
    }
    load();
    return () => (mounted = false);
  }, []);
  
  // Featured trips list (driven by admin priority flag)
  const [featuredTrips, setFeaturedTrips] = useState([]);
  return (
    <div className="min-h-screen relative overflow-hidden">
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
      {/* Enhanced Hero Section (intro) */}
      <section
        className="relative overflow-hidden text-white h-screen"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <style>
          {`
            @keyframes gradient {
              0% { background-position: 0% 50% }
              50% { background-position: 100% 50% }
              100% { background-position: 0% 50% }
            }
          `}
        </style>
        <div className="relative max-w-7xl mx-auto px-4 pt-16 sm:pt-20 md:pt-24 lg:pt-28">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white px-4">
              <span className="relative inline-block">
                Explore the timeless{' '}
                <span style={{ fontFamily: "'Kalam', cursive", fontSize: '1.2em', color: '#fbbf24', textShadow: '2px 2px 12px rgba(0,0,0,1)' }} className="whitespace-nowrap">
                  तपोभूमि
                </span>{' '}of
                <br className="md:hidden" />
                <span style={{ fontFamily: "'Kalam', cursive", fontSize: '1.2em', color: '#ffe066', textShadow: '2px 2px 12px rgba(0,0,0,1)' }} className="whitespace-nowrap">
                  श्री राम
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] w-[120%] h-6 pointer-events-none z-[-1] animate-fire-glow" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-12 max-w-3xl mx-auto">
              Handpicked destinations, expert local guides, and seamless booking experiences. 
              Turn your travel dreams into unforgettable memories.
            </p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex items-center gap-4">
                {user ? (
                  <motion.button
                    className="relative group px-16 py-4 rounded-full font-semibold text-xl overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300
                    }}
                    onClick={async () => {
                      try {
                        const now = new Date().toISOString();
                        const id = `upi_${Date.now()}`;
                        await createBookingWithIdFallback({ id, tripId: 'default', tripTitle: 'New Booking', userId: user.$id, status: 'pending', date: now });
                        try {
                          await createPaymentWithId({ id, data: { orderId: id, tripId: 'default', tripTitle: 'New Booking', userId: user.$id, status: 'created', amount: 1000 * 100, currency: 'INR', date: now } });
                        } catch (e) {
                          console.warn('Payment create fallback failed', e?.message || e);
                        }
                      } catch (e) {
                        console.warn('Book now fallback failed', e?.message || e);
                      }
                      // Trigger the hosted Razorpay button inside the hidden form
                      try {
                        const form = razorpayFormRef.current;
                        if (form) {
                          const btn = form.querySelector('button, a, input[type="submit"]');
                          if (btn) btn.click();
                          else alert('Payment widget not ready. Please try again in a moment.');
                        } else {
                          alert('Payment widget not available. Please try again.');
                        }
                      } catch (err) {
                        console.warn('Error triggering Razorpay button', err?.message || err);
                        alert('Failed to open payment widget. Please try again.');
                      }
                    }}
                    style={{ 
                      background: 'linear-gradient(-45deg, #FF6B6B, #FF8E53, #FFA07A, #FFB88C)',
                      backgroundSize: '400% 400%',
                      animation: 'gradient 8s ease infinite',
                      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
                    }}
                  >
                    <span className="relative z-10 text-white flex items-center gap-2">
                      Book Now
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-orange-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100"></div>
                  </motion.button>
                ) : (
                  <Link
                    to="/login"
                    className="relative group px-16 py-4 rounded-full font-semibold text-xl overflow-hidden flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(-45deg, #FF6B6B, #FF8E53, #FFA07A, #FFB88C)',
                      backgroundSize: '400% 400%',
                      animation: 'gradient 8s ease infinite',
                      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
                    }}
                  >
                    <span className="relative z-10 text-white flex items-center gap-2">
                      Login to Book
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-orange-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100"></div>
                  </Link>
                )}

                {/* Hidden Razorpay form to host the payment-button script */}
                <div style={{ display: 'none' }} aria-hidden>
                  <form ref={razorpayFormRef} />
                </div>

                <Link
                  to={firstTrip ? `/trips/${firstTrip.id}` : '/trips'}
                  className="relative group bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-200 text-white w-12 h-12 rounded-full font-medium shadow-lg flex items-center justify-center overflow-hidden"
                  style={{ boxShadow: '0 8px 20px rgba(251, 191, 36, 0.2)' }}
                >
                  <motion.span 
                    className="relative z-10 transition-transform duration-300"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-100 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </Link>
              </div>
              
              {/* Bottom Navigation Buttons */}
              <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link
                  to="/contact"
                  className="relative group bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-lg overflow-hidden"
                >
                  <motion.span 
                    className="relative z-10 flex items-center gap-2"
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Us
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-180"></div>
                </Link>

                <Link
                  to="/trips"
                  className="relative group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white px-6 py-3 rounded-full font-medium shadow-lg overflow-hidden"
                >
                  <motion.span 
                    className="relative z-10 flex items-center gap-2"
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Explore Trips
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-180"></div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Featured Trips section (driven by admin) */}
        <section className="max-w-7xl mx-auto px-4 mt-8 pb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Trips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTrips && featuredTrips.length > 0 ? (
              // Show priority trips first
              [...featuredTrips].sort((a,b) => (b.priority === true) - (a.priority === true)).slice(0,6).map((t) => (
                <div key={t.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                  <Link to={`/trips/${t.id}`} className="block h-48 overflow-hidden">
                    <img src={t.imageIds?.[0] ? getTripImageUrl(t.imageIds[0]) : heroImgFallback} className="w-full h-full object-cover" alt={t.title} />
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{t.title}</h3>
                      {t.priority && <div className="text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded">PRIORITY</div>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{t.date || 'Flexible dates'}</div>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/trips/${t.id}`} className="px-3 py-2 bg-gray-100 rounded">Details</Link>
                      <Link to={`/trips/${t.id}`} className="px-3 py-2 bg-blue-600 text-white rounded">Book</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-600">No featured trips yet. Add trips in the Admin panel and mark them as priority.</div>
            )}
          </div>
        </section>
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl mix-blend-screen"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl mix-blend-screen"></div>
      </section>
    </div>
  );
}
