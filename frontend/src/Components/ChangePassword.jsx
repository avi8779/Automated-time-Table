import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../Helper/axiosInstance";
import { useAuth } from "../context/useAuth";
import { toast } from "react-toastify";

export default function ChangePassword() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    if (form.newPassword !== form.confirm) {
      toast.error("Passwords do not match"); return;
    }
    setLoading(true);
    try {
      await axiosInstance.put("/notify/change-password", { newPassword: form.newPassword });
      toast.success("Password changed successfully!");

      // Update user in context — clear mustChangePassword flag
      const updatedUser = { ...user, mustChangePassword: false };
      login(updatedUser, token);

      // Redirect to correct dashboard
      if (user.role === "admin")         navigate("/");
      else if (user.role === "teacher")  navigate("/my-timetable");
      else                               navigate("/my-timetable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-slate-100">Change Password</h1>
          <p className="text-slate-400 text-sm mt-2">
            Hi <span className="text-emerald-400 font-semibold">{user?.name}</span>,
            you need to set a new password before continuing.
          </p>
        </div>

        <div className="bg-slate-900 border border-amber-700/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-amber-900/20 rounded-lg">
            <span>⚠️</span>
            <p className="text-xs text-amber-300">Your temporary password must be changed before you can access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button type="button" onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm">
                  {showNew ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Password strength */}
              {form.newPassword && (
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map((n) => (
                    <div key={n} className={`h-1 flex-1 rounded ${
                      form.newPassword.length >= n * 3
                        ? n <= 1 ? "bg-red-500" : n <= 2 ? "bg-amber-500" : n <= 3 ? "bg-blue-500" : "bg-emerald-500"
                        : "bg-slate-700"
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showCon ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border text-slate-100 text-sm focus:outline-none ${
                    form.confirm && form.confirm !== form.newPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-700 focus:border-emerald-500"
                  }`}
                />
                <button type="button" onClick={() => setShowCon((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm">
                  {showCon ? "🙈" : "👁️"}
                </button>
              </div>
              {form.confirm && form.confirm !== form.newPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !form.newPassword || !form.confirm}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors disabled:opacity-40 mt-2"
            >
              {loading ? "Changing…" : "Set New Password & Continue →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}