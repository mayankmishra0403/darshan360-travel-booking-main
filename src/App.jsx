import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
const HomePage = lazy(() => import('./pages/HomePage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
import AuthProvider from "./context/AuthContext";
import { useAuth } from "./context/auth";
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TripDetailsPage = lazy(() => import('./pages/TripDetailsPage'));
const StopDetailsPage = lazy(() => import('./pages/StopDetailsPage'));
const HotelsPage = lazy(() => import('./pages/HotelsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';


function Nav() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isHome = location?.pathname === '/';
  return (
    <nav
      className={
        (isHome
          ? 'absolute inset-x-0 top-0 z-50 bg-transparent shadow-none border-0'
          : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50')
      }
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label="Home">
            <div
              className={
                'w-8 h-8 rounded-lg flex items-center justify-center ' +
                (isHome ? 'bg-white/20' : 'bg-gradient-to-r from-blue-600 to-purple-600')
              }
            >
              <span className={isHome ? 'text-white font-bold text-sm' : 'text-white font-bold text-sm'}>D</span>
            </div>
            {/* Brand text removed per request; logo retained */}
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={
                (isHome ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-blue-600') +
                ' font-medium transition-colors'
              }
            >
              Explore
            </Link>
            <Link
              to="/trips"
              className={
                (isHome ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-blue-600') +
                ' font-medium transition-colors'
              }
            >
              Destinations
            </Link>
            {user && (
              <>
                <Link
                  to="/bookings"
                  className={(isHome ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-blue-600') + ' font-medium transition-colors'}
                >
                  My Trips
                </Link>
                {/* Hotels tab removed per request */}
                <Link
                  to="/contact"
                  className={(isHome ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-blue-600') + ' font-medium transition-colors'}
                >
                  Contact Us
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={(isHome ? 'text-white hover:text-gray-200' : 'text-orange-600 hover:text-orange-700') + ' font-medium transition-colors'}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/profile"
                  className={(isHome ? 'flex items-center space-x-2 text-white hover:text-gray-200' : 'flex items-center space-x-2 text-gray-700 hover:text-blue-600') + ' transition-colors'}
                >
                  <div className={(isHome ? 'w-8 h-8 bg-white/20' : 'w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500') + ' rounded-full flex items-center justify-center'}>
                    <span className="text-white text-sm font-semibold">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                  <span className={(isHome ? 'hidden sm:block font-medium text-white' : 'hidden sm:block font-medium')}>{user.name}</span>
                </Link>
                {/* Logout moved to Profile page - users should sign out from their profile */}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={(isHome ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-blue-600') + ' font-medium transition-colors'}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={(isHome ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white') + ' px-4 py-2 rounded-lg font-semibold transition-all duration-200'}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailsPage />} />
  <Route path="/stops/:id" element={<StopDetailsPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AdminPage />
              </AdminOnly>
            </ProtectedRoute>
          }
        />
  <Route path="/hotels" element={<HotelsPage />} />
  <Route path="/contact" element={<ContactUsPage />} />
      </Routes>
    </AnimatePresence>
  );
}

// ...existing code...
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <Nav />
          <ScrollToTop />
          <main>
            <Suspense fallback={<div className="p-6">Loading...</div>}>
              <AnimatedRoutes />
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AdminOnly({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  return isAdmin ? children : <Navigate to="/" replace />;
}

AdminOnly.propTypes = { children: PropTypes.node };
