import { pool } from "../config/dbConn.js";
import { sendTeacherTimetableEmail } from "./email.service.js";
import {
  buildOptimizerContext,
  generateInitialTimetable,
  optimizeTimetable,
} from "./timetable.optimizer.js";

/* ===========================
   HELPER QUERIES
=========================== */

const getAvailableSlots = async () => {
  const [rows] = await pool.query(
   
    `SELECT MIN(slot_id) AS slot_id, day, slot_order, start_time, end_time
     FROM time_slots
     WHERE is_break = 0 AND status = 'ACTIVE'
     GROUP BY day, slot_order, start_time, end_time
     ORDER BY day, slot_order`
  );
  return rows;
};

const getSections = async (filters = {}, db = pool) => {
  const params = [];
  let sql = `SELECT
       s.section_id,
       s.section_name AS name,
       s.course_id,
       s.semester,
       s.strength,
       s.batch_year,
       COALESCE(s.max_slots_per_day, 6) AS max_slots_per_day,
       d.depart_id
     FROM sections s
     JOIN courses    c ON c.course_id  = s.course_id
     JOIN department d ON d.depart_id  = c.depart_id
     WHERE s.is_deleted = 0`;

  if (filters.department_id) {
    sql += " AND d.depart_id = ?";
    params.push(filters.department_id);
  }

  if (filters.section_id) {
    sql += " AND s.section_id = ?";
    params.push(filters.section_id);
  }

  sql += " ORDER BY d.name, s.section_name";

  const [rows] = await db.query(sql, params);
  return rows;
};

const getExistingTimetableRowsOutsideSections = async (sectionIds, db = pool) => {
  if (!sectionIds.length) return [];

  const [rows] = await db.query(
    `SELECT
       tt.section_id,
       tt.teacher_id,
       tt.room_id,
       ts.day,
       tt.slot_id
     FROM timetables tt
     JOIN time_slots ts ON ts.slot_id = tt.slot_id
     WHERE tt.section_id NOT IN (?)`,
    [sectionIds]
  );
  return rows;
};

const validateTimetableForSections = async (sectionIds) => {
  if (!sectionIds.length) return [];
  const issues = [];

  const conflictQueries = [
    {
      label: "Teacher conflict",
      sql: `SELECT t.name, ts.day, ts.start_time, ts.end_time, COUNT(*) AS total
            FROM timetables tt
            JOIN teachers t ON t.teacher_id = tt.teacher_id
            JOIN time_slots ts ON ts.slot_id = tt.slot_id
            GROUP BY tt.teacher_id, ts.day, ts.start_time, ts.end_time
            HAVING COUNT(*) > 1
               AND SUM(CASE WHEN tt.section_id IN (?) THEN 1 ELSE 0 END) > 0`,
      format: (row) => `${row.name} has ${row.total} classes on ${row.day} ${String(row.start_time).slice(0, 5)}-${String(row.end_time).slice(0, 5)}`,
    },
    {
      label: "Room conflict",
      sql: `SELECT r.room_no, ts.day, ts.start_time, ts.end_time, COUNT(*) AS total
            FROM timetables tt
            JOIN rooms r ON r.room_id = tt.room_id
            JOIN time_slots ts ON ts.slot_id = tt.slot_id
            GROUP BY tt.room_id, ts.day, ts.start_time, ts.end_time
            HAVING COUNT(*) > 1
               AND SUM(CASE WHEN tt.section_id IN (?) THEN 1 ELSE 0 END) > 0`,
      format: (row) => `Room ${row.room_no} has ${row.total} classes on ${row.day} ${String(row.start_time).slice(0, 5)}-${String(row.end_time).slice(0, 5)}`,
    },
    {
      label: "Section conflict",
      sql: `SELECT s.section_name, ts.day, ts.start_time, ts.end_time, COUNT(*) AS total
            FROM timetables tt
            JOIN sections s ON s.section_id = tt.section_id
            JOIN time_slots ts ON ts.slot_id = tt.slot_id
            WHERE tt.section_id IN (?)
            GROUP BY tt.section_id, ts.day, ts.start_time, ts.end_time
            HAVING COUNT(*) > 1`,
      format: (row) => `${row.section_name} has ${row.total} classes on ${row.day} ${String(row.start_time).slice(0, 5)}-${String(row.end_time).slice(0, 5)}`,
    },
  ];

  for (const query of conflictQueries) {
    const [rows] = await pool.query(query.sql, [sectionIds]);
    rows.forEach((row) => issues.push(`${query.label}: ${query.format(row)}`));
  }

  return issues;
};

const getTeacherTimetableRecipients = async (sectionIds) => {
  if (!sectionIds.length) return [];

  const [rows] = await pool.query(
    `SELECT
       t.teacher_id,
       t.name AS teacher_name,
       t.email,
       sec.section_name,
       subj.subject_name,
       r.room_no,
       ts.day,
       ts.slot_order,
       ts.start_time,
       ts.end_time
     FROM timetables tt
     JOIN teachers t ON t.teacher_id = tt.teacher_id
     JOIN sections sec ON sec.section_id = tt.section_id
     JOIN subjects subj ON subj.subject_id = tt.subject_id
     JOIN rooms r ON r.room_id = tt.room_id
     JOIN time_slots ts ON ts.slot_id = tt.slot_id
     WHERE tt.section_id IN (?)
       AND t.is_deleted = 0
     ORDER BY t.name, FIELD(ts.day,'MON','TUE','WED','THU','FRI','SAT'), ts.slot_order`,
    [sectionIds]
  );

  const recipients = new Map();
  rows.forEach((row) => {
    if (!recipients.has(row.teacher_id)) {
      recipients.set(row.teacher_id, {
        teacher_id: row.teacher_id,
        name: row.teacher_name,
        email: row.email,
        rows: [],
      });
    }
    recipients.get(row.teacher_id).rows.push(row);
  });

  return Array.from(recipients.values());
};

const sendGeneratedTimetableEmails = async (sectionIds, options = {}) => {
  const recipients = await getTeacherTimetableRecipients(sectionIds);
  const result = { sent: [], failed: [], skipped: [] };

  for (const teacher of recipients) {
    const to = options.testEmail || teacher.email;
    if (!to) {
      result.skipped.push({ name: teacher.name, reason: "No email address" });
      continue;
    }

    try {
      await sendTeacherTimetableEmail({
        to,
        name: teacher.name,
        rows: teacher.rows,
      });
      result.sent.push(options.testEmail ? `${teacher.name} -> ${options.testEmail}` : teacher.name);
    } catch (error) {
      result.failed.push({ name: teacher.name, reason: error.message });
    }
  }

  return result;
};

const getSubjectsBySection = async (course_id, semester) => {
  const [rows] = await pool.query(
    `SELECT subject_id, subject_name AS name, subject_code,
            weekly_hours, credits, is_lab, preferred_slot
     FROM subjects
     WHERE course_id  = ?
       AND semester   = ?
       AND status     = 'ACTIVE'
       AND is_deleted = 0`,
    [course_id, semester]
  );
  return rows;
};

const getTeachersForSubject = async (subject_id, section_id) => {
  const [rows] = await pool.query(
    `SELECT t.teacher_id, t.name, t.max_hours_per_day, t.max_hours_per_week,
            ts.priority,
            CASE WHEN ts.section_id = ? THEN 1 ELSE 2 END AS specificity
     FROM teacher_subject ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = ?
       AND (ts.section_id = ? OR ts.section_id IS NULL)
       AND ts.is_deleted  = 0
       AND t.is_deleted   = 0
     ORDER BY specificity, ts.priority`,
    [section_id, subject_id, section_id]
  );
  return rows;
};

const getRoomsForSubject = async (is_lab) => {
  const roomType = is_lab ? "LAB" : "CLASSROOM";
  const [rows] = await pool.query(
    `SELECT room_id, room_no, capacity, room_type
     FROM rooms
     WHERE room_type  = ?
       AND status     = 'AVAILABLE'
       AND is_deleted = 0
     ORDER BY capacity DESC`,
    [roomType]
  );
  return rows;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

const DAY_TO_ISO = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };

const nextDateForDay = (dayName) => {
  const today    = new Date();
  const todayDow = today.getDay();
  const target   = DAY_TO_ISO[dayName] ?? 1;
  let diff = target - todayDow;
  if (diff < 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);
};

const buildGenerationScope = (options = {}) => {
  const scope = options.scope || "all";
  const sectionFilters = {};

  if (scope === "department") {
    if (!options.department_id || isNaN(Number(options.department_id))) {
      throw new Error("department_id is required for department timetable generation");
    }
    sectionFilters.department_id = Number(options.department_id);
  } else if (scope === "section") {
    if (!options.section_id || isNaN(Number(options.section_id))) {
      throw new Error("section_id is required for section timetable generation");
    }
    sectionFilters.section_id = Number(options.section_id);
  } else if (scope !== "all") {
    throw new Error("Invalid timetable generation scope");
  }

  return { scope, sectionFilters };
};

const calculateExpectedSlots = (sectionSubjects) =>
  sectionSubjects.reduce((total, item) => {
    const weeklyHours = Number(item.subject.weekly_hours) || (item.subject.is_lab ? 2 : 1);
    return total + (item.subject.is_lab ? Math.floor(weeklyHours / 2) * 2 : weeklyHours);
  }, 0);

const createTimetableInsertRows = (timetable, dateForDay) =>
  timetable.map((row) => [
    row.section_id,
    row.subject_id,
    row.teacher_id,
    row.room_id,
    row.slot_id,
    row.class_date || dateForDay[row.day],
  ]);

export const logUnassigned = ({ sectionSubjects, timetable, slotsByDay, availableDays, debugLogs = [], optimizerUnassigned = [] }) => {
  const expected = new Map();
  const actual = new Map();
  const sectionById = new Map();

  for (const item of sectionSubjects) {
    const weeklyHours = Number(item.subject.weekly_hours) || (item.subject.is_lab ? 2 : 1);
    const requiredHours = item.subject.is_lab ? Math.floor(weeklyHours / 2) * 2 : weeklyHours;
    const key = `${item.section.section_id}:${item.subject.subject_id}`;
    sectionById.set(item.section.section_id, item.section);
    expected.set(key, {
      section: item.section.name,
      section_id: item.section.section_id,
      subject: item.subject.name,
      subject_id: item.subject.subject_id,
      required: requiredHours,
    });
    actual.set(key, 0);
  }

  const occupiedBySection = new Set();
  for (const row of timetable) {
    const subjectKey = `${row.section_id}:${row.subject_id}`;
    actual.set(subjectKey, (actual.get(subjectKey) || 0) + 1);
    occupiedBySection.add(`${row.section_id}:${row.day}:${row.slot_id}`);
  }

  const unassignedSubjects = [];
  for (const [key, item] of expected.entries()) {
    const remaining = Math.max(item.required - (actual.get(key) || 0), 0);
    if (remaining > 0) {
      const optimizerReason = optimizerUnassigned.find((entry) =>
        entry.subject_id === item.subject_id && entry.section === item.section
      )?.reason;
      unassignedSubjects.push({
        section: item.section,
        subject: item.subject,
        remaining,
        reason: optimizerReason || "No valid teacher/room/slot combination found",
      });
    }
  }

  const emptySlots = [];
  for (const section of sectionById.values()) {
    for (const day of availableDays) {
      for (const slot of slotsByDay[day] || []) {
        if (!occupiedBySection.has(`${section.section_id}:${day}:${slot.slot_id}`)) {
          emptySlots.push({
            section: section.name,
            day,
            slot: slot.slot_order,
            slot_id: slot.slot_id,
          });
        }
      }
    }
  }

  // Only surface failure reasons for subjects that are actually unassigned.
  // Backtracking logs 'failed at SAT' etc. for every day it tries before
  // succeeding on another day — those are noise, not real errors.
  const unassignedLabels = new Set(
    unassignedSubjects.map((item) => `${item.section}: ${item.subject}`)
  );
  const failureReasons = unassignedSubjects.length > 0
    ? debugLogs
        .filter((message) => {
          if (!/failed|could not be placed|Fallback failed|no hard-valid/i.test(message)) return false;
          // Only keep messages that mention a subject that is truly unassigned
          return Array.from(unassignedLabels).some((label) => message.includes(label.split(': ')[1]));
        })
        .slice(0, 80)
    : [];

  return {
    unassignedSubjects,
    emptySlots: emptySlots.slice(0, 200),
    failureReasons,
  };
};

export const sendTimetableEmail = async (options = {}) => {
  const { sectionFilters } = buildGenerationScope(options);
  const sections = await getSections(sectionFilters);
  const sectionIds = sections.map((section) => section.section_id);
  if (!sectionIds.length) throw new Error("No active sections found for timetable email");
  return sendGeneratedTimetableEmails(sectionIds, { testEmail: options.testEmail });
};

const persistGeneratedTimetable = async (connection, scope, sectionIds, timetableInserts) => {
  if (scope === "all") {
    await connection.query(`DELETE FROM timetables`);
  } else {
    await connection.query(`DELETE FROM timetables WHERE section_id IN (?)`, [sectionIds]);
  }

  if (timetableInserts.length > 0) {
    await connection.query(
      `INSERT INTO timetables
       (section_id, subject_id, teacher_id, room_id, slot_id, class_date)
       VALUES ?`,
      [timetableInserts]
    );
  }
};

export const generateTimetable = async (options = {}) => {
  const connection = await pool.getConnection();

  try {
    const { scope, sectionFilters } = buildGenerationScope(options);
    await connection.beginTransaction();

    const sections = await getSections(sectionFilters, connection);
    const sectionIds = sections.map((section) => section.section_id);
    if (!sections.length) throw new Error("No active sections found for the selected scope");

    const slots = await getAvailableSlots();
    if (!slots.length) throw new Error("No active time slots found");

    const dateForDay = {};
    for (const day of DAY_ORDER) dateForDay[day] = nextDateForDay(day);

    const existingBusy = scope === "all"
      ? []
      : await getExistingTimetableRowsOutsideSections(sectionIds, connection);

    const sectionSubjects = [];
    const teacherById = new Map();
    const teachersBySubjectSection = new Map();
    const roomsBySubject = new Map();

    for (const section of sections) {
      const subjects = await getSubjectsBySection(section.course_id, section.semester);

      for (const subject of subjects) {
        const teachers = await getTeachersForSubject(subject.subject_id, section.section_id);
        const rooms = await getRoomsForSubject(subject.is_lab);

        teachers.forEach((teacher) => teacherById.set(teacher.teacher_id, teacher));
        teachersBySubjectSection.set(`${section.section_id}:${subject.subject_id}`, teachers);
        roomsBySubject.set(subject.subject_id, rooms);
        sectionSubjects.push({ section, subject, teachers, rooms });
      }
    }

    const optimizerContext = buildOptimizerContext(
      {
        sections,
        slots,
        dateForDay,
        existingBusy,
        sectionSubjects,
        teacherById,
        teachersBySubjectSection,
        roomsBySubject,
      },
      options.optimizer || {}
    );

    const initial = generateInitialTimetable(optimizerContext, options.optimizer || {});
    const optimized = options.useAnnealing === false
      ? { timetable: initial.timetable, score: initial.score, debugLogs: [] }
      : optimizeTimetable(initial.timetable, optimizerContext);
    const combinedDebugLogs = [...initial.debugLogs, ...optimized.debugLogs].slice(0, options.optimizer?.debugLimit || 300);

    const timetableInserts = createTimetableInsertRows(optimized.timetable, dateForDay);
    await persistGeneratedTimetable(connection, scope, sectionIds, timetableInserts);
    await connection.commit();

    const expectedSlots = calculateExpectedSlots(sectionSubjects);
    const missingSlots = Math.max(expectedSlots - timetableInserts.length, 0);
    const debugInfo = logUnassigned({
      sectionSubjects,
      timetable: optimized.timetable,
      slotsByDay: optimizerContext.slotsByDay,
      availableDays: optimizerContext.availableDays,
      debugLogs: combinedDebugLogs,
      optimizerUnassigned: initial.unassignedDetails || [],
    });
    const unassigned = missingSlots > 0
      ? [`${missingSlots} required slot(s) could not be assigned within the search limits`]
      : [];
    const assignmentIssues = [
      ...initial.hardViolations,
      ...(initial.timedOut ? ["Backtracking stopped early after reaching the configured performance limit"] : []),
      ...debugInfo.unassignedSubjects.map((item) => `${item.section}: ${item.subject} has ${item.remaining} unassigned hour(s) - ${item.reason}`),
      ...(missingSlots > 0 ? [`${missingSlots} required slot(s) remain unassigned`] : []),
      ...(await validateTimetableForSections(sectionIds)),
    ];

    const emailResult = {
      sent: [],
      failed: [],
      skipped: [],
      blocked: assignmentIssues.length > 0,
      issues: assignmentIssues,
      readyToSend: assignmentIssues.length === 0,
    };

    return {
      success: true,
      message: `Timetable generated for ${scope}! Assigned ${timetableInserts.length} slots. Score: ${optimized.score}.`,
      assignedCount: timetableInserts.length,
      score: optimized.score,
      unassigned,
      assignmentIssues,
      debugLogs: combinedDebugLogs,
      debugInfo,
      email: emailResult,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/* ===========================
   MAIN GENERATOR
=========================== */

const generateTimetableGreedy = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM timetables`);

    const sections = await getSections();
    const slots    = await getAvailableSlots();

    if (!sections.length) throw new Error("No active sections found");
    if (!slots.length)    throw new Error("No active time slots found");

    
    const isConsecutiveSlot = (a, b) => {
      if (!a || !b) return false;
      const endA   = new Date(`1970-01-01T${a.end_time}`);
      const startB = new Date(`1970-01-01T${b.start_time}`);
      const diff   = (startB - endA) / (1000 * 60);
      return diff >= 0 && diff <= 15;
    };

    
    const deduplicatedSlots = [];
    const seenSlotKey = new Set();
    for (const slot of slots) {
      const key = `${slot.day}_${slot.slot_order}`;
      if (!seenSlotKey.has(key)) {
        seenSlotKey.add(key);
        deduplicatedSlots.push(slot);
      }
    }

    // Group deduplicated slots by day
    const slotsByDay = {};
    for (const slot of deduplicatedSlots) {
      if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
      slotsByDay[slot.day].push(slot);
    }

    for (const day of Object.keys(slotsByDay)) {
      slotsByDay[day].sort((a, b) => a.slot_order - b.slot_order);
    }

    const availableDays = DAY_ORDER.filter(d => slotsByDay[d]?.length > 0);

    const teacherBusy  = {};
    const roomBusy     = {};
    const sectionBusy  = {};

    const teacherWeekHours = {};
    const teacherDayHours  = {};

    const initTeacher = (tid, maxDay, maxWeek) => {
      if (!teacherWeekHours[tid])
        teacherWeekHours[tid] = { count: 0, max: maxWeek };
      if (!teacherDayHours[tid]) teacherDayHours[tid] = {};
      for (const d of availableDays) {
        if (!teacherDayHours[tid][d])
          teacherDayHours[tid][d] = { count: 0, max: maxDay };
      }
    };

    const teacherWithinLimits = (tid, day) => {
      const wh = teacherWeekHours[tid];
      const dh = teacherDayHours[tid]?.[day];
      return wh && dh && wh.count < wh.max && dh.count < dh.max;
    };

    const teacherCanTakeSlots = (tid, day, count) => {
      const dh = teacherDayHours[tid]?.[day];
      return dh && dh.count + count <= dh.max;
    };

    const teacherCanTakeWeekSlots = (tid, count) => {
      const wh = teacherWeekHours[tid];
      return wh && wh.count + count <= wh.max;
    };

    const sectionDayCount = {};
    const initSectionDay  = (sid) => {
      if (!sectionDayCount[sid]) {
        sectionDayCount[sid] = {};
        for (const d of availableDays) sectionDayCount[sid][d] = 0;
      }
    };

    const subjectDayCount    = {};
    const getSubjectDayCount = (sid, day) => subjectDayCount[sid]?.[day] ?? 0;
    const incSubjectDayCount = (sid, day, n = 1) => {
      if (!subjectDayCount[sid]) subjectDayCount[sid] = {};
      subjectDayCount[sid][day] = (subjectDayCount[sid][day] ?? 0) + n;
    };

    const slotKey = (day, slotId) => `${day}_${slotId}`;

    const isTeacherFree = (tid, day, sid) =>
      !teacherBusy[slotKey(day, sid)]?.has(tid);

    const isRoomFree = (rid, day, sid) =>
      !roomBusy[slotKey(day, sid)]?.has(rid);

    const isSectionFree = (secId, day, sid) =>
      !sectionBusy[slotKey(day, sid)]?.has(secId);

    const markOccupied = (tid, rid, secId, day, slotId) => {
      const k = slotKey(day, slotId);
      if (!teacherBusy[k])  teacherBusy[k]  = new Set();
      if (!roomBusy[k])     roomBusy[k]     = new Set();
      if (!sectionBusy[k])  sectionBusy[k]  = new Set();
      teacherBusy[k].add(tid);
      roomBusy[k].add(rid);
      sectionBusy[k].add(secId);
      teacherWeekHours[tid].count++;
      teacherDayHours[tid][day].count++;
      sectionDayCount[secId][day]++;
    };

    const timetableInserts = [];
    const unassignedLogs   = [];

    const dateForDay = {};
    for (const day of availableDays) {
      dateForDay[day] = nextDateForDay(day);
    }

    for (const section of sections) {

      initSectionDay(section.section_id);

      const subjects = await getSubjectsBySection(
        section.course_id,
        section.semester
      );

      const pending = [];

      for (const subject of subjects) {
        const rawTeachers = await getTeachersForSubject(
          subject.subject_id,
          section.section_id
        );
        const rawRooms = await getRoomsForSubject(subject.is_lab);

        rawTeachers.forEach((t) =>
          initTeacher(
            t.teacher_id,
            t.max_hours_per_day  || 6,
            t.max_hours_per_week || 30
          )
        );

        pending.push({
          subject,
          rawTeachers,
          rawRooms,
          isLab:     !!subject.is_lab,
          remaining: subject.weekly_hours || (subject.is_lab ? 2 : 1),
        });
      }

      for (const day of availableDays) {
        const daySlots = slotsByDay[day];

       
        // This prevents Monday's last assigned subject from blocking Tuesday slot 1
        let lastSubjectAssigned = null;
        let lastWasLab          = false;

        let i = 0;

        while (i < daySlots.length) {
          let assigned  = false;
          let skipExtra = false; 

          const sortedPending = [...pending]
            .filter(e => e.remaining > 0)
            .sort((a, b) => b.remaining - a.remaining);

          for (const entry of sortedPending) {
            const { subject, rawTeachers, rawRooms, isLab } = entry;

            
            if (lastSubjectAssigned === subject.subject_id) continue;

            // ─── LAB BLOCK ─────────────────────────────────────────────
            if (isLab) {
              
              if (lastWasLab) continue;
              if (i + 1 >= daySlots.length) continue;

              const slotA = daySlots[i];
              const slotB = daySlots[i + 1];

              //  This correctly blocks labs from spanning the lunch break
              // (50-min gap between slot 4 end 12:50 and slot 6 start 13:40)
              if (!isConsecutiveSlot(slotA, slotB)) continue;
              if (entry.remaining < 2)               continue;

              //  Section free check BEFORE teacher/room loops
              if (
                !isSectionFree(section.section_id, day, slotA.slot_id) ||
                !isSectionFree(section.section_id, day, slotB.slot_id)
              ) continue;

              for (const teacher of rawTeachers) {
                if (
                  !isTeacherFree(teacher.teacher_id, day, slotA.slot_id) ||
                  !isTeacherFree(teacher.teacher_id, day, slotB.slot_id)
                ) continue;

                if (!teacherWithinLimits(teacher.teacher_id, day))    continue;
                if (!teacherCanTakeSlots(teacher.teacher_id, day, 2)) continue;
                if (!teacherCanTakeWeekSlots(teacher.teacher_id, 2))  continue;

                for (const room of rawRooms) {
                  if (room.capacity < section.strength) continue;
                  if (
                    !isRoomFree(room.room_id, day, slotA.slot_id) ||
                    !isRoomFree(room.room_id, day, slotB.slot_id)
                  ) continue;

                  timetableInserts.push([
                    section.section_id, subject.subject_id,
                    teacher.teacher_id, room.room_id,
                    slotA.slot_id, dateForDay[day],
                  ]);
                  timetableInserts.push([
                    section.section_id, subject.subject_id,
                    teacher.teacher_id, room.room_id,
                    slotB.slot_id, dateForDay[day],
                  ]);

                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slotA.slot_id);
                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slotB.slot_id);

                  incSubjectDayCount(subject.subject_id, day, 2);

                  entry.remaining    -= 2;
                  lastWasLab          = true;          
                  lastSubjectAssigned = subject.subject_id; 

                  assigned  = true;
                  skipExtra = true; //  skip slotB at bottom of while
                  break;
                }
                if (assigned) break;
              }
            }

            // ─── THEORY BLOCK ───────────────────────────────────────────
            else {
              const slot = daySlots[i];

              if (!isSectionFree(section.section_id, day, slot.slot_id)) continue;
              if (getSubjectDayCount(subject.subject_id, day) >= 2)       continue;

              for (const teacher of rawTeachers) {
                if (!isTeacherFree(teacher.teacher_id, day, slot.slot_id)) continue;
                if (!teacherWithinLimits(teacher.teacher_id, day))         continue;

                for (const room of rawRooms) {
                  if (room.capacity < section.strength)              continue;
                  if (!isRoomFree(room.room_id, day, slot.slot_id)) continue;

                  timetableInserts.push([
                    section.section_id, subject.subject_id,
                    teacher.teacher_id, room.room_id,
                    slot.slot_id, dateForDay[day],
                  ]);

                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slot.slot_id);

                  incSubjectDayCount(subject.subject_id, day); 

                  entry.remaining--;
                  lastWasLab          = false;              
                  lastSubjectAssigned = subject.subject_id; 

                  assigned = true;
                  break;
                }
                if (assigned) break;
              }
            }

            if (assigned) break;
          }

          if (!assigned) {
            unassignedLogs.push(`Empty slot ${day} slot_id=${daySlots[i].slot_id}`);
          }

          i++;
          if (skipExtra) i++; 
        }
      }

    }

    if (timetableInserts.length > 0) {
      await connection.query(
        `INSERT INTO timetables
         (section_id, subject_id, teacher_id, room_id, slot_id, class_date)
         VALUES ?`,
        [timetableInserts]
      );
    }

    await connection.commit();

    return {
      success:       true,
      message:       `Timetable generated! Assigned ${timetableInserts.length} slots.`,
      assignedCount: timetableInserts.length,
      unassigned:    unassignedLogs,
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/* ===========================
   DRAG & DROP SWAP
=========================== */

export const swapTimetableSlots = async (req, res) => {
  const { from, to } = req.body;
  // from / to shape:
  // { timetableId, slotId, sectionId, subjectId, teacherId, roomId, day, isLab }

  if (!from?.timetableId || !to?.slotId) {
    return res.status(400).json({ error: "Invalid swap payload" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Conflict check: FROM teacher moving to TO slot
    const [teacherConflict] = await connection.query(
      `SELECT 1 FROM timetables
       WHERE slot_id       = ?
         AND teacher_id    = ?
         AND timetable_id != ?
       LIMIT 1`,
      [to.slotId, from.teacherId, from.timetableId]
    );
    if (teacherConflict.length)
      return res.status(409).json({ error: "Teacher is busy at the target slot" });

    // Conflict check: FROM room moving to TO slot
    const [roomConflict] = await connection.query(
      `SELECT 1 FROM timetables
       WHERE slot_id       = ?
         AND room_id       = ?
         AND timetable_id != ?
       LIMIT 1`,
      [to.slotId, from.roomId, from.timetableId]
    );
    if (roomConflict.length)
      return res.status(409).json({ error: "Room is occupied at the target slot" });

    if (to.timetableId) {
      // Two-way swap: conflict check for TO entry moving to FROM slot
      const [teacherConflict2] = await connection.query(
        `SELECT 1 FROM timetables
         WHERE slot_id       = ?
           AND teacher_id    = ?
           AND timetable_id != ?
         LIMIT 1`,
        [from.slotId, to.teacherId, to.timetableId]
      );
      if (teacherConflict2.length)
        return res.status(409).json({ error: "Teacher is busy at the source slot" });

      await connection.query(
        `UPDATE timetables SET slot_id = ? WHERE timetable_id = ?`,
        [to.slotId, from.timetableId]
      );
      await connection.query(
        `UPDATE timetables SET slot_id = ? WHERE timetable_id = ?`,
        [from.slotId, to.timetableId]
      );
    } else {
      // One-way move to empty slot
      await connection.query(
        `UPDATE timetables SET slot_id = ? WHERE timetable_id = ?`,
        [to.slotId, from.timetableId]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Slots swapped successfully" });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/* ===========================
   FETCH
=========================== */

export const getTimetableForSection = async (section_id) => {
  const [rows] = await pool.query(
    `SELECT
       tt.timetable_id,
       tt.class_date,
       subj.subject_name,
       subj.is_lab,
       t.name     AS teacher_name,
       r.room_no,
       r.room_type,
       ts.day,
       ts.slot_order,
       ts.start_time,
       ts.end_time
     FROM timetables tt
     JOIN subjects   subj ON subj.subject_id = tt.subject_id
     JOIN teachers   t    ON t.teacher_id    = tt.teacher_id
     JOIN rooms      r    ON r.room_id       = tt.room_id
     JOIN time_slots ts   ON ts.slot_id      = tt.slot_id
     WHERE tt.section_id = ?
     ORDER BY FIELD(ts.day,'MON','TUE','WED','THU','FRI','SAT'), ts.slot_order`,
    [section_id]
  );
  return rows;
};

export const getAllTimetables = async () => {
  const [rows] = await pool.query(
    `SELECT
       tt.timetable_id,
       sec.section_name,
       subj.subject_name,
       t.name     AS teacher_name,
       r.room_no,
       ts.day,
       ts.start_time,
       ts.end_time
     FROM timetables tt
     JOIN sections   sec  ON sec.section_id  = tt.section_id
     JOIN subjects   subj ON subj.subject_id = tt.subject_id
     JOIN teachers   t    ON t.teacher_id    = tt.teacher_id
     JOIN rooms      r    ON r.room_id       = tt.room_id
     JOIN time_slots ts   ON ts.slot_id      = tt.slot_id
     ORDER BY sec.section_name,
       FIELD(ts.day,'MON','TUE','WED','THU','FRI','SAT'), ts.slot_order`
  );
  return rows;
};

export const getSectionsWithDepartment = async () => {
  const [rows] = await pool.query(
    `SELECT
       s.section_id,
       s.section_name,
       s.semester,
       s.batch_year,
       s.strength,
       COALESCE(s.max_slots_per_day, 6) AS max_slots_per_day,
       c.course_name,
       d.depart_id,
       d.name AS department_name
     FROM sections s
     LEFT JOIN courses    c ON c.course_id  = s.course_id
     LEFT JOIN department d ON d.depart_id  = c.depart_id
     WHERE s.is_deleted = 0
     ORDER BY d.name, s.section_name`
  );
  return rows;
};

export const getTimetableForTeacher = async (teacher_id) => {
  const [rows] = await pool.query(
    `SELECT
       tt.timetable_id,
       tt.class_date,
       sec.section_name,
       subj.subject_name,
       subj.is_lab,
       r.room_no,
       r.room_type,
       ts.day,
       ts.slot_order,
       ts.start_time,
       ts.end_time
     FROM timetables tt
     JOIN sections   sec  ON sec.section_id  = tt.section_id
     JOIN subjects   subj ON subj.subject_id = tt.subject_id
     JOIN rooms      r    ON r.room_id       = tt.room_id
     JOIN time_slots ts   ON ts.slot_id      = tt.slot_id
     WHERE tt.teacher_id = ?
     ORDER BY
       FIELD(ts.day,'MON','TUE','WED','THU','FRI','SAT'),
       ts.slot_order`,
    [teacher_id]
  );
  return rows;
};