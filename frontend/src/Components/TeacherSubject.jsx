import { useEffect, useState } from "react";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

function TeacherSubject() {
  const [teachers,        setTeachers]        = useState([]);
  const [subjects,        setSubjects]        = useState([]);
  const [mappings,        setMappings]        = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [viewTeacherId,   setViewTeacherId]   = useState("");
  const [loading,         setLoading]         = useState(false);
  const [assigning,       setAssigning]       = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          axiosInstance.get("/teachers"),
          axiosInstance.get("/subjects"),
        ]);
        setTeachers(tRes.data.data || []);
        setSubjects(sRes.data.data || []);
      } catch {
        toast.error("Failed to load teachers/subjects");
      }
    };
    fetchData();
  }, []);

  const loadMappings = async (teacherId) => {
    if (!teacherId) { setMappings([]); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/teacher-subjects/teacher/${teacherId}`);
      setMappings(res.data.data || []);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMappings(viewTeacherId); }, [viewTeacherId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSubject) {
      toast.error("Please select both a teacher and a subject");
      return;
    }
    setAssigning(true);
    try {
      await axiosInstance.post("/teacher-subjects", {
        teacher_id: Number(selectedTeacher),
        subject_id: Number(selectedSubject),
      });
      toast.success("Subject assigned successfully");
      setSelectedSubject("");
      if (String(viewTeacherId) === String(selectedTeacher)) {
        loadMappings(selectedTeacher);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  // DELETE uses /teacher_id/subject_id — matches the actual table's composite PK
  const handleRemove = async (teacher_id, subject_id, subjectName) => {
    if (!window.confirm(`Remove "${subjectName}" from this teacher?`)) return;
    try {
      await axiosInstance.delete(`/teacher-subjects/${teacher_id}/${subject_id}`);
      toast.success("Assignment removed");
      setMappings((prev) =>
        prev.filter((m) => !(m.teacher_id === teacher_id && m.subject_id === subject_id))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    }
  };

  const selectedTeacherName =
    teachers.find((t) => String(t.teacher_id) === String(viewTeacherId))?.name || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teacher ↔ Subject</h1>
          <p className="text-slate-400 text-sm mt-1">
            Assign subjects to teachers so they can be scheduled in the timetable
          </p>
        </div>

        {/* Assign Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Assign Subject to Teacher
          </h2>
          <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select teacher…</option>
                {teachers.map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>
                    {t.name} ({t.teacher_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name} ({s.subject_code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={assigning}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {assigning ? "Assigning…" : "Assign"}
            </button>
          </form>
        </div>

        {/* View assignments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            View Assignments by Teacher
          </h2>

          <div className="mb-4">
            <label className="text-xs text-slate-400 block mb-1">Select Teacher</label>
            <select
              value={viewTeacherId}
              onChange={(e) => setViewTeacherId(e.target.value)}
              className="w-72 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.name} ({t.teacher_code})
                </option>
              ))}
            </select>
          </div>

          {viewTeacherId && (
            loading ? (
              <div className="py-10 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
            ) : mappings.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                No subjects assigned to <span className="text-slate-300">{selectedTeacherName}</span> yet.
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Hrs/Wk</th>
                      <th className="px-4 py-3 text-left">Lab</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m) => (
                      <tr
                        key={`${m.teacher_id}-${m.subject_id}`}
                        className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{m.subject_code}</td>
                        <td className="px-4 py-3">{m.subject_name}</td>
                        <td className="px-4 py-3 text-slate-400">{m.course_name}</td>
                        <td className="px-4 py-3 text-slate-400">{m.weekly_hours}</td>
                        <td className="px-4 py-3">
                          {m.is_lab
                            ? <span className="text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded">Yes</span>
                            : <span className="text-xs text-slate-600">No</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemove(m.teacher_id, m.subject_id, m.subject_name)}
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
            )
          )}
        </div>

      </div>
    </div>
  );
}

export default TeacherSubject;