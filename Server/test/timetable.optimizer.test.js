import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOptimizerContext,
  calculateScore,
  generateInitialTimetable,
} from "../Services/timetable.optimizer.js";

test("backtracking scheduler assigns labs as continuous blocks without hard conflicts", () => {
  const section = {
    section_id: 1,
    name: "CSE-A",
    strength: 40,
    max_slots_per_day: 4,
  };
  const teacher = {
    teacher_id: 1,
    name: "Dr A",
    max_hours_per_day: 4,
    max_hours_per_week: 8,
  };
  const classroom = {
    room_id: 1,
    room_no: "101",
    room_type: "CLASSROOM",
    capacity: 60,
  };
  const labRoom = {
    room_id: 2,
    room_no: "L1",
    room_type: "LAB",
    capacity: 60,
  };
  const lab = {
    subject_id: 10,
    name: "DB Lab",
    weekly_hours: 2,
    is_lab: 1,
  };
  const theory = {
    subject_id: 11,
    name: "Mathematics",
    weekly_hours: 2,
    is_lab: 0,
  };
  const slots = [
    { slot_id: 1, day: "MON", slot_order: 1, start_time: "09:00:00", end_time: "10:00:00" },
    { slot_id: 2, day: "MON", slot_order: 2, start_time: "10:00:00", end_time: "11:00:00" },
    { slot_id: 3, day: "TUE", slot_order: 1, start_time: "09:00:00", end_time: "10:00:00" },
    { slot_id: 4, day: "TUE", slot_order: 2, start_time: "10:00:00", end_time: "11:00:00" },
  ];
  const sectionSubjects = [
    { section, subject: lab, teachers: [teacher], rooms: [labRoom] },
    { section, subject: theory, teachers: [teacher], rooms: [classroom] },
  ];
  const context = buildOptimizerContext(
    {
      sections: [section],
      slots,
      dateForDay: { MON: "2026-05-04", TUE: "2026-05-05" },
      existingBusy: [],
      sectionSubjects,
      teacherById: new Map([[teacher.teacher_id, teacher]]),
      teachersBySubjectSection: new Map([
        [`${section.section_id}:${lab.subject_id}`, [teacher]],
        [`${section.section_id}:${theory.subject_id}`, [teacher]],
      ]),
      roomsBySubject: new Map([
        [lab.subject_id, [labRoom]],
        [theory.subject_id, [classroom]],
      ]),
    },
    { annealingIterations: 10 }
  );

  const result = generateInitialTimetable(context, { annealingIterations: 10 });
  const labRows = result.timetable.filter((row) => row.subject_id === lab.subject_id);
  const score = calculateScore(result.timetable, context);

  assert.equal(result.complete, true);
  assert.equal(result.timetable.length, 4);
  assert.equal(score.hardViolations.length, 0);
  assert.equal(labRows.length, 2);
  assert.equal(labRows[0].day, labRows[1].day);
  assert.equal(Math.abs(labRows[0].slot_order - labRows[1].slot_order), 1);
});
