// src/components/ProtectedRoute.jsx
// ---------------------------------------------------------------------------
// Wraps any route that requires authentication.
// - While Firebase resolves the session: shows a loading screen.
// - If no user: redirects to /login, preserving the intended destination.
// - If signed in: renders children.
// ---------------------------------------------------------------------------

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="dark bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
            flight_takeoff
          </span>
          <p className="text-on-surface-variant font-label-sm text-label-sm">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass the current path so we can redirect back after login if needed.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
