import { motion } from 'framer-motion';
import heroImgFallback from '../../WhatsApp Image 2025-08-18 at 16.38.24_c7950d41.jpg';
import { useEffect, useState } from 'react';
import { listTrips } from '../services/trips';
import { getTripImageUrl } from '../services/trips';

export default function HomePage() {
  const [bg, setBg] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const trips = await listTrips();
        const first = Array.isArray(trips) && trips.length ? trips[0] : null;
        const imgId = first?.imageIds?.[0];
        const url = imgId ? getTripImageUrl(imgId) : null;
        if (mounted) setBg(url || heroImgFallback);
      } catch (e) {
        if (mounted) setBg(heroImgFallback);
      }
    }
    load();
    return () => (mounted = false);
  }, []);
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
        <div className="relative max-w-7xl mx-auto px-4 pt-24 sm:pt-28">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-white">
              <span className="relative inline-block">
                Explore the timeless{' '}
                <span style={{ fontFamily: "'Kalam', cursive", fontSize: '1.2em', color: '#fbbf24', textShadow: '2px 2px 12px rgba(0,0,0,1)' }}>
                  तपोभूमि
                </span>{' '}of
                <br />
                <span style={{ fontFamily: "'Kalam', cursive", fontSize: '1.2em', color: '#ffe066', textShadow: '2px 2px 12px rgba(0,0,0,1)' }}>
                  श्री राम
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] w-[120%] h-6 pointer-events-none z-[-1] animate-fire-glow" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Handpicked destinations, expert local guides, and seamless booking experiences. 
              Turn your travel dreams into unforgettable memories.
            </p>
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
                    placeholder="Search destinations, experiences, or adventures..." 
                    className="w-full bg-transparent text-white placeholder-white/70 focus:outline-none text-lg"
                    onChange={() => {}}
                  />
                </div>
                <a href="/trips" className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105">
                  Explore Destinations
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl mix-blend-screen"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl mix-blend-screen"></div>
      </section>
    </div>
  );
}
