import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Unauthorized() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-5xl">🚫</div>
        <h1 className="text-xl font-bold text-slate-100">Access Denied</h1>
        <p className="text-slate-400 text-sm">
          You don't have permission to view this page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
          >
            Go Back
          </button>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}