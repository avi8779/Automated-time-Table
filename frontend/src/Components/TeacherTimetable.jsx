import { useEffect, useState } from "react";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function TeacherTimetable() {
  const [teachers,        setTeachers]        = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [timetableData,   setTimetableData]   = useState([]);
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/teachers")
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load teachers"));
  }, []);

  useEffect(() => {
    if (!selectedTeacher) { setTimetableData([]); return; }
    setLoading(true);
    axiosInstance
      .get(`/timetables/teacher/${selectedTeacher}`)
      .then((res) => setTimetableData(res.data.data || []))
      .catch((err) => {
        if (err.response?.status === 404) setTimetableData([]);
        else toast.error("Failed to load timetable");
      })
      .finally(() => setLoading(false));
  }, [selectedTeacher]);

  // Group by day
  const byDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = timetableData
      .filter((r) => r.day === day)
      .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
    return acc;
  }, {});
  const activeDays = DAYS_ORDER.filter((d) => byDay[d].length > 0);

  const selectedTeacherObj = teachers.find(
    (t) => String(t.teacher_id) === String(selectedTeacher)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teacher Timetable</h1>
          <p className="text-slate-400 text-sm mt-1">
            Select a teacher to view their weekly schedule
          </p>
        </div>

        {/* Teacher selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-2">
            Select Teacher
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">— choose teacher —</option>
            {teachers.map((t) => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        {selectedTeacherObj && timetableData.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              👨‍🏫 {selectedTeacherObj.name}
            </span>
            <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
              {timetableData.length} total slots/week
            </span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
              {activeDays.length} working days
            </span>
          </div>
        )}

        {/* Timetable */}
        {selectedTeacher && (
          loading ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
              Loading timetable…
            </div>
          ) : timetableData.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
              <p className="text-slate-400 text-sm">No timetable assigned to this teacher.</p>
              <p className="text-slate-600 text-xs mt-1">Generate the timetable first from the Timetable page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDays.map((day) => (
                <div key={day} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  {/* Day header */}
                  <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 w-10">{day}</span>
                    <span className="text-sm text-slate-300 font-medium">{DAY_LABELS[day]}</span>
                    {byDay[day][0]?.class_date && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {new Date(byDay[day][0].class_date).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {byDay[day].length} slot{byDay[day].length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="divide-y divide-slate-800/60">
                    {byDay[day].map((row) => (
                      <div
                        key={row.timetable_id}
                        className="px-5 py-4 grid grid-cols-1 sm:grid-cols-4 gap-3 hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Time */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                            {formatTime(row.start_time)} – {formatTime(row.end_time)}
                          </span>
                        </div>

                        {/* Subject */}
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{row.subject_name}</p>
                          {row.is_lab
                            ? <span className="text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded mt-0.5 inline-block">Lab</span>
                            : null}
                        </div>

                        {/* Section */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>👥</span>
                          <span>{row.section_name}</span>
                        </div>

                        {/* Room */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>🚪</span>
                          <span>{row.room_no}</span>
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

export default TeacherTimetable;