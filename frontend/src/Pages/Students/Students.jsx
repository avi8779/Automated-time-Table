import { useEffect, useState } from "react";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

export default function Students() {
  const [students,   setStudents]   = useState([]);
  const [sections,   setSections]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ name: "", email: "", roll_number: "", password: "", section_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/auth/students"),
      axiosInstance.get("/sections"),
    ]).then(([s, sec]) => {
      setStudents(s.data.data || []);
      setSections(sec.data.data || []);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.roll_number || !form.password || !form.section_id)
      return toast.error("All fields required");
    setSubmitting(true);
    try {
      await axiosInstance.post("/auth/students", { ...form, section_id: Number(form.section_id) });
      toast.success("Student created");
      setForm({ name: "", email: "", roll_number: "", password: "", section_id: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"?`)) return;
    try {
      await axiosInstance.delete(`/auth/students/${id}`);
      toast.success("Student deleted");
      setStudents((s) => s.filter((x) => x.student_id !== id));
    } catch {
      toast.error("Failed to delete student");
    }
  };

  return (
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Students</h1>
            <p className="text-slate-600 text-sm mt-1">Manage student accounts and section assignments</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="app-primary-btn px-4 py-2 rounded-xl font-semibold text-sm"
          >
            {showForm ? "Cancel" : "+ Add Student"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="app-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">New Student</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "name",        label: "Full Name",    type: "text"     },
                { name: "email",       label: "Email",        type: "email"    },
                { name: "roll_number", label: "Roll Number",  type: "text"     },
                { name: "password",    label: "Password",     type: "password" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.name]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    className="app-input w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Section</label>
                <select
                  value={form.section_id}
                  onChange={(e) => setForm((p) => ({ ...p, section_id: e.target.value }))}
                  className="app-input w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">— select section —</option>
                  {sections.map((s) => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.section_name} — Sem {s.semester}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="app-primary-btn px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="app-panel rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No students yet. Add one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Roll Number</th>
                  <th className="text-left px-5 py-3">Section</th>
                  <th className="text-left px-5 py-3">Course</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-teal-50/35 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-200">{s.name}</td>
                    <td className="px-5 py-3 text-slate-400">{s.email}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono">{s.roll_number}</td>
                    <td className="px-5 py-3 text-slate-400">{s.section_name}</td>
                    <td className="px-5 py-3 text-slate-400">{s.course_name}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.student_id, s.name)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
