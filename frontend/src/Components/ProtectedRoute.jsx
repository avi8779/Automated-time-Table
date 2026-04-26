import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/* Usage:
   <ProtectedRoute>                     → any logged-in user
   <ProtectedRoute roles={["admin"]}>   → admin only
*/
export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();

  if (!ready) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse">Loading…</div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}