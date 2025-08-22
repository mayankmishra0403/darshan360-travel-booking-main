import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { motion } from 'framer-motion';

export default function Navigation() {
  const { user } = useAuth();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/darshan.png" alt="Darshan 360" className="w-8 h-8 object-cover rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Darshan 360
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Explore
            </Link>
            <Link 
              to="/trips" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Destinations
            </Link>
            {user && (
              <>
                <Link 
                  to="/bookings" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  My Trips
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Contact Us
                </Link>
              </>
            )}
            {/* Future launch link (non-functional placeholder for future self-hosting) */}
            <a
              href="https://darshan360.in.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 italic hover:text-gray-600"
              title="Future launch (placeholder)"
            >
              darshan360.in.net
            </a>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block font-medium">{user.name}</span>
                </Link>
                {/* Logout moved to Profile page - users should sign out from their profile */}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}