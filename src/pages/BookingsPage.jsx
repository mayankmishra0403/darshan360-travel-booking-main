import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { listBookingsByUser } from '../services/bookings';
import { motion } from 'framer-motion';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Adventures</h1>
          <p className="text-lg text-gray-600">Track your bookings and upcoming journeys</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading your trips...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🧳</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No trips booked yet</h3>
            <p className="text-gray-600 mb-8">Start your adventure by exploring our amazing destinations</p>
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Explore Destinations
            </motion.a>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {items.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl">{getStatusIcon(booking.status)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.tripTitle || `Trip ${booking.tripId}`}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Booking ID: {booking.id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {booking.date ? new Date(booking.date).toLocaleDateString() : 'Date TBD'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      View Details
                    </motion.button>
                    {booking.status === 'paid' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Download Ticket
                      </motion.button>
                    )}
                    {booking.status === 'failed' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Retry Payment
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
