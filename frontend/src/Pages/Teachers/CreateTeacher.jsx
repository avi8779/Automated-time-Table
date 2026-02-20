import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTeacher,
  deleteTeacher,
  getAllTeachers,
  updateTeacher,
} from "../../Redux/teacherSlice";

const INIT = {
  teacher_code: "",
  name: "",
  email: "",
  depart_id: "",
  max_hours_per_day: 4,
  max_hours_per_week: 20,
};

function CreateTeacher() {
  const dispatch = useDispatch();
  const { teacherData, loading, error } = useSelector((state) => state.teacher);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INIT);

  useEffect(() => {
    dispatch(getAllTeachers());
  }, [dispatch]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teacherData;
    return teacherData.filter((t) => {
      const code = String(t.teacher_code || "").toLowerCase();
      const name = String(t.name || "").toLowerCase();
      const email = String(t.email || "").toLowerCase();
      return code.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [search, teacherData]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(INIT);
    setModalOpen(true);
  };

  const openEdit = (teacher) => {
    setIsEditing(true);
    setEditingId(teacher.teacher_id);
    setForm({
      teacher_code: teacher.teacher_code || "",
      name: teacher.name || "",
      email: teacher.email || "",
      depart_id: teacher.depart_id || "",
      max_hours_per_day: teacher.max_hours_per_day || 4,
      max_hours_per_week: teacher.max_hours_per_week || 20,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setForm(INIT);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      teacher_code: form.teacher_code.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      depart_id: Number(form.depart_id),
      max_hours_per_day: Number(form.max_hours_per_day),
      max_hours_per_week: Number(form.max_hours_per_week),
    };

    if (isEditing && editingId) {
      await dispatch(updateTeacher({ id: editingId, data: payload }));
    } else {
      await dispatch(createTeacher(payload));
    }
    await dispatch(getAllTeachers());
    closeModal();
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this teacher?");
    if (!ok) return;
    await dispatch(deleteTeacher(id));
    await dispatch(getAllTeachers());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teachers</h1>
            <p className="text-slate-400 text-sm">
              Manage teachers and their availability
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition"
          >
            Add Teacher
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search teacher by code, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && (
            <span className="text-red-400 text-sm">{error}</span>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Depart ID</th>
                  <th className="px-4 py-3 text-left">Max Hrs/Day</th>
                  <th className="px-4 py-3 text-left">Max Hrs/Week</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-400" colSpan={7}>
                      Loading teachers...
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={7}>
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr
                      key={t.teacher_id}
                      className="border-t border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {t.teacher_code}
                      </td>
                      <td className="px-4 py-3">{t.name}</td>
                      <td className="px-4 py-3 text-slate-400">{t.email}</td>
                      <td className="px-4 py-3">{t.depart_id}</td>
                      <td className="px-4 py-3">{t.max_hours_per_day}</td>
                      <td className="px-4 py-3">{t.max_hours_per_week}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.teacher_id)}
                            className="px-3 py-1 rounded-md bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-slate-950 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Update Teacher" : "Add Teacher"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Teacher Code</label>
                  <input
                    name="teacher_code"
                    value={form.teacher_code}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Depart ID</label>
                  <input
                    name="depart_id"
                    type="number"
                    value={form.depart_id}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Max Hours/Day</label>
                  <input
                    name="max_hours_per_day"
                    type="number"
                    min={1}
                    max={6}
                    value={form.max_hours_per_day}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Max Hours/Week</label>
                  <input
                    name="max_hours_per_week"
                    type="number"
                    min={1}
                    max={30}
                    value={form.max_hours_per_week}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400"
                >
                  {isEditing ? "Update Teacher" : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateTeacher;
