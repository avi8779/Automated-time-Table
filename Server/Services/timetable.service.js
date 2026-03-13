import { pool } from "../config/dbConn.js";

/* ===========================
   HELPER QUERIES
=========================== */

const getAvailableSlots = async () => {
  const [rows] = await pool.query(
    `SELECT slot_id, day, slot_order, start_time, end_time
     FROM time_slots
     WHERE is_break = 0 AND status = 'ACTIVE'
     ORDER BY day, slot_order`
  );
  return rows;
};

const getSections = async () => {
  const [rows] = await pool.query(
    `SELECT
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
     WHERE s.is_deleted = 0`
  );
  return rows;
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

const getTeachersForSubject = async (subject_id) => {
  const [rows] = await pool.query(
    `SELECT t.teacher_id, t.name, t.max_hours_per_day, t.max_hours_per_week
     FROM teacher_subject ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = ?
       AND ts.is_deleted  = 0
       AND t.is_deleted   = 0`,
    [subject_id]
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

/* Returns the next calendar date (YYYY-MM-DD) for a given day name.
   e.g. if today is Wednesday and day="MON", returns next Monday's date. */
const DAY_TO_ISO = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };
const nextDateForDay = (dayName) => {
  const today   = new Date();
  const todayDow = today.getDay();                  // 0=Sun … 6=Sat
  const target   = DAY_TO_ISO[dayName] ?? 1;
  let diff = target - todayDow;
  if (diff <= 0) diff += 7;                         // always next occurrence
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);           // "YYYY-MM-DD"
};

/* ===========================
   MAIN GENERATOR
=========================== */

export const generateTimetable = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM timetables`);

    const sections = await getSections();
    const slots    = await getAvailableSlots();

    if (!sections.length) throw new Error("No active sections found");
    if (!slots.length)    throw new Error("No active time slots found");

    // Group slots by day, sorted morning → afternoon
    const slotsByDay = {};
    for (const slot of slots) {
      if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
      slotsByDay[slot.day].push(slot);
    }
    for (const day of Object.keys(slotsByDay)) {
      slotsByDay[day].sort((a, b) => a.slot_order - b.slot_order);
    }
    const availableDays = DAY_ORDER.filter((d) => slotsByDay[d]?.length > 0);

    // Conflict sets  key = "day_slotId"
    const teacherBusy = {};
    const roomBusy    = {};
    const sectionBusy = {};

    // Teacher hour counters
    const teacherWeekHours = {};
    const teacherDayHours  = {};

    const initTeacher = (tid, maxDay, maxWeek) => {
      if (!teacherWeekHours[tid]) teacherWeekHours[tid] = { count: 0, max: maxWeek };
      if (!teacherDayHours[tid])  teacherDayHours[tid]  = {};
      availableDays.forEach((d) => {
        if (!teacherDayHours[tid][d]) teacherDayHours[tid][d] = { count: 0, max: maxDay };
      });
    };

    // Per-section daily slot counter
    const sectionDayCount = {};
    const initSectionDay  = (sid) => {
      if (!sectionDayCount[sid]) {
        sectionDayCount[sid] = {};
        availableDays.forEach((d) => { sectionDayCount[sid][d] = 0; });
      }
    };

    const slotKey       = (day, slotId) => `${day}_${slotId}`;
    const isTeacherFree = (tid, day, sid) => !teacherBusy[slotKey(day, sid)]?.has(tid);
    const isRoomFree    = (rid, day, sid) => !roomBusy[slotKey(day, sid)]?.has(rid);
    const isSectionFree = (secId, day, sid) => !sectionBusy[slotKey(day, sid)]?.has(secId);

    const teacherWithinLimits = (tid, day) => {
      const wh = teacherWeekHours[tid];
      const dh = teacherDayHours[tid]?.[day];
      return wh && dh && wh.count < wh.max && dh.count < dh.max;
    };

    const sectionDayWithinLimit = (secId, day, maxPerDay) =>
      (sectionDayCount[secId]?.[day] ?? 0) < maxPerDay;

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

    // Pre-compute the next calendar date for each weekday
    const dateForDay = {};
    for (const day of availableDays) {
      dateForDay[day] = nextDateForDay(day);
    }

    for (const section of sections) {
      // Use section's own max_slots_per_day — fully configurable per section
      const maxPerDay = section.max_slots_per_day ?? 6;

      initSectionDay(section.section_id);

      const subjects = await getSubjectsBySection(section.course_id, section.semester);

      if (!subjects.length) {
        unassignedLogs.push(`No subjects for section ${section.name} (sem ${section.semester})`);
        continue;
      }

      for (const subject of subjects) {
        let remainingHours = subject.weekly_hours || 1;

        const rawTeachers = await getTeachersForSubject(subject.subject_id);
        const rawRooms    = await getRoomsForSubject(subject.is_lab);

        if (!rawTeachers.length) {
          unassignedLogs.push(`No teachers for "${subject.name}" (section ${section.name})`);
          continue;
        }
        if (!rawRooms.length) {
          unassignedLogs.push(`No ${subject.is_lab ? "labs" : "classrooms"} for "${subject.name}" (section ${section.name})`);
          continue;
        }

        rawTeachers.forEach((t) =>
          initTeacher(t.teacher_id, t.max_hours_per_day || 6, t.max_hours_per_week || 30)
        );

        // Labs need 2 CONSECUTIVE slots on the same day, same teacher+room
        // Theory subjects fill one slot at a time
        const isLab       = !!subject.is_lab;
        const slotsNeeded = isLab ? 2 : 1;   // lab = 2 back-to-back slots per session

        // Fill-day-first: fill up to maxPerDay slots per day before moving on
        outer:
        for (const day of availableDays) {
          if (remainingHours <= 0) break;

          const daySlots = slotsByDay[day];

          for (let i = 0; i < daySlots.length; i++) {
            if (remainingHours <= 0) break outer;

            // Section daily limit — need room for slotsNeeded slots
            const dayUsed = sectionDayCount[section.section_id]?.[day] ?? 0;
            if (dayUsed + slotsNeeded > maxPerDay) break;  // no room left today

            // For labs: check that slot[i] and slot[i+1] are consecutive by slot_order
            if (isLab) {
              if (i + 1 >= daySlots.length) continue;
              const slotA = daySlots[i];
              const slotB = daySlots[i + 1];
              // Must be adjacent slot_order (no gap)
              if (slotB.slot_order !== slotA.slot_order + 1) continue;
              // Both must be free for this section
              if (!isSectionFree(section.section_id, day, slotA.slot_id)) continue;
              if (!isSectionFree(section.section_id, day, slotB.slot_id)) continue;

              // Preferred slot filter on first slot
              if (subject.preferred_slot && subject.preferred_slot !== "ANY") {
                const hour = parseInt((slotA.start_time || "00:00").split(":")[0], 10);
                if (subject.preferred_slot === "MORNING"   && hour >= 12) continue;
                if (subject.preferred_slot === "AFTERNOON" && hour < 12)  continue;
              }

              const teachers = shuffle(rawTeachers);
              const rooms    = shuffle(rawRooms);

              for (const teacher of teachers) {
                if (!isTeacherFree(teacher.teacher_id, day, slotA.slot_id)) continue;
                if (!isTeacherFree(teacher.teacher_id, day, slotB.slot_id)) continue;
                if (!teacherWithinLimits(teacher.teacher_id, day))          continue;
                // Teacher needs 2 hours free today
                const tdh = teacherDayHours[teacher.teacher_id]?.[day];
                if (!tdh || tdh.count + 2 > tdh.max) continue;

                for (const room of rooms) {
                  if (!isRoomFree(room.room_id, day, slotA.slot_id)) continue;
                  if (!isRoomFree(room.room_id, day, slotB.slot_id)) continue;

                  // Book both slots as a pair
                  timetableInserts.push([section.section_id, subject.subject_id, teacher.teacher_id, room.room_id, slotA.slot_id, dateForDay[day]]);
                  timetableInserts.push([section.section_id, subject.subject_id, teacher.teacher_id, room.room_id, slotB.slot_id, dateForDay[day]]);

                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slotA.slot_id);
                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slotB.slot_id);
                  remainingHours -= 2;
                  i++;  // skip slotB in the outer loop
                  break;
                }
                if (!isSectionFree(section.section_id, day, slotA.slot_id)) break;
              }

            } else {
              // Theory — single slot
              const slot = daySlots[i];

              if (!isSectionFree(section.section_id, day, slot.slot_id)) continue;

              // Preferred slot filter
              if (subject.preferred_slot && subject.preferred_slot !== "ANY") {
                const hour = parseInt((slot.start_time || "00:00").split(":")[0], 10);
                if (subject.preferred_slot === "MORNING"   && hour >= 12) continue;
                if (subject.preferred_slot === "AFTERNOON" && hour < 12)  continue;
              }

              const teachers = shuffle(rawTeachers);
              const rooms    = shuffle(rawRooms);

              for (const teacher of teachers) {
                if (!isTeacherFree(teacher.teacher_id, day, slot.slot_id)) continue;
                if (!teacherWithinLimits(teacher.teacher_id, day))         continue;

                for (const room of rooms) {
                  if (!isRoomFree(room.room_id, day, slot.slot_id)) continue;

                  timetableInserts.push([
                    section.section_id,
                    subject.subject_id,
                    teacher.teacher_id,
                    room.room_id,
                    slot.slot_id,
                    dateForDay[day],
                  ]);

                  markOccupied(teacher.teacher_id, room.room_id, section.section_id, day, slot.slot_id);
                  remainingHours--;
                  break;
                }
                if (!isSectionFree(section.section_id, day, slot.slot_id)) break;
              }
            }
          }
        }

        if (remainingHours > 0) {
          unassignedLogs.push(
            `Could not assign all hours for "${subject.name}" (section ${section.name}). Remaining: ${remainingHours}`
          );
        }
      }
    }

    if (timetableInserts.length > 0) {
      await connection.query(
        `INSERT INTO timetables (section_id, subject_id, teacher_id, room_id, slot_id, class_date)
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

/* Teacher's own timetable — all sections they teach */
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