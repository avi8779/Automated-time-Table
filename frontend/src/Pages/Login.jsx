import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiBookOpen, FiEye, FiEyeOff, FiShield, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/useAuth";

const API = import.meta.env.VITE_API_URL || "http://localhost:5014/api/v1";

const ROLES = [
  { key: "admin", label: "Admin", icon: FiShield },
  { key: "teacher", label: "Teacher", icon: FiUsers },
  { key: "student", label: "Student", icon: FiBookOpen },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("admin");
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const selectedRole = ROLES.find((r) => r.key === role);
  const placeholders = { admin: "Username", teacher: "Email", student: "Roll Number" };

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
      navigate(role === "admin" ? "/" : "/my-timetable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden items-center justify-center border-r border-slate-200 bg-white/55 px-10 lg:flex">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-xl font-black text-white shadow-lg shadow-teal-100">
              TT
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Automated timetable</p>
            <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight text-slate-950">
              Plan classes with fewer collisions and cleaner control.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              A focused workspace for admins, teachers, and students to manage schedules, sections, rooms, and notifications.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {["Sections", "Teachers", "Rooms"].map((item) => (
                <div key={item} className="app-card rounded-2xl p-4">
                  <p className="text-sm font-bold text-slate-900">{item}</p>
                  <p className="mt-1 text-xs text-slate-500">Managed here</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-7 lg:hidden">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 font-black text-white">
                  TT
                </div>
              <h1 className="text-2xl font-black text-slate-950">Automated Timetable</h1>
            </div>

            <div className="app-panel rounded-3xl p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Sign in</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-600">Choose your role and enter your credentials.</p>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => { setRole(r.key); setForm({ identifier: "", password: "" }); }}
                      className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                        role === r.key
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-slate-200 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      <Icon className="mx-auto mb-1 h-4 w-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {placeholders[role]}
                  </label>
                  <input
                    type={role === "teacher" ? "email" : "text"}
                    value={form.identifier}
                    onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                    placeholder={`Enter ${placeholders[role].toLowerCase()}`}
                    className="app-input w-full rounded-2xl px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Enter password"
                      className="app-input w-full rounded-2xl px-4 py-3 pr-12 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-slate-200"
                    >
                      {showPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="app-primary-btn w-full rounded-2xl py-3 text-sm font-black transition disabled:opacity-50"
                >
                  {loading ? "Signing in..." : `Sign in as ${selectedRole.label}`}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
