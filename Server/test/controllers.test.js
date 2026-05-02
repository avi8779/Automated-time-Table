import test from "node:test";
import assert from "node:assert/strict";

import { adminLogin } from "../Controller/auth.controller.js";
import { createBuilding } from "../Controller/building.controller.js";
import { createCourse } from "../Controller/course.controller.js";
import { createDepartment } from "../Controller/department.controller.js";
import { sendCredentials } from "../Controller/notify.controller.js";
import { createRoom } from "../Controller/room.controller.js";
import { createSectionController } from "../Controller/section.controller.js";
import { createSubject } from "../Controller/subject.controller.js";
import { createTeacher } from "../Controller/teacher.controller.js";
import { assignSubjectController } from "../Controller/teacherSubject.controller.js";
import { createTimeSlot } from "../Controller/timeSlots.controller.js";
import { getTimetableBySection } from "../Controller/timetable.controller.js";

const createRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const expectNextError = (handler, req, expectedStatus, expectedMessage) =>
  new Promise((resolve, reject) => {
    const res = createRes();
    handler(req, res, (err) => {
      try {
        assert.equal(err.statusCode, expectedStatus);
        assert.equal(err.message, expectedMessage);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

test("auth.controller adminLogin returns 400 when credentials are missing", async () => {
  const res = createRes();

  await adminLogin({ body: { username: "admin" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "Username and password required" });
});

test("building.controller createBuilding validates required fields", async () => {
  await expectNextError(
    createBuilding,
    { body: { building_code: "MB" } },
    400,
    "All fields are required"
  );
});

test("course.controller createCourse validates required fields", async () => {
  await expectNextError(
    createCourse,
    { body: { course_code: "CSE" } },
    400,
    "All fields are required"
  );
});

test("department.controller createDepartment validates required fields", async () => {
  await expectNextError(
    createDepartment,
    { body: { department_code: "CSE" } },
    400,
    "All fields are required"
  );
});

test("notify.controller sendCredentials rejects empty recipient lists", async () => {
  const res = createRes();

  await sendCredentials({ body: { recipients: [] } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "No recipients provided" });
});

test("room.controller createRoom validates required fields", async () => {
  await expectNextError(
    createRoom,
    { body: { room_no: "101" } },
    400,
    "All required fields must be provided"
  );
});

test("section.controller createSectionController validates required fields", async () => {
  const res = createRes();

  await createSectionController({ body: { section_name: "CSE-A" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "All fields are required" });
});

test("subject.controller createSubject validates required fields", async () => {
  await expectNextError(
    createSubject,
    { body: { subject_code: "CS301" } },
    400,
    "All required fields must be provided"
  );
});

test("teacher.controller createTeacher validates required fields", async () => {
  await expectNextError(
    createTeacher,
    { body: { teacher_code: "T001" } },
    400,
    "All required fields must be provided"
  );
});

test("teacherSubject.controller assignSubjectController validates required ids", async () => {
  const res = createRes();

  await assignSubjectController({ body: { teacher_id: 1 } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "teacher_id and subject_id are required" });
});

test("timeSlots.controller createTimeSlot returns model validation errors", async () => {
  const res = createRes();

  await createTimeSlot(
    { body: { day: "Monday", slot_order: 1, start_time: "11:00", end_time: "10:00" } },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: "End time must be greater than start time" });
});

test("timetable.controller getTimetableBySection validates section_id", async () => {
  await expectNextError(
    getTimetableBySection,
    { params: { section_id: "abc" } },
    400,
    "Invalid section_id"
  );
});
