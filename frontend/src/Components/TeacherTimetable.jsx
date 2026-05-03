import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function timeRange(row) {
  return `${String(row.start_time).slice(0, 5)} - ${String(row.end_time).slice(0, 5)}`;
}

function TeacherTimetable() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/teachers")
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load teachers"));
  }, []);

  const fetchTimetable = useCallback(async (teacherId) => {
    if (!teacherId) {
      setTimetableData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/timetables/teacher/${teacherId}`);
      setTimetableData(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) setTimetableData([]);
      else toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
    fetchTimetable(e.target.value);
  };

  const byDay = useMemo(() => DAYS_ORDER.reduce((acc, day) => {
    acc[day] = timetableData
      .filter((row) => row.day === day)
      .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
    return acc;
  }, {}), [timetableData]);

  const activeDays = DAYS_ORDER.filter((day) => byDay[day].length > 0);
  const selectedTeacherObj = teachers.find((teacher) => String(teacher.teacher_id) === String(selectedTeacher));

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl space-y-6">
        <section className="app-panel rounded-3xl p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Faculty schedule</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Teacher Timetable</h1>
              <p className="mt-2 text-sm text-slate-400">Select a teacher to view their weekly teaching load.</p>
            </div>

            <div className="w-full lg:w-80">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Select Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={handleTeacherChange}
                className="app-input w-full rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">- choose teacher -</option>
                {teachers.map((teacher) => (
                  <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {selectedTeacherObj && (
          <section className="grid gap-3 sm:grid-cols-3">
            <Summary icon={FiUser} label="Teacher" value={selectedTeacherObj.name} />
            <Summary icon={FiCalendar} label="Total slots" value={timetableData.length} />
            <Summary icon={FiClock} label="Working days" value={activeDays.length} />
          </section>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500 animate-pulse">Loading timetable...</div>
        ) : selectedTeacher && timetableData.length === 0 ? (
          <div className="app-panel rounded-3xl py-16 text-center">
            <p className="text-sm font-semibold text-slate-300">No timetable assigned to this teacher.</p>
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
                    <p className="text-xs text-slate-500">{byDay[day].length} slot{byDay[day].length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {byDay[day].map((row) => (
                    <article
                      key={row.timetable_id}
                      className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[150px_1fr_170px_140px]"
                    >
                      <span className="w-fit rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-300">
                        {timeRange(row)}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{row.subject_name}</h3>
                          {Number(row.is_lab) === 1 ? (
                            <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[11px] font-bold text-violet-200">Lab</span>
                          ) : (
                            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-200">Theory</span>
                          )}
                        </div>
                      </div>
                      <Pill icon={FiUser} text={row.section_name} />
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
    <div className="app-panel rounded-2xl p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate text-lg font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
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

export default TeacherTimetable;
