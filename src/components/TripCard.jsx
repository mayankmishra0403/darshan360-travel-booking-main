import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTripImageUrl } from '../services/trips';
import { useAuth } from '../context/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { createBookingWithIdFallback } from '../services/bookings';
import { createPaymentWithId } from '../services/payments';

export default function TripCard({ trip, onPay }) {
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const img = getTripImageUrl(trip.imageIds?.[0]);
  const price = trip.price ? `₹${Number(trip.price).toLocaleString()}` : 'Price on request';

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
  className="group relative bg-white rounded-3xl shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent tripcard-illuminated"
  style={{ boxShadow: '0 0 0 0 rgba(0,0,0,0.1)' }}
    >
  {/* Enhanced Image Container */}
  <div className="relative h-64 overflow-hidden z-20">
        {img && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                <div className="text-4xl">🏞️</div>
              </div>
            )}
            <Link to={`/trips/${trip.id}`} className="block w-full h-full">
              <img
                loading="lazy"
                src={img}
                alt={trip.title}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                style={{ filter: 'brightness(0.98) saturate(1.15)' }}
              />
            </Link>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-2">📸</div>
              <div className="text-sm">Image unavailable</div>
            </div>
          </div>
        )}
        
        {/* Enhanced Price Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-2 rounded-full font-bold text-sm shadow-lg">
            {price}
          </div>
        </div>

        {/* New Badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        </div>

  {/* Overlay Gradient */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

  {/* Enhanced Content */}
  <div className="p-6 z-20 relative">
        {/* Title */}
        <h3 className="text-2xl font-extrabold text-gray-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-orange-500 transition-all duration-300">
          <Link to={`/trips/${trip.id}`} className="hover:underline">
            {trip.title}
          </Link>
        </h3>
        
        {/* Date and Location */}
  <div className="flex items-center text-gray-600 text-sm mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {trip.date || 'Flexible dates'}
        </div>


        {/* Stops/Highlights */}
        {Array.isArray(trip.stops) && trip.stops.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 font-medium">Experience Highlights:</div>
            <div className="flex flex-wrap gap-1">
              {trip.stops.slice(0, 3).map((stop, index) => (
                <span
                  key={index}
                  className="inline-block bg-gradient-to-r from-blue-100 via-purple-100 to-orange-100 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200 shadow-sm"
                >
                  {stop}
                </span>
              ))}
              {trip.stops.length > 3 && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  +{trip.stops.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}


        {/* Ratings */}
  <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm ml-2">4.8 (47)</span>
          </div>
          
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
            Available
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.12, boxShadow: '0 0 24px 6px #a78bfa, 0 0 48px 12px #fbbf24, 0 0 16px 4px #60a5fa' }}
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                // ...existing code...
                try {
                  const now = new Date().toISOString();
                  const id = `upi_${Date.now()}`;
                  await createBookingWithIdFallback({ id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'pending', date: now });
                  try {
                    await createPaymentWithId({ id, data: { orderId: id, tripId: trip.id, tripTitle: trip.title, userId: user.$id, status: 'created', amount: Number(trip.price) * 100, currency: 'INR', date: now } });
                  } catch (e) {
                    console.warn('Payment create fallback failed', e?.message || e);
                  }
                } catch (e) {
                  console.warn('Book now fallback failed', e?.message || e);
                }
                window.open('http://razorpay.me/@mayanksoni8625', '_blank', 'noopener');
                onPay?.(trip);
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300"
              style={{ boxShadow: '0 0 16px 2px #a78bfa, 0 0 32px 8px #fbbf24, 0 0 8px 2px #60a5fa' }}
            >
              Book Now
            </motion.button>
          ) : (
            <Link
              to="/login"
              className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 px-4 rounded-xl font-semibold text-center transition-all duration-200 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300"
              style={{ boxShadow: '0 0 16px 2px #a78bfa, 0 0 32px 8px #fbbf24, 0 0 8px 2px #60a5fa' }}
            >
              Login to Book
            </Link>
          )}
          <Link 
            to={`/trips/${trip.id}`}
            className="bg-gray-100 hover:bg-gradient-to-r hover:from-blue-100 hover:via-purple-100 hover:to-orange-100 text-gray-700 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center border border-gray-200 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
  </motion.div>
  );
}

// Animated multi-color glow effect
// Add this to your global CSS (e.g., App.css or index.css):
/*
.animate-glow {
  background: conic-gradient(
    from 0deg,
    #60a5fa 0deg 90deg,
    #a78bfa 90deg 180deg,
    #fbbf24 180deg 270deg,
    #f472b6 270deg 360deg
  );
  filter: blur(12px) brightness(1.2);
  opacity: 0.7;
  animation: glow-rotate 3s linear infinite;
}
@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/

TripCard.propTypes = {
  trip: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    date: PropTypes.string,
    imageIds: PropTypes.arrayOf(PropTypes.string),
    stops: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onPay: PropTypes.func,
};
