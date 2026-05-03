import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import { useAuth } from "../context/useAuth";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function timeRange(row) {
  return `${String(row.start_time).slice(0, 5)} - ${String(row.end_time).slice(0, 5)}`;
}

export default function MyTimetable() {
  const { user } = useAuth();
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const byDay = useMemo(() => DAYS_ORDER.reduce((acc, day) => {
    acc[day] = timetableData
      .filter((row) => row.day === day)
      .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
    return acc;
  }, {}), [timetableData]);

  const activeDays = DAYS_ORDER.filter((day) => byDay[day].length > 0);
  const labCount = timetableData.filter((row) => row.is_lab).length;
  const nextClass = activeDays.flatMap((day) => byDay[day]).at(0);
  const isTeacher = user?.role === "teacher";

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="text-sm text-slate-400 animate-pulse">Loading your timetable...</div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl space-y-6">
        <section className="app-panel overflow-hidden rounded-3xl p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400 text-base font-black text-slate-950">
                {isTeacher ? "TC" : "ST"}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
                  {isTeacher ? "Teacher workspace" : "Student workspace"}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{user?.name}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {isTeacher
                    ? `Teacher ID: ${user?.id || "-"}`
                    : `Section: ${user?.section_name || "-"} - Roll: ${user?.roll_number || "-"}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <Summary icon={FiCalendar} label="Slots" value={timetableData.length} />
              <Summary icon={FiClock} label="Days" value={activeDays.length} />
              <Summary icon={FiBookOpen} label="Labs" value={labCount} />
            </div>
          </div>
        </section>

        {nextClass && (
          <section className="rounded-2xl border border-teal-300/20 bg-teal-400/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">First listed class</p>
                <p className="mt-1 text-base font-bold text-white">{nextClass.subject_name}</p>
                <p className="mt-1 text-xs text-slate-400">{nextClass.day} - {timeRange(nextClass)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <Pill icon={isTeacher ? FiUser : FiUser} text={isTeacher ? nextClass.section_name : nextClass.teacher_name} />
                <Pill icon={FiMapPin} text={nextClass.room_no} />
              </div>
            </div>
          </section>
        )}

        {timetableData.length === 0 ? (
          <div className="app-panel rounded-3xl py-16 text-center">
            <p className="text-sm font-semibold text-slate-300">No timetable available yet.</p>
            <p className="mt-1 text-xs text-slate-500">Please check back after the admin generates the timetable.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDays.map((day) => (
              <section key={day} className="app-panel overflow-hidden rounded-3xl">
                <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-xs font-black text-teal-300">
                    {day}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">{DAY_LABELS[day]}</h2>
                    <p className="text-xs text-slate-500">{byDay[day].length} scheduled slot{byDay[day].length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {byDay[day].map((row) => (
                    <article
                      key={row.timetable_id}
                      className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[150px_1fr_170px_140px]"
                    >
                      <div className="flex items-center">
                        <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-300">
                          {timeRange(row)}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{row.subject_name}</h3>
                          {row.is_lab ? (
                            <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[11px] font-bold text-violet-200">Lab</span>
                          ) : (
                            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-200">Theory</span>
                          )}
                        </div>
                        {row.subject_code && <p className="mt-1 text-xs text-slate-500">{row.subject_code}</p>}
                      </div>
                      <Pill icon={FiUser} text={isTeacher ? row.section_name : row.teacher_name} />
                      <Pill icon={FiMapPin} text={row.room_no} />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-teal-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function Pill({ icon: Icon, text }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="truncate">{text || "-"}</span>
    </span>
  );
}
