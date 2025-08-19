import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { getTrip, getTripImageUrls, getStopImageUrl, listStopsByTrip, getTripVideoUrl } from '../services/trips';

import PlaceAmenities from '../components/PlaceAmenities';
import StopsGrid from '../components/StopsGrid';
import { getHotelsForPlace } from '../services/hotels';
import { getRestaurantsForPlace } from '../services/restaurants';
import { getFoodsForPlace } from '../services/foods';

export default function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef(null);

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
  useEffect(() => {
    (async () => {
      try {
        if (trip?.id) {
          const s = await listStopsByTrip(trip.id);
          setStops(s);
        }
      } catch (e) { console.error(e); }
    })();
  }, [trip?.id]);


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

  // If the trip has an admin-uploaded video, use that as the only slide
  const tripVideoUrl = trip?.videoId ? getTripVideoUrl(trip.videoId) : null;
  // Debug logging to help identify why video may not be playing
  if (trip?.videoId) {
    console.info('Trip has video file id:', trip.videoId, 'built view url:', tripVideoUrl);
  }

  // Hero image (first trip image) or video
  const heroImageId = Array.isArray(trip.imageIds) && trip.imageIds.length > 0 ? trip.imageIds[0] : null;
  const mainImageUrl = heroImageId ? getStopImageUrl(heroImageId) : (imgs[0] || null);

  return (
    <div className="max-w-6xl mx-auto p-4">
  {/* Full-bleed background slider with sliding */}
      <section className="relative h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-md">
        {/* Floating background bubbles */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-gradient-to-br from-blue-300 via-purple-200 to-orange-200 opacity-40 animate-bubble${i % 3}`}
              style={{
                width: `${18 + Math.random() * 24}px`,
                height: `${18 + Math.random() * 24}px`,
                left: `${Math.random() * 90}%`,
                bottom: `${Math.random() * 80}%`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
                <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  {tripVideoUrl ? (
                    // Poster with play button
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40">
                      {mainImageUrl ? (
                        <img src={mainImageUrl} alt={trip.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.6)' }} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-black/60 to-black/30" />
                      )}
                      <button
                        onClick={() => setShowVideoModal(true)}
                        className="absolute z-30 flex items-center justify-center rounded-full bg-white/90 hover:bg-white p-4 shadow-lg"
                        aria-label="Play video"
                        style={{ width: 96, height: 96 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000" width="36" height="36">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      {!tripVideoUrl && (
                        <div className="absolute z-40 text-white">Video not available</div>
                      )}
                    </div>
                  ) : mainImageUrl ? (
                    <img src={mainImageUrl} alt={trip.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.97) saturate(1.15)' }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center" />
                  )}

                  {/* Modal video player (unchanged) */}
                  {showVideoModal && tripVideoUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/80" onClick={() => {
                        videoRef.current?.pause?.();
                        setShowVideoModal(false);
                      }} />
                      <div className="relative z-60 max-w-5xl w-full h-[80vh] bg-black rounded overflow-hidden">
                        <button onClick={() => {
                          videoRef.current?.pause?.();
                          setShowVideoModal(false);
                        }} className="absolute right-3 top-3 z-70 bg-white/80 rounded-full p-1">✕</button>
                        <video
                          ref={videoRef}
                          controls
                          autoPlay
                          playsInline
                          src={tripVideoUrl}
                          className="w-full h-full object-contain bg-black"
                        />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
                </div>
        {/* Content overlay */}
        <div className="relative z-20 h-full flex flex-col justify-end p-6 sm:p-10 text-white">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
              {current?.kind === 'trip' ? 'Trip' : 'Stop'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow">
              {current?.title || trip.title}
            </h1>
            {current?.description && (
              <p className="mt-2 text-sm sm:text-base opacity-95">
                {current.description}
              </p>
            )}
          </div>
          {/* Controls (hidden when single video slide present) */}
          {slides.length > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prev}
                className="bg-white/20 hover:bg-gradient-to-r hover:from-blue-400 hover:via-purple-400 hover:to-orange-300 text-white px-4 py-2 rounded-full border-2 border-transparent hover:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-200 shadow-lg hover:shadow-2xl"
                style={{ boxShadow: '0 0 8px 2px #a78bfa, 0 0 16px 4px #fbbf24, 0 0 4px 1px #60a5fa' }}
              >
                ◀ Prev
              </button>
              <div className="text-sm opacity-90">{slides.length > 0 ? `${index + 1} / ${slides.length}` : '0 / 0'}</div>
              <button
                onClick={next}
                className="bg-white/20 hover:bg-gradient-to-r hover:from-blue-400 hover:via-purple-400 hover:to-orange-300 text-white px-4 py-2 rounded-full border-2 border-transparent hover:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-200 shadow-lg hover:shadow-2xl"
                style={{ boxShadow: '0 0 8px 2px #a78bfa, 0 0 16px 4px #fbbf24, 0 0 4px 1px #60a5fa' }}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      </section>
      {/* Basic trip meta under the slider */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Trip:</span> {trip.title}</div>
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Date:</span> {trip.date || 'Flexible'}</div>
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Price:</span> ₹{trip.price}</div>
      </div>
  {/* Amenities Section for this place */}
  <StopsGrid stops={stops} />
  <PlaceAmenities hotels={hotels} restaurants={restaurants} foods={foods} />
    </div>
  );
}
