import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

export default function MyTimetable() {
  const { user } = useAuth();
  const [timetableData, setTimetableData] = useState([]);
  const [loading,       setLoading]       = useState(false);

  const fetchTimetable = useCallback(async () => {
    if (!user) return;
    const url =
      user.role === "teacher"
        ? `/timetables/teacher/${user.id}`
        : `/timetables/section/${user.section_id}`;

    setLoading(true);
    try {
      const res = await axiosInstance.get(url);
      setTimetableData(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) setTimetableData([]);
      else toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const byDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = timetableData
      .filter((r) => r.day === day)
      .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
    return acc;
  }, {});
  const activeDays = DAYS_ORDER.filter((d) => byDay[d].length > 0);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading your timetable…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user?.role === "teacher" ? "👨‍🏫" : "🎓"}</span>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{user?.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {user?.role === "teacher"
                  ? `Teacher ID: ${user?.id} · Your teaching schedule`
                  : `Section: ${user?.section_name || "—"} · Roll: ${user?.roll_number || "—"}`}
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                {timetableData.length} slots/week
              </span>
            </div>
          </div>
        </div>

        {timetableData.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm">No timetable available yet.</p>
            <p className="text-slate-600 text-xs mt-1">Please check back after the admin generates the timetable.</p>
          </div>
        ) : (
          activeDays.map((day) => (
            <div key={day} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 w-10">{day}</span>
                <span className="text-sm text-slate-300 font-medium">{DAY_LABELS[day]}</span>
                {byDay[day][0]?.class_date && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {new Date(byDay[day][0].class_date).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-500">
                  {byDay[day].length} slot{byDay[day].length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {byDay[day].map((row) => (
                  <div key={row.timetable_id}
                    className="px-5 py-4 grid grid-cols-1 sm:grid-cols-4 gap-3 hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        {String(row.start_time).slice(0,5)} – {String(row.end_time).slice(0,5)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{row.subject_name}</p>
                      {row.is_lab && (
                        <span className="text-xs bg-violet-900/50 text-violet-300 px-1.5 py-0.5 rounded mt-0.5 inline-block">Lab</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {user?.role === "teacher"
                        ? <><span>👥</span><span>{row.section_name}</span></>
                        : <><span>👨‍🏫</span><span>{row.teacher_name}</span></>
                      }
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
          ))
        )}
      </div>
    </div>
  );
}