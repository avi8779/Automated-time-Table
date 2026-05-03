import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import axiosInstance from "../Helper/axiosInstance";
import { useAuth } from "../context/useAuth";
import { toast } from "react-toastify";

export default function ChangePassword() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put("/notify/change-password", { newPassword: form.newPassword });
      toast.success("Password changed successfully!");
      login({ ...user, mustChangePassword: false }, token);
      navigate(user.role === "admin" ? "/" : "/my-timetable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
            <FiKey className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Change Password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hi <span className="font-semibold text-teal-700">{user?.name}</span>, set a new password before continuing.
          </p>
        </div>

        <div className="app-panel rounded-3xl p-6">
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
            <p className="text-xs leading-5 text-amber-200">Your temporary password must be changed before you can access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="New Password"
              value={form.newPassword}
              onChange={(value) => setForm((f) => ({ ...f, newPassword: value }))}
              visible={showNew}
              onToggle={() => setShowNew((s) => !s)}
              placeholder="At least 6 characters"
            />

            {form.newPassword && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded ${
                      form.newPassword.length >= n * 3
                        ? n <= 1 ? "bg-rose-500" : n <= 2 ? "bg-amber-500" : n <= 3 ? "bg-sky-500" : "bg-emerald-400"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            )}

            <PasswordField
              label="Confirm Password"
              value={form.confirm}
              onChange={(value) => setForm((f) => ({ ...f, confirm: value }))}
              visible={showCon}
              onToggle={() => setShowCon((s) => !s)}
              placeholder="Repeat new password"
              invalid={!!form.confirm && form.confirm !== form.newPassword}
            />

            {form.confirm && form.confirm !== form.newPassword && (
              <p className="text-xs text-rose-300">Passwords do not match</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.newPassword || !form.confirm}
              className="app-primary-btn mt-2 w-full rounded-2xl py-3 text-sm font-black transition disabled:opacity-40"
            >
              {loading ? "Changing..." : "Set New Password and Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, placeholder, invalid }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`app-input w-full rounded-2xl px-4 py-3 pr-12 text-sm ${
            invalid ? "border-rose-400 focus:border-rose-400" : ""
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-slate-200"
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}
