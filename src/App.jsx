import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import HomePage from "./pages/HomePage";
import TripsPage from "./pages/TripsPage";
import BookingsPage from "./pages/BookingsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthProvider from "./context/AuthContext";
import { useAuth } from "./context/auth";
import AdminPage from "./pages/AdminPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';

function Nav() {
  const { user, isAdmin, logout } = useAuth();
  return (
    <nav className="flex items-center justify-between p-4 shadow bg-white">
  <Link to="/" className="text-xl font-semibold">Darshan 360</Link>
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/trips">Trips</Link>
        {user && <Link to="/bookings">My Bookings</Link>}
        {isAdmin && <Link to="/admin" className="text-blue-700">Admin Panel</Link>}
        {user ? (
          <>
            <Link to="/profile">Profile</Link>
            <button onClick={logout} className="text-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
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
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
  <ScrollToTop />
        <AnimatedRoutes />
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
