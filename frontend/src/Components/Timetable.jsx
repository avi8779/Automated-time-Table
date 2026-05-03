import { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = {
  MON: "Mon", TUE: "Tue", WED: "Wed",
  THU: "Thu", FRI: "Fri", SAT: "Sat",
};
const DOW_MAP = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function nextDateForDay(dayName) {
  const today = new Date();
  const dow = today.getDay();
  const target = DOW_MAP[dayName] ?? 1;
  let diff = target - dow;
  if (diff < 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

function isToday(dayName) {
  return (DOW_MAP[dayName] ?? -1) === new Date().getDay();
}

// ── Slot card ────────────────────────────────────────────────────────────────
function SlotCard({ row }) {
  const isLab = !!row.is_lab;
  return (
    <div
      className={`
        h-full rounded-xl p-2.5 flex flex-col justify-between text-[11px] leading-tight
        border transition hover:-translate-y-0.5 cursor-default shadow-sm
        ${isLab
          ? "bg-violet-400/10 border-violet-400/25"
          : "bg-teal-400/10 border-teal-400/25"}
      `}
    >
      <p
        className={`
          font-semibold line-clamp-2 text-[12px]
          ${isLab ? "text-violet-100" : "text-teal-100"}
        `}
      >
        {row.subject_name}
      </p>
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {isLab && (
          <span className="bg-violet-400/15 text-violet-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            Lab
          </span>
        )}
        <span
          className={`
            font-medium
            ${isLab ? "text-violet-300" : "text-teal-300"}
          `}
        >
          {row.room_no}
        </span>
      </div>
      <p
        className={`
          truncate
          ${isLab ? "text-violet-300/80" : "text-teal-300/80"}
        `}
      >
        {row.teacher_name}
      </p>
    </div>
  );
}

// ── Break cell ───────────────────────────────────────────────────────────────
function BreakCell() {
  return (
    <div className="h-[62px] flex items-center justify-center">
      <span
        className="text-[10px] uppercase tracking-widest font-medium text-slate-300 dark:text-slate-600"
        style={{
          background: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.04) 4px,rgba(0,0,0,0.04) 5px)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        break
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function Timetable() {
  const [sections,        setSections]        = useState([]);
  const [selectedDept,    setSelectedDept]    = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [generateScope,   setGenerateScope]   = useState("all");
  const [generateDept,    setGenerateDept]    = useState("");
  const [generateSection, setGenerateSection] = useState("");
  const [timetableData,   setTimetableData]   = useState([]);
  const [allSlots,        setAllSlots]        = useState([]);
  const [generating,      setGenerating]      = useState(false);
  const [sendingEmail,    setSendingEmail]    = useState(false);
  const [loadingTT,       setLoadingTT]       = useState(false);
  const [stats,           setStats]           = useState(null);
  const [lastGenerationPayload, setLastGenerationPayload] = useState(null);

  // Load sections + time slot metadata on mount
  useEffect(() => {
    axiosInstance
      .get("/timetables/sections")
      .then((res) => setSections(res.data.data || []))
      .catch(() => toast.error("Failed to load sections"));

    axiosInstance
      .get("/time-slots")
      .then((res) => setAllSlots(res.data.data || []))
      .catch(() => {});
  }, []);

  const departments = useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      if (s.depart_id && !map[s.depart_id])
        map[s.depart_id] = { depart_id: s.depart_id, name: s.department_name };
    });
    return Object.values(map).sort((a, b) => a.name?.localeCompare(b.name));
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (!selectedDept) return [];
    return sections.filter((s) => String(s.depart_id) === String(selectedDept));
  }, [sections, selectedDept]);

  const generationSections = useMemo(() => {
    if (!generateDept) return [];
    return sections.filter((s) => String(s.depart_id) === String(generateDept));
  }, [sections, generateDept]);

  useEffect(() => {
    if (!selectedDept) {
      setSelectedSection("");
      setTimetableData([]);
      return;
    }

    const selected = sections.find((s) => String(s.section_id) === String(selectedSection));
    if (!selected || String(selected.depart_id) !== String(selectedDept)) {
      setSelectedSection("");
      setTimetableData([]);
    }
  }, [selectedDept, selectedSection, sections]);

  useEffect(() => {
    setGenerateSection("");
  }, [generateDept]);

  const fetchTimetable = useCallback(async (sectionId) => {
    if (!sectionId) { setTimetableData([]); return; }
    setLoadingTT(true);
    try {
      const res = await axiosInstance.get(`/timetables/section/${sectionId}`);
      setTimetableData(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) setTimetableData([]);
      else toast.error("Failed to load timetable");
    } finally {
      setLoadingTT(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable(selectedSection);
  }, [selectedSection, fetchTimetable]);

  const handleGenerate = async () => {
    const payload = { scope: generateScope };
    let label = "all departments";

    if (generateScope === "department") {
      if (!generateDept) {
        toast.error("Choose a department first");
        return;
      }
      payload.department_id = generateDept;
      label = departments.find((d) => String(d.depart_id) === String(generateDept))?.name || "selected department";
    }

    if (generateScope === "section") {
      if (!generateSection) {
        toast.error("Choose a section first");
        return;
      }
      payload.section_id = generateSection;
      const section = sections.find((s) => String(s.section_id) === String(generateSection));
      label = section ? `${section.section_name} (${section.department_name})` : "selected section";
    }

    if (!window.confirm(`Generate timetable for ${label}? Existing timetable rows for this selection will be replaced.`)) return;
    setGenerating(true);
    setStats(null);
    try {
      const res = await axiosInstance.post("/timetables/generate", payload);
      const { message, assignedCount, unassigned, assignmentIssues, debugInfo, email } = res.data;
      toast.success(message || "Timetable generated!");
      if (email?.blocked) toast.warning("Email button is disabled until timetable issues are fixed");
      setStats({ assignedCount, unassigned, assignmentIssues, debugInfo, email });
      setLastGenerationPayload(payload);
      if (generateScope === "section") {
        const section = sections.find((s) => String(s.section_id) === String(generateSection));
        if (section) setSelectedDept(String(section.depart_id));
        setSelectedSection(String(generateSection));
        await fetchTimetable(generateSection);
      } else {
        await fetchTimetable(selectedSection);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!lastGenerationPayload) {
      toast.error("Generate a timetable first");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await axiosInstance.post("/send-timetable-email", lastGenerationPayload);
      toast.success(res.data?.message || "Emails sent successfully");
      setStats((prev) => prev ? { ...prev, email: res.data.email } : prev);
    } catch (err) {
      toast.error(err.response?.data?.message || "Email failed");
    } finally {
      setSendingEmail(false);
    }
  };

  // Group timetable rows by day -> array (preserves ALL entries per day)
  const byDay = useMemo(() => {
    const map = {};
    timetableData.forEach((r) => {
      if (!map[r.day]) map[r.day] = [];
      map[r.day].push(r);
    });
    return map;
  }, [timetableData]);

  // Show all configured timetable days, including Saturday even when empty.
  const activeDays = DAYS_ORDER.filter((d) =>
    timetableData.some((r) => r.day === d) || allSlots.some((slot) => slot.day === d && !slot.is_break)
  );

  // Build slot-time axis from the canonical time_slots table when available.
  // When falling back to timetableData, only include start_times that appear
  // in MORE THAN ONE day - this prevents a single-day outlier slot from
  // creating a mostly-empty row across the whole grid.
  const slotRows = useMemo(() => {
    if (allSlots.length > 0) {
      const seen = new Map();
      allSlots.forEach((r) => {
        if (!seen.has(r.start_time)) {
          seen.set(r.start_time, {
            slot_order: r.slot_order,
            start_time: r.start_time,
            end_time:   r.end_time,
            is_break:   r.is_break ?? 0,
          });
        }
      });
      return Array.from(seen.values()).sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
    }
    // Fallback: count how many distinct days each start_time appears on.
    // Only promote to a grid row if it appears on 2+ days OR is the only
    // start_time for ALL days (prevents single-day orphan rows).
    const timeTodays = new Map();
    timetableData.forEach((r) => {
      if (!timeTodays.has(r.start_time)) timeTodays.set(r.start_time, new Set());
      timeTodays.get(r.start_time).add(r.day);
    });
    const activeDayCount = new Set(timetableData.map((r) => r.day)).size;
    const seen = new Map();
    timetableData.forEach((r) => {
      const dayCount = timeTodays.get(r.start_time)?.size ?? 0;
      // Include row if: appears on 2+ days, OR only 1 active day total
      if ((dayCount >= 2 || activeDayCount <= 1) && !seen.has(r.start_time)) {
        seen.set(r.start_time, {
          slot_order: r.slot_order,
          start_time: r.start_time,
          end_time:   r.end_time,
          is_break:   r.is_break ?? 0,
        });
      }
    });
    return Array.from(seen.values()).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }, [allSlots, timetableData]);

  // For a given day + time row, return all matching timetable entries.
  // Also catches entries whose start_time didn't make it into slotRows
  // (single-day outlier) by finding the closest slot row and attaching there.
  const getSlotEntries = useCallback((day, startTime) => {
    return (byDay[day] || []).filter((r) => {
      if (r.start_time === startTime) return true;
      // Attach orphan slot: if this row's start_time is NOT in slotRows at all,
      // it belongs to the nearest slotRow - check if startTime is the closest.
      const inGrid = slotRows.some((s) => s.start_time === r.start_time);
      if (inGrid) return false;
      // Find which slotRow is closest in time to r.start_time
      let closest = slotRows[0];
      slotRows.forEach((s) => {
        if (Math.abs(s.start_time.localeCompare(r.start_time)) <
            Math.abs(closest.start_time.localeCompare(r.start_time))) {
          closest = s;
        }
      });
      return closest?.start_time === startTime;
    });
  }, [byDay, slotRows]);

  const selectedSectionObj = sections.find(
    (s) => String(s.section_id) === String(selectedSection)
  );

  const hasData = timetableData.length > 0;

  return (
    <div className="app-page">
      <div className="app-container max-w-7xl space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Timetable</h1>
            <p className="text-slate-400 text-xs mt-0.5">Weekly schedule grid</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="app-primary-btn flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                </svg>
                Generate
              </>
            )}
          </button>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="app-panel rounded-2xl px-4 py-3 text-xs space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-emerald-400 font-semibold">
                {stats.assignedCount} slot{stats.assignedCount !== 1 ? "s" : ""} assigned
              </p>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !lastGenerationPayload || stats.email?.blocked}
                className="app-primary-btn px-3 py-1.5 rounded-lg font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
            {stats.unassigned?.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-amber-400">
                {stats.unassigned.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}
            {stats.debugInfo?.unassignedSubjects?.length > 0 && (
              <div className="text-amber-300">
                <p className="font-semibold">Unassigned subjects:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {stats.debugInfo.unassignedSubjects.map((item, i) => (
                    <li key={i}>{item.section}: {item.subject} - {item.remaining} hour(s) left ({item.reason})</li>
                  ))}
                </ul>
              </div>
            )}
            {stats.debugInfo?.emptySlots?.length > 0 && (
              <div className="text-slate-400">
                <p className="font-semibold">Empty slots:</p>
                <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-auto">
                  {stats.debugInfo.emptySlots.slice(0, 30).map((item, i) => (
                    <li key={i}>{item.section}: {item.day} slot {item.slot}</li>
                  ))}
                </ul>
              </div>
            )}
            {stats.debugInfo?.failureReasons?.length > 0 && (
              <div className="text-slate-400">
                <p className="font-semibold">Failure reasons:</p>
                <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-auto">
                  {stats.debugInfo.failureReasons.slice(0, 20).map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}
            {stats.assignmentIssues?.length > 0 && (
              <div className="text-rose-400">
                <p className="font-semibold">Emails blocked because these classes were not fully assigned:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {stats.assignmentIssues.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}
            {stats.email && (
              <div className="pt-1 text-slate-400">
                {stats.email.blocked ? (
                  <div className="text-rose-400">
                    <p className="font-semibold">Send Email is disabled because the timetable has assignment issues.</p>
                    {stats.email.issues?.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5">
                        {stats.email.issues.map((msg, i) => <li key={i}>{msg}</li>)}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p>
                    Emails sent: {stats.email.sent?.length || 0}
                    {stats.email.skipped?.length ? ` - skipped: ${stats.email.skipped.length}` : ""}
                    {stats.email.failed?.length ? ` - failed: ${stats.email.failed.length}` : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Selectors ── */}
        <div className="app-panel rounded-2xl p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="lg:w-56">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
                Generate for
              </label>
              <select
                value={generateScope}
                onChange={(e) => setGenerateScope(e.target.value)}
                className="app-input w-full px-3 py-2 rounded-lg text-sm"
              >
                <option value="all">Whole timetable</option>
                <option value="department">Whole department</option>
                <option value="section">Single section</option>
              </select>
            </div>

            {(generateScope === "department" || generateScope === "section") && (
              <div className="lg:w-72">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Department
                </label>
                <select
                  value={generateDept}
                  onChange={(e) => setGenerateDept(e.target.value)}
                  className="app-input w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">- choose department -</option>
                  {departments.map((d) => (
                    <option key={d.depart_id} value={d.depart_id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {generateScope === "section" && (
              <div className="lg:w-72">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Section
                </label>
                <select
                  value={generateSection}
                  onChange={(e) => setGenerateSection(e.target.value)}
                  disabled={!generateDept}
                  className="app-input w-full px-3 py-2 rounded-lg text-sm disabled:opacity-40"
                >
                  <option value="">- choose section -</option>
                  {generationSections.map((s) => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.section_name} - Sem {s.semester} ({s.batch_year})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="app-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
              1. Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="app-input w-full px-3 py-2 rounded-lg text-sm"
            >
              <option value="">- choose department -</option>
              {departments.map((d) => (
                <option key={d.depart_id} value={d.depart_id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
              2. Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedDept}
              className="app-input w-full px-3 py-2 rounded-lg text-sm disabled:opacity-40"
            >
              <option value="">- choose section -</option>
              {filteredSections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name} - Sem {s.semester} ({s.batch_year})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Section badge ── */}
        {selectedSectionObj && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800">
              {selectedSectionObj.max_slots_per_day} slots/day max
            </span>
            <span className="text-[11px] text-slate-500">{selectedSectionObj.course_name}</span>
            {hasData && (
              <span className="text-[11px] text-slate-500">
                - {timetableData.length} total classes
              </span>
            )}
          </div>
        )}

        {/* ── Timetable grid ── */}
        {selectedSection && (
          loadingTT ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
              Loading...
            </div>
          ) : !hasData ? (
            <div className="app-panel rounded-2xl py-16 text-center">
              <p className="text-slate-400 text-sm">No timetable for this section yet.</p>
              <p className="text-slate-500 text-xs mt-1">Click Generate to create one.</p>
            </div>
          ) : (
            <div>
              {/* Section heading above grid */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">
                  <span className="text-teal-700">{selectedSectionObj?.section_name}</span>
                  <span className="text-slate-500 font-normal ml-1.5">- Sem {selectedSectionObj?.semester}</span>
                </p>
                {/* Legend */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-400 inline-block" />
                    Theory
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-100 border border-violet-400 inline-block" />
                    Lab
                  </span>
                </div>
              </div>

              {/* Scrollable grid */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: "640px" }}>
                  <colgroup>
                    <col style={{ width: "90px" }} />
                    {activeDays.map((d) => (
                      <col key={d} style={{ width: `${Math.floor((100 - 11) / activeDays.length)}%` }} />
                    ))}
                  </colgroup>

                  {/* Header */}
                  <thead>
                    <tr>
                      <th className="bg-slate-900 border-b border-r border-slate-800 px-3 py-3 text-left">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Time</span>
                      </th>
                      {activeDays.map((day) => {
                        const d = nextDateForDay(day);
                        const today = isToday(day);
                        return (
                          <th
                            key={day}
                            className={`bg-slate-900 border-b border-r border-slate-800 px-2 py-3 text-center last:border-r-0 ${today ? "bg-emerald-950/30" : ""}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[11px] font-semibold uppercase tracking-wider ${today ? "text-emerald-400" : "text-slate-300"}`}>
                                {DAY_LABELS[day]}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                              </span>
                              <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 rounded-full mt-0.5">
                                {timetableData.filter((r) => r.day === day).length} classes
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {slotRows.map((slot, si) => (
                      <tr key={slot.slot_order} className={si % 2 === 0 ? "bg-slate-950" : "bg-slate-900/40"}>
                        {/* Time column */}
                        <td className="border-b border-r border-slate-800 px-3 py-2 align-middle last-of-type:border-b-0">
                          <p className="text-[11px] font-semibold text-slate-400 font-mono">
                            {formatTime(slot.start_time)}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {formatTime(slot.start_time)}-{formatTime(slot.end_time)}
                          </p>
                          {slot.is_break ? (
                            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-medium mt-0.5 block">
                              break
                            </span>
                          ) : null}
                        </td>

                        {/* Day cells */}
                        {activeDays.map((day) => {
                          const today = isToday(day);
                          const entries = getSlotEntries(day, slot.start_time);

                          if (slot.is_break) {
                            return (
                              <td key={day} className="border-b border-r border-slate-800 p-0 last:border-r-0">
                                <div
                                  className="h-[62px] flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-700"
                                  style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.015) 4px,rgba(255,255,255,0.015) 5px)" }}
                                >
                                  -
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day}
                              className={`border-b border-r border-slate-800 p-1.5 align-top last:border-r-0 ${today ? "bg-emerald-950/10" : ""}`}
                              style={{ minHeight: entries.length > 1 ? `${entries.length * 74}px` : "70px" }}
                            >
                              {entries.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {entries.map((row) => (
                                    <SlotCard key={row.timetable_id} row={row} />
                                  ))}
                                </div>
                              ) : (
                                <div style={{ height: "62px" }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Timetable;
