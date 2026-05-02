import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { subjectSlice } from "../../Redux/store";
import axiosInstance from "../../Helper/axiosInstance";

const { getAll, createItem, updateItem, deleteItem } = subjectSlice.actions;

const SEMESTER_OPTIONS  = [1,2,3,4,5,6,7,8].map((n) => ({ value: n, label: `Semester ${n}` }));
const IS_LAB_OPTIONS    = [{ value: 0, label: "No (Theory)" }, { value: 1, label: "Yes (Lab/Practical)" }];
const PREF_SLOT_OPTIONS = [{ value: "ANY", label: "Any" }, { value: "MORNING", label: "Morning" }, { value: "AFTERNOON", label: "Afternoon" }];
const STATUS_OPTIONS    = [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }];

const EMPTY_FORM = {
  subject_code: "", subject_name: "", department_id: "", course_id: "",
  semester: "", weekly_hours: "", credits: "", is_lab: 0,
  preferred_slot: "ANY", status: "ACTIVE",
};

const SELECT_CLS = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40";
const INPUT_CLS  = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500";

const getSubjectCourse = (item, courses) => courses.find((c) =>
  String(c.course_id) === String(item.course_id) ||
  (item.course_name && c.course_name === item.course_name)
);

const getCourseDepartmentId = (item, courses) => {
  const course = getSubjectCourse(item, courses);
  return course?.depart_id ?? item.depart_id ?? item.department_id ?? "";
};

export default function CreateSubject() {
  const dispatch = useDispatch();
  const { data: subjects, loading } = useSelector((s) => s.subject);

  const [departments, setDepartments] = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formError,   setFormError]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterSem,   setFilterSem]   = useState("");
  const [filterLab,   setFilterLab]   = useState("");
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    dispatch(getAll());
    axiosInstance.get("/departments").then((r) => setDepartments(r.data.data || r.data || [])).catch(() => {});
    axiosInstance.get("/courses").then((r) => setCourses(r.data.data || r.data || [])).catch(() => {});
  }, [dispatch]);

  // Filter courses by selected department
  const filteredCourses = useMemo(() =>
    form.department_id
      ? courses.filter((c) => String(c.depart_id) === String(form.department_id))
      : courses,
    [courses, form.department_id]
  );

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEditing || form.department_id || !form.course_id || courses.length === 0) return;
    const course = courses.find((c) => String(c.course_id) === String(form.course_id));
    if (course?.depart_id) setField("department_id", course.depart_id);
  }, [courses, form.course_id, form.department_id, isEditing]);

  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm(EMPTY_FORM); setFormError(null); setModalOpen(true);
  };

  const openEdit = (item) => {
    const course = getSubjectCourse(item, courses);
    setIsEditing(true); setEditingId(item.subject_id);
    setForm({
      subject_code:   item.subject_code   || "",
      subject_name:   item.subject_name   || "",
      department_id:  getCourseDepartmentId(item, courses),
      course_id:      item.course_id || course?.course_id || "",
      semester:       item.semester       || "",
      weekly_hours:   item.weekly_hours   || "",
      credits:        item.credits        || "",
      is_lab:         item.is_lab         ?? 0,
      preferred_slot: item.preferred_slot || "ANY",
      status:         item.status         || "ACTIVE",
    });
    setFormError(null); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_code || !form.subject_name || !form.department_id || !form.course_id || !form.semester || !form.weekly_hours || !form.credits) {
      setFormError("All fields marked * are required."); return;
    }
    const payload = {
      subject_code:   form.subject_code,
      subject_name:   form.subject_name,
      course_id:      Number(form.course_id),
      semester:       Number(form.semester),
      weekly_hours:   Number(form.weekly_hours),
      credits:        Number(form.credits),
      is_lab:         Number(form.is_lab),
      preferred_slot: form.preferred_slot || "ANY",
      status:         form.status || "ACTIVE",
    };
    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateItem({ id: editingId, data: payload }));
      } else {
        await dispatch(createItem(payload));
      }
      await dispatch(getAll());
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    await dispatch(deleteItem(id));
    await dispatch(getAll());
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? subjects.filter((s) => Object.values(s).join(" ").toLowerCase().includes(q)) : subjects;
  }, [subjects, search]);

  const displayData = useMemo(() => {
    let r = [...filtered];
    if (filterSem) r = r.filter((s) => String(s.semester) === String(filterSem));
    if (filterLab) r = r.filter((s) => String(s.is_lab)   === String(filterLab));
    return r;
  }, [filtered, filterSem, filterLab]);

  const totalPages    = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
  const paginatedData = displayData.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Subjects</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage subjects — linked to Department → Course → Semester
            </p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition-colors">
            + Add Subject
          </button>
        </div>

        {/* ── Filter Bar ── */}
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Filter</span>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Semester</label>
            <select value={filterSem} onChange={(e) => { setFilterSem(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="">All</option>
              {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Sem {n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Type</label>
            <select value={filterLab} onChange={(e) => { setFilterLab(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="">All</option>
              <option value="0">Theory</option>
              <option value="1">Lab</option>
            </select>
          </div>
          {(filterSem || filterLab) && (
            <button onClick={() => { setFilterSem(""); setFilterLab(""); setPage(1); }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300">✕ Clear</button>
          )}
          {(filterSem || filterLab) && <span className="mt-4 text-xs text-slate-500">{displayData.length} result(s)</span>}
        </div>

        {/* Search */}
        <input
          type="text" placeholder="Search subjects..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="mb-4 px-3 py-2 rounded bg-slate-900 border border-slate-800 w-96 focus:outline-none focus:border-emerald-500 text-slate-100"
        />

        {/* Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No subjects found. Click "+ Add Subject" to create one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">Hrs/Wk</th>
                  <th className="px-4 py-3 text-left">Credits</th>
                  <th className="px-4 py-3 text-left">Lab</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((s) => (
                  <tr key={s.subject_id} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{s.subject_code}</td>
                    <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                    <td className="px-4 py-3 text-slate-400">{s.course_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">Sem {s.semester}</td>
                    <td className="px-4 py-3 text-slate-400">{s.weekly_hours}</td>
                    <td className="px-4 py-3 text-slate-400">{s.credits}</td>
                    <td className="px-4 py-3">
                      {s.is_lab
                        ? <span className="text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded">Lab</span>
                        : <span className="text-xs text-slate-600">Theory</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button onClick={() => openEdit(s)} className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(s.subject_id)} className="px-3 py-1 rounded text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900 rounded-b-lg mt-0">
            <span className="text-xs text-slate-500">{displayData.length} total · Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={page===1} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">«</button>
              <button onClick={() => setPage(p=>p-1)} disabled={page===1} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p===page?"bg-emerald-500 text-slate-950":"text-slate-400 hover:bg-slate-800"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p=>p+1)} disabled={page===totalPages} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page===totalPages} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">»</button>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-1">{isEditing ? "Edit Subject" : "Add Subject"}</h2>
              <p className="text-xs text-slate-500 mb-5">Select Department first to filter the Course list</p>

              {formError && (
                <div className="mb-4 px-4 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{formError}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">

                  {/* Step 1 — Department */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">
                      Department <span className="text-red-400">*</span>
                      <span className="text-slate-600 ml-1 normal-case">(filters Course list below)</span>
                    </label>
                    <select
                      value={form.department_id}
                      onChange={(e) => { setField("department_id", e.target.value); setField("course_id", ""); }}
                      className={SELECT_CLS}
                    >
                      <option value="">— select department —</option>
                      {departments.map((d) => (
                        <option key={d.depart_id} value={d.depart_id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2 — Course */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">
                      Course <span className="text-red-400">*</span>
                      {form.department_id && filteredCourses.length === 0 && (
                        <span className="text-amber-400 ml-2">No courses found for this department</span>
                      )}
                    </label>
                    <select
                      value={form.course_id}
                      onChange={(e) => setField("course_id", e.target.value)}
                      disabled={!form.department_id}
                      className={SELECT_CLS}
                    >
                      <option value="">— select course —</option>
                      {filteredCourses.map((c) => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name} ({c.course_code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3 — Semester */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Semester <span className="text-red-400">*</span></label>
                    <select value={form.semester} onChange={(e) => setField("semester", e.target.value)} className={SELECT_CLS}>
                      <option value="">— select semester —</option>
                      {SEMESTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Subject Code */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Subject Code <span className="text-red-400">*</span></label>
                    <input type="text" value={form.subject_code} onChange={(e) => setField("subject_code", e.target.value)} placeholder="e.g. CS301" className={INPUT_CLS} />
                  </div>

                  {/* Subject Name */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Subject Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.subject_name} onChange={(e) => setField("subject_name", e.target.value)} placeholder="e.g. Data Structures" className={INPUT_CLS} />
                  </div>

                  {/* Weekly Hours */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Weekly Hours <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="10" value={form.weekly_hours} onChange={(e) => setField("weekly_hours", e.target.value)} className={INPUT_CLS} />
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Credits <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="10" value={form.credits} onChange={(e) => setField("credits", e.target.value)} className={INPUT_CLS} />
                  </div>

                  {/* Is Lab */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Type</label>
                    <select value={form.is_lab} onChange={(e) => setField("is_lab", e.target.value)} className={SELECT_CLS}>
                      {IS_LAB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Preferred Slot */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preferred Slot</label>
                    <select value={form.preferred_slot} onChange={(e) => setField("preferred_slot", e.target.value)} className={SELECT_CLS}>
                      {PREF_SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={SELECT_CLS}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                </div>

                {/* Summary preview */}
                {form.department_id && form.course_id && form.semester && (
                  <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-xs text-slate-400">
                    📌 This subject will be added to{" "}
                    <span className="text-emerald-400 font-semibold">
                      {departments.find((d) => String(d.depart_id) === String(form.department_id))?.name}
                    </span>
                    {" → "}
                    <span className="text-blue-400 font-semibold">
                      {courses.find((c) => String(c.course_id) === String(form.course_id))?.course_name}
                    </span>
                    {" → "}
                    <span className="text-violet-400 font-semibold">Semester {form.semester}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="px-4 py-2 rounded text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-4 py-2 rounded text-sm transition-colors">
                    {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
