import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSession } from "@/lib/session";
import SealLoader from "@/components/SealLoader";

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
        className="min-h-screen flex items-center justify-center parchment-noise"
        style={{ background: "linear-gradient(180deg, #FBF2E3 0%, #F2E6D1 100%)" }}
      >
        <SealLoader label="Consulting the ledger..." fullPage />
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
