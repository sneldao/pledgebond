import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSession } from "@/lib/session";

/**
 * ProtectedRoute
 *  - When ENABLE_AUTH is ON: requires a logged-in user; redirects to /login otherwise.
 *  - When ENABLE_AUTH is OFF (demo mode): passes through if a display-name session exists,
 *    otherwise redirects to the role-picker landing.
 */
export function ProtectedRoute({ children, requireSessionInDemo = true }) {
  const { isAuthenticated, loading, authEnabled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #FBF2E3 0%, #F2E6D1 100%)" }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#C49A3A] border-t-transparent mb-4" />
          <p className="font-serif-display text-ink-600">Consulting the ledger…</p>
        </div>
      </div>
    );
  }

  if (authEnabled) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Demo mode
  if (requireSessionInDemo) {
    const session = getSession();
    if (!session) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }
  return children;
}

export default ProtectedRoute;
