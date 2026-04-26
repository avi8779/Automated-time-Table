import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const SELECT_CLS = "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40";

function TeacherSubject() {
  const [teachers,    setTeachers]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections,    setSections]    = useState([]);
  const [allMappings, setAllMappings] = useState([]);
  const [loadingAll,  setLoadingAll]  = useState(false);

  // Form state
  const [form, setForm] = useState({
    teacher_id:     "",
    department_id:  "",
    subject_id:     "",
    section_id:     "",
    priority:       "1",
    can_substitute: "0",
  });
  const [assigning, setAssigning] = useState(false);

  // View/filter state
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Load master data once
  useEffect(() => {
    Promise.all([
      axiosInstance.get("/teachers"),
      axiosInstance.get("/subjects"),
      axiosInstance.get("/departments"),
      axiosInstance.get("/sections"),
    ]).then(([t, s, d, sec]) => {
      setTeachers(t.data.data   || t.data   || []);
      setSubjects(s.data.data   || s.data   || []);
      setDepartments(d.data.data || d.data  || []);
      setSections(sec.data.data  || sec.data || []);
    }).catch(() => toast.error("Failed to load master data"));
  }, []);

  const loadAllMappings = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await axiosInstance.get("/teacher-subjects");
      setAllMappings(res.data.data || []);
    } catch {
      toast.error("Failed to load mappings");
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => { loadAllMappings(); }, [loadAllMappings]);

  // Filter subjects by selected department
  const filteredSubjects = form.department_id
    ? subjects.filter((s) => {
        // subjects belong to courses which belong to departments
        // we'll filter by whatever subjects come back — if no dept link show all
        return true; // department filtering happens server-side via course→dept chain
      })
    : subjects;

  // Filter sections by subject's course (via semester match is complex — show all for now)
  const filteredSections = sections;

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.teacher_id || !form.subject_id) {
      toast.error("Teacher and Subject are required");
      return;
    }
    setAssigning(true);
    try {
      await axiosInstance.post("/teacher-subjects", {
        teacher_id:     Number(form.teacher_id),
        subject_id:     Number(form.subject_id),
        section_id:     form.section_id ? Number(form.section_id) : null,
        priority:       Number(form.priority),
        can_substitute: form.can_substitute === "1" ? 1 : 0,
      });
      toast.success("Assignment created successfully");
      setForm({ teacher_id: "", department_id: "", subject_id: "", section_id: "", priority: "1", can_substitute: "0" });
      loadAllMappings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (teacher_id, subject_id, section_id, label) => {
    if (!window.confirm(`Remove assignment: ${label}?`)) return;
    try {
      const url = section_id
        ? `/teacher-subjects/${teacher_id}/${subject_id}/${section_id}`
        : `/teacher-subjects/${teacher_id}/${subject_id}`;
      await axiosInstance.delete(url);
      toast.success("Assignment removed");
      loadAllMappings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    }
  };

  // Filtered mappings for the table
  const visibleMappings = allMappings.filter((m) => {
    if (filterTeacher && String(m.teacher_id) !== String(filterTeacher)) return false;
    if (filterSection && String(m.section_id) !== String(filterSection)) return false;
    return true;
  });

  const selectedTeacherName = teachers.find((t) => String(t.teacher_id) === String(form.teacher_id))?.name;
  const selectedSubjectName = subjects.find((s) => String(s.subject_id) === String(form.subject_id))?.subject_name;
  const selectedSectionName = sections.find((s) => String(s.section_id) === String(form.section_id))?.section_name;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teacher → Subject → Section</h1>
          <p className="text-slate-400 text-sm mt-1">
            Assign which teacher teaches which subject to which section
          </p>
        </div>

        {/* ── Assignment Form ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
            New Assignment
          </h2>

          <form onSubmit={handleAssign}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Teacher */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Teacher <span className="text-red-400">*</span></label>
                <select value={form.teacher_id} onChange={(e) => setField("teacher_id", e.target.value)} className={SELECT_CLS}>
                  <option value="">Select teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Department</label>
                <select value={form.department_id} onChange={(e) => setField("department_id", e.target.value)} className={SELECT_CLS}>
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.depart_id} value={d.depart_id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Subject <span className="text-red-400">*</span></label>
                <select value={form.subject_id} onChange={(e) => setField("subject_id", e.target.value)} className={SELECT_CLS}>
                  <option value="">Select subject…</option>
                  {filteredSubjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_name} ({s.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Section <span className="text-slate-500 text-xs font-normal">(optional — leave blank for any section)</span>
                </label>
                <select value={form.section_id} onChange={(e) => setField("section_id", e.target.value)} className={SELECT_CLS}>
                  <option value="">Any section</option>
                  {filteredSections.map((s) => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.section_name} — Sem {s.semester}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setField("priority", e.target.value)} className={SELECT_CLS}>
                  <option value="1">1 — Primary</option>
                  <option value="2">2 — Secondary</option>
                  <option value="3">3 — Substitute</option>
                </select>
              </div>

              {/* Can substitute */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Can Substitute?</label>
                <select value={form.can_substitute} onChange={(e) => setField("can_substitute", e.target.value)} className={SELECT_CLS}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

            </div>

            {/* Preview + Submit */}
            <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
              {form.teacher_id && form.subject_id && (
                <p className="text-xs text-slate-400">
                  Assigning{" "}
                  <span className="text-emerald-400 font-semibold">{selectedTeacherName}</span>
                  {" → "}
                  <span className="text-blue-400 font-semibold">{selectedSubjectName}</span>
                  {form.section_id && <>{" → "}<span className="text-violet-400 font-semibold">{selectedSectionName}</span></>}
                </p>
              )}
              <button
                type="submit"
                disabled={assigning}
                className="ml-auto px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Mappings Table ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              All Assignments
              <span className="ml-2 text-slate-600 normal-case tracking-normal">
                ({visibleMappings.length} of {allMappings.length})
              </span>
            </h2>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All teachers</option>
                {teachers.map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>
                ))}
              </select>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                ))}
              </select>
              {(filterTeacher || filterSection) && (
                <button
                  onClick={() => { setFilterTeacher(""); setFilterSection(""); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loadingAll ? (
            <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
          ) : visibleMappings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No assignments found.</div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-slate-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Teacher</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Section</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Substitute</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMappings.map((m) => (
                    <tr
                      key={`${m.teacher_id}-${m.subject_id}-${m.section_id ?? "null"}`}
                      className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-200">{m.teacher_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-slate-100">{m.subject_name}</span>
                        <span className="ml-1.5 text-xs font-mono text-emerald-400">{m.subject_code}</span>
                        {m.is_lab ? <span className="ml-1.5 text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded">Lab</span> : null}
                      </td>
                      <td className="px-4 py-3">
                        {m.section_name
                          ? <span className="text-violet-300">{m.section_name} <span className="text-slate-500 text-xs">Sem {m.semester}</span></span>
                          : <span className="text-slate-500 text-xs italic">Any section</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{m.department_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          m.priority === 1 ? "bg-emerald-900/50 text-emerald-300" :
                          m.priority === 2 ? "bg-amber-900/50 text-amber-300" :
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {m.priority === 1 ? "Primary" : m.priority === 2 ? "Secondary" : "Substitute"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.can_substitute
                          ? <span className="text-xs text-emerald-400">✓ Yes</span>
                          : <span className="text-xs text-slate-600">No</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemove(
                            m.teacher_id, m.subject_id, m.section_id,
                            `${m.teacher_name} → ${m.subject_name}${m.section_name ? ` → ${m.section_name}` : ""}`
                          )}
                          className="px-3 py-1 rounded text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherSubject;