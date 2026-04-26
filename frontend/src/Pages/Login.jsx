import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5014/api/v1";

const ROLES = [
  { key: "admin",   label: "Admin",   icon: "🛡️",  color: "emerald" },
  { key: "teacher", label: "Teacher", icon: "👨‍🏫", color: "blue"    },
  { key: "student", label: "Student", icon: "🎓",  color: "violet"  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [role,     setRole]     = useState("admin");
  const [form,     setForm]     = useState({ identifier: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const selectedRole = ROLES.find((r) => r.key === role);

  const placeholders = {
    admin:   "Username",
    teacher: "Email",
    student: "Roll Number",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const body =
        role === "admin"
          ? { username: form.identifier, password: form.password }
          : role === "teacher"
          ? { email: form.identifier, password: form.password }
          : { roll_number: form.identifier, password: form.password };

      const res = await axios.post(`${API}/auth/${role}/login`, body);
      login(res.data.user, res.data.token);
      toast.success(`Welcome, ${res.data.user.name}!`);

      // Redirect by role
      if (role === "admin")   navigate("/");
      if (role === "teacher") navigate("/my-timetable");
      if (role === "student") navigate("/my-timetable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    emerald: { tab: "bg-emerald-500 text-slate-950", ring: "focus:border-emerald-500", btn: "bg-emerald-500 hover:bg-emerald-400 text-slate-950" },
    blue:    { tab: "bg-blue-500 text-white",        ring: "focus:border-blue-500",    btn: "bg-blue-500 hover:bg-blue-400 text-white"           },
    violet:  { tab: "bg-violet-500 text-white",      ring: "focus:border-violet-500",  btn: "bg-violet-500 hover:bg-violet-400 text-white"       },
  };
  const colors = colorMap[selectedRole.color];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗓️</div>
          <h1 className="text-2xl font-bold text-slate-100">Automated Timetable</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* Role tabs */}
          <div className="grid grid-cols-3 border-b border-slate-800">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => { setRole(r.key); setForm({ identifier: "", password: "" }); }}
                className={`py-3.5 text-sm font-semibold transition-colors flex flex-col items-center gap-1
                  ${role === r.key
                    ? colorMap[r.color].tab
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
              >
                <span className="text-lg">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                {placeholders[role]}
              </label>
              <input
                type={role === "teacher" ? "email" : "text"}
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                placeholder={`Enter your ${placeholders[role].toLowerCase()}`}
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none ${colors.ring}`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none ${colors.ring}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors mt-2 disabled:opacity-50 ${colors.btn}`}
            >
              {loading ? "Signing in…" : `Sign in as ${selectedRole.label}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}