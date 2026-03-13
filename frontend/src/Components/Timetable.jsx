import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function Timetable() {
  const [sections,        setSections]        = useState([]);
  const [selectedDept,    setSelectedDept]    = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [timetableData,   setTimetableData]   = useState([]);
  const [generating,      setGenerating]      = useState(false);
  const [loadingTT,       setLoadingTT]       = useState(false);
  const [generated,       setGenerated]       = useState(0);
  const [stats,           setStats]           = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/timetables/sections")
      .then((res) => setSections(res.data.data || []))
      .catch(() => toast.error("Failed to load sections"));
  }, []);

  // Unique departments from sections
  const departments = useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      if (s.depart_id && !map[s.depart_id]) {
        map[s.depart_id] = { depart_id: s.depart_id, name: s.department_name };
      }
    });
    return Object.values(map).sort((a, b) => a.name?.localeCompare(b.name));
  }, [sections]);

  // Sections filtered by selected department
  const filteredSections = useMemo(() => {
    if (!selectedDept) return [];
    return sections.filter((s) => String(s.depart_id) === String(selectedDept));
  }, [sections, selectedDept]);

  useEffect(() => {
    setSelectedSection("");
    setTimetableData([]);
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedSection) { setTimetableData([]); return; }
    setLoadingTT(true);
    axiosInstance
      .get(`/timetables/section/${selectedSection}`)
      .then((res) => setTimetableData(res.data.data || []))
      .catch((err) => {
        if (err.response?.status === 404) setTimetableData([]);
        else toast.error("Failed to load timetable");
      })
      .finally(() => setLoadingTT(false));
  }, [selectedSection, generated]);

  const handleGenerate = async () => {
    if (!window.confirm("This will clear and regenerate the entire timetable. Continue?")) return;
    setGenerating(true);
    setStats(null);
    try {
      const res = await axiosInstance.post("/timetables/generate");
      const { message, assignedCount, unassigned } = res.data;
      toast.success(message || "Timetable generated!");
      setStats({ assignedCount, unassigned });
      setGenerated((n) => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const byDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = timetableData
      .filter((r) => r.day === day)
      .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
    return acc;
  }, {});
  const activeDays = DAYS_ORDER.filter((d) => byDay[d].length > 0);

  const selectedSectionObj = sections.find(
    (s) => String(s.section_id) === String(selectedSection)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Timetable</h1>
            <p className="text-slate-400 text-sm mt-1">
              Select your department and section to view the schedule
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating…
              </>
            ) : "⚡ Generate Timetable"}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-sm text-emerald-400 font-semibold">
              ✅ {stats.assignedCount} slot{stats.assignedCount !== 1 ? "s" : ""} assigned
            </p>
            {stats.unassigned?.length > 0 && (
              <div>
                <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ Unassigned:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {stats.unassigned.map((msg, i) => (
                    <li key={i} className="text-xs text-slate-400">{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Department + Section selectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-2">
              1. Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">— choose department —</option>
              {departments.map((d) => (
                <option key={d.depart_id} value={d.depart_id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-2">
              2. Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedDept}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
            >
              <option value="">— choose section —</option>
              {filteredSections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name} · Sem {s.semester} · {s.section_type} ({s.batch_year})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section type info badge */}
        {selectedSectionObj && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-900/50 text-emerald-300">
              {selectedSectionObj.max_slots_per_day} slots/day max
            </span>
            <span className="text-xs text-slate-500">{selectedSectionObj.course_name}</span>
          </div>
        )}

        {/* Timetable grid */}
        {selectedSection && (
          loadingTT ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">Loading timetable…</div>
          ) : timetableData.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
              <p className="text-slate-400 text-sm">No timetable found for this section.</p>
              <p className="text-slate-600 text-xs mt-1">Click "⚡ Generate Timetable" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">
                  Schedule for <span className="text-emerald-400">{selectedSectionObj?.section_name}</span>
                  <span className="text-slate-500 font-normal ml-2">— Semester {selectedSectionObj?.semester}</span>
                </h2>
                <span className="text-xs text-slate-500">{timetableData.length} total slots</span>
              </div>

              {activeDays.map((day) => (
                <div key={day} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 w-10">{day}</span>
                    <span className="text-sm text-slate-300 font-medium">{DAY_LABELS[day]}</span>
                    {byDay[day][0]?.class_date && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {new Date(byDay[day][0].class_date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {byDay[day].length} slot{byDay[day].length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {byDay[day].map((row) => (
                      <div
                        key={row.timetable_id}
                        className="px-5 py-4 grid grid-cols-1 sm:grid-cols-4 gap-3 hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                            {formatTime(row.start_time)} – {formatTime(row.end_time)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{row.subject_name}</p>
                          {row.is_lab
                            ? <span className="text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded mt-0.5 inline-block">Lab</span>
                            : null}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>👨‍🏫</span><span>{row.teacher_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>🚪</span><span>{row.room_no}</span>
                          {row.room_type && row.room_type !== "CLASSROOM" && (
                            <span className="text-slate-600">({row.room_type})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

export default Timetable;