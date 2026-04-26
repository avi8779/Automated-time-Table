import { pool } from "../config/dbConn.js";

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