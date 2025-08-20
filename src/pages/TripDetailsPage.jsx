import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getTrip, getTripImageUrls, getStopImageUrl, getStopVideoUrl, getTripVideoUrl, listStopsByTrip } from '../services/trips';
// Local fallback video (used when server fetch not available)
import localDemoVideo from '../../VN20250817_175526.mp4';
import { createBookingWithIdFallback } from '../services/bookings';
import { createPaymentWithId } from '../services/payments';
import './TripDetailsPage.css';

import PlaceAmenities from '../components/PlaceAmenities';
import StopsGrid from '../components/StopsGrid';
import { getHotelsForPlace } from '../services/hotels';
import { getRestaurantsForPlace } from '../services/restaurants';
import { getFoodsForPlace } from '../services/foods';

export default function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const isFirstRender = useRef(true);
  const location = useLocation();
  // Auth
  const { isAdmin, user } = useAuth();
  
  // Dynamic styling states
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTheme, setCurrentTheme] = useState('blue');
  const containerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await getTrip(id);
        setTrip(t);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const [stops, setStops] = useState([]);
  const [fallbackVideoSrc, setFallbackVideoSrc] = useState(null);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);

  // Try to programmatically play a video element by id; if browser blocks autoplay with sound
  // we'll show a UI button to let the user start playback with audio.
  const tryPlayVideo = (videoId) => {
    try {
      const v = document.getElementById(videoId);
      if (!v) return;
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setNeedsUserPlay(false)).catch(() => setNeedsUserPlay(true));
      }
    } catch (e) {
      console.warn('play attempt failed', e);
      setNeedsUserPlay(true);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        if (trip?.id) {
          const s = await listStopsByTrip(trip.id);
          console.info('Loaded stops for trip', trip.id, s);
          setStops(s);
        }
      } catch (e) { console.error(e); }
    })();
  }, [trip?.id]);

  // If the page is opened with a ?focus=<stopId> parameter, jump to that stop's slide.
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const focus = params.get('focus') || params.get('stopId');
      if (focus && stops && stops.length) {
        const idx = stops.findIndex((s) => s.id === focus);
        if (idx >= 0) {
          // slides array has hero at index 0, stops start at index 1
          setIndex(idx + 1);
          isFirstRender.current = false;
        }
      }
    } catch (err) { console.error(err); }
  }, [location.search, stops]);

  // Dynamic theme colors based on slide content
  const themes = useMemo(() => ({
    blue: {
      primary: 'from-blue-400 to-cyan-400',
      secondary: 'from-blue-100 to-cyan-100',
      accent: 'blue-500',
      shadow: 'shadow-blue-200/50',
      glow: 'ring-blue-300'
    },
    purple: {
      primary: 'from-purple-400 to-pink-400',
      secondary: 'from-purple-100 to-pink-100',
      accent: 'purple-500',
      shadow: 'shadow-purple-200/50',
      glow: 'ring-purple-300'
    },
    orange: {
      primary: 'from-orange-400 to-red-400',
      secondary: 'from-orange-100 to-red-100',
      accent: 'orange-500',
      shadow: 'shadow-orange-200/50',
      glow: 'ring-orange-300'
    },
    green: {
      primary: 'from-green-400 to-emerald-400',
      secondary: 'from-green-100 to-emerald-100',
      accent: 'green-500',
      shadow: 'shadow-green-200/50',
      glow: 'ring-green-300'
    }
  }), []);

  // Change theme based on slide index or content
  useEffect(() => {
    const themeKeys = Object.keys(themes);
    const newTheme = themeKeys[index % themeKeys.length];
    setCurrentTheme(newTheme);
  }, [index, themes]);

  // Mouse tracking for dynamic effects
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100
      });
    }
  };

  const currentThemeColors = themes[currentTheme];


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // Debug: if stops are empty show a visible hint and admin link (visible only to admins)
  const renderStopsGrid = () => {
    if (!stops || stops.length === 0) {
      return (
        <div className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          No places found for this trip.
          {isAdmin && (
            <div className="mt-2"><a href="/admin" className="text-sm text-blue-600 underline">Open Admin panel</a></div>
          )}
        </div>
      );
    }
    return <StopsGrid stops={stops} />;
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <p className="text-gray-600 mb-6">This adventure seems to have wandered off the map</p>
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Explore Other Trips
          </Link>
        </div>
      </div>
    );
  }


  // Get amenities for the main place (trip.title)
  const hotels = getHotelsForPlace(trip.title);
  const restaurants = getRestaurantsForPlace(trip.title);
  const foods = getFoodsForPlace(trip.title);

  const imgs = getTripImageUrls(trip.imageIds);

  // Build slides: first slide is the Trip hero; remaining slides are stops
  const heroImageId = Array.isArray(trip.imageIds) && trip.imageIds.length > 0 ? trip.imageIds[0] : null;
  const heroVideoId = trip.videoId || null;
  const slides = [
    {
      kind: 'trip',
      title: trip.title,
      description: trip.description || `Experience ${stops.length} amazing destinations on this journey`,
      imageId: heroImageId,
      videoId: heroVideoId,
      isMainSlide: true,
    },
    ...stops.map((s) => ({
      kind: 'stop',
      title: s.name,
      description: s.description,
      imageId: s.imageId,
      videoId: s.videoId,
      isMainSlide: false,
    })),
  ];

  const current = slides[index] || null;

  // slide navigation removed — only Book Now CTA remains on the hero slide

  

  return (
    <div 
      ref={containerRef}
      className="max-w-6xl mx-auto p-4 transition-all duration-700"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)`
      }}
    >
      {/* Dynamic background overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isHovering ? 'opacity-20' : 'opacity-10'}`}
        style={{
          background: `linear-gradient(135deg, ${currentThemeColors.secondary})`,
          zIndex: -1
        }}
      />
      
      {/* Full-bleed background slider with sliding */}
      <motion.section 
        className={`relative h-[75vh] sm:h-[85vh] md:h-[75vh] rounded-2xl overflow-hidden transition-all duration-500 ${currentThemeColors.shadow} hover:shadow-2xl`}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Enhanced floating background bubbles with dynamic colors */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full bg-gradient-to-br ${currentThemeColors.primary} opacity-30`}
              style={{
                width: `${15 + Math.random() * 30}px`,
                height: `${15 + Math.random() * 30}px`,
                left: `${Math.random() * 90}%`,
                bottom: `${Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            initial={isFirstRender.current ? false : {
              x: 320,
              opacity: 0,
              scale: 0.92,
              rotate: 8
            }}
            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: { type: 'spring', stiffness: 180, damping: 22, duration: 0.55 }
            }}
            exit={isFirstRender.current ? false : {
              x: -320,
              opacity: 0,
              scale: 0.92,
              rotate: -8,
              transition: { type: 'spring', stiffness: 180, damping: 22, duration: 0.45 }
            }}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          >
            {current?.videoId ? (
              <div className="relative w-full h-full">
                <motion.video
                  id={`trip-video-${trip.id || id}`}
                  key={`v-${current.videoId}-${fallbackVideoSrc || 'server'}`}
                  src={
                    // prefer server URL; fall back to localDemoVideo when server URL missing or fallback state is set
                    fallbackVideoSrc || (current.kind === 'trip' ? getTripVideoUrl(current.videoId) : getStopVideoUrl(current.videoId)) || localDemoVideo
                  }
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.97) saturate(1.05)' }}
                  controls
                  autoPlay
                  playsInline
                  loop
                  onCanPlay={() => {
                    // attempt to play with audio; if blocked, show UI button
                    tryPlayVideo(`trip-video-${trip.id || id}`);
                  }}
                  onError={() => {
                    // if the server video fails to load, switch to local fallback
                    if (!fallbackVideoSrc) setFallbackVideoSrc(localDemoVideo);
                  }}
                />
                {/* If browser blocked autoplay with sound, show a user-visible play button overlay */}
                {needsUserPlay && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
                    <button
                      onClick={() => tryPlayVideo(`trip-video-${trip.id || id}`)}
                      className="bg-white/90 text-gray-900 px-6 py-3 rounded-full font-semibold shadow-lg"
                      aria-label="Play video with sound"
                    >
                      ▶ Play with sound
                    </button>
                  </div>
                )}
              </div>
            ) : current?.imageId ? (
              <motion.img
                src={getStopImageUrl(current.imageId)}
                alt={current?.title || trip.title}
                className="w-full h-full object-contain sm:object-cover object-center"
                style={{ filter: 'brightness(0.97) saturate(1.15)' }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            ) : imgs[0] ? (
              <motion.img
                src={imgs[0]}
                alt={trip.title}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.97) saturate(1.15)' }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${currentThemeColors.secondary} flex items-center justify-center`} />
            )}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10"
              animate={{
                background: `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), rgba(0,0,0,0.1))`
              }}
            />
          </motion.div>
        </AnimatePresence>
        {/* Content overlay */}
        <motion.div 
          className="relative z-20 h-full flex flex-col justify-end p-6 sm:p-10 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div className="w-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="text-center">
              {user ? (
                <motion.button
                  onClick={async () => {
                    try {
                      const now = new Date().toISOString();
                      const id = `upi_${Date.now()}`;
                      try {
                        await createBookingWithIdFallback({ id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'pending', date: now });
                        try {
                          await createPaymentWithId({ id, data: { orderId: id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'created', amount: Number(trip.price) * 100, currency: 'INR', date: now } });
                        } catch (e) { console.warn('Payment create fallback failed', e?.message || e); }
                      } catch (e) { console.warn('Book now fallback failed', e?.message || e); }
                      window.open('https://rzp.io/rzp/kPlkKOD', '_blank', 'noopener');
                    } catch (err) { console.error(err); }
                  }}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all"
                >
                  Book Now
                </motion.button>
              ) : (
                <Link to="/login" className="text-[#FD366E] font-medium underline">Login to Book</Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.section>
      {/* Enhanced trip meta cards with dynamic styling */}
      <motion.div 
        className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {[
          { label: 'Trip', value: trip.title, icon: '🗺️' },
          { label: 'Date', value: trip.date || 'Flexible', icon: '📅' },
          { label: 'Price', value: `₹${trip.price}`, icon: '💰' }
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 border border-white/20 hover:${currentThemeColors.shadow} hover:border-white/40`}
            whileHover={{ 
              scale: 1.05, 
              y: -8,
              boxShadow: `0 20px 40px rgba(0,0,0,0.1)`
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <span className={`font-semibold text-${currentThemeColors.accent}`}>{item.label}:</span>
                <p className="text-gray-700 font-medium">{item.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      {/* Enhanced Stops section with dynamic styling */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {renderStopsGrid()}
      </motion.div>

      {/* Enhanced Amenities Section with dynamic styling */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-8"
      >
        <PlaceAmenities hotels={hotels} restaurants={restaurants} foods={foods} />
      </motion.div>
    </div>
  );
}
