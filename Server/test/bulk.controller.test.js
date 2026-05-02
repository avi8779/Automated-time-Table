import test from "node:test";
import assert from "node:assert/strict";
import xlsx from "xlsx";

import {
  bulkBuildings,
  bulkRooms,
  bulkCourses,
  bulkTeachers,
  bulkSubjects,
  bulkSections,
  bulkStudents,
  bulkTeacherSubjects,
  downloadTemplate,
} from "../Controller/bulk.controller.js";
import { pool } from "../config/dbConn.js";

const originalQuery = pool.query;

const excelBuffer = (rows) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

const reqWithRows = (rows) => ({
  file: {
    buffer: excelBuffer(rows),
  },
});

const createRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
};

const mockQuery = (handler) => {
  const calls = [];

  pool.query = async (sql, params) => {
    calls.push({ sql, params });
    return handler(sql, params);
  };

  return calls;
};

test.afterEach(() => {
  pool.query = originalQuery;
});

test("bulkBuildings inserts floors from supported Excel headers", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT building_id, is_deleted")) return [[]];
    return [{ affectedRows: 1 }];
  });
  const floorRes = createRes();
  const buildingFloorRes = createRes();

  await bulkBuildings(
    reqWithRows([
      { building_name: "Main Block", building_code: "MB", floor: 3 },
    ]),
    floorRes
  );
  await bulkBuildings(
    reqWithRows([
      { "Building Name": "Science Block", "Building Code": "SB", "Building Floor": 4 },
    ]),
    buildingFloorRes
  );

  assert.equal(floorRes.statusCode, 200);
  assert.deepEqual(floorRes.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(buildingFloorRes.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  const insertCalls = calls.filter((call) => call.sql.includes("INSERT INTO buildings"));
  assert.equal(insertCalls.length, 2);
  assert.deepEqual(insertCalls[0].params, ["Main Block", "MB", 3]);
  assert.deepEqual(insertCalls[1].params, ["Science Block", "SB", 4]);
});

test("bulkBuildings reports missing floors and existing database duplicates", async () => {
  mockQuery((sql) => {
    if (sql.includes("SELECT building_id, is_deleted")) {
      return [[{ building_id: 1, is_deleted: 0 }]];
    }
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkBuildings(
    reqWithRows([
      { building_name: "Duplicate Block", building_code: "DB", floors: 2 },
      { building_name: "No Floor Block", building_code: "NF" },
    ]),
    res
  );

  assert.equal(res.body.success, true);
  assert.equal(res.body.inserted, 0);
  assert.equal(res.body.skipped, 2);
  assert.deepEqual(res.body.errors, [
    'Row 2: building_code "DB" already exists',
    "Row 3: building_name, building_code and floors are required",
  ]);
});

test("bulkBuildings reports when code exists only as a deleted building", async () => {
  mockQuery((sql) => {
    if (sql.includes("SELECT building_id, is_deleted")) {
      return [[{ building_id: 1, is_deleted: 1 }]];
    }
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkBuildings(
    reqWithRows([{ building_name: "Old Block", building_code: "OB", floors: 2 }]),
    res
  );

  assert.equal(res.body.success, true);
  assert.equal(res.body.inserted, 0);
  assert.equal(res.body.skipped, 1);
  assert.deepEqual(res.body.errors, [
    'Row 2: building_code "OB" already exists in deleted buildings. Use a different code or restore that building first.',
  ]);
});

test("bulkBuildings reports duplicate rows inside the uploaded Excel file", async () => {
  mockQuery((sql) => {
    if (sql.includes("SELECT building_id, is_deleted")) return [[]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkBuildings(
    reqWithRows([
      { building_name: "Main Block", building_code: "MB", floors: 2 },
      { building_name: "Main Block Again", building_code: "MB", floors: 3 },
    ]),
    res
  );

  assert.equal(res.body.success, true);
  assert.equal(res.body.inserted, 1);
  assert.equal(res.body.skipped, 1);
  assert.deepEqual(res.body.errors, ['Row 3: Duplicate in Excel file - building_code "MB" appears more than once']);
});

test("bulkRooms inserts room rows and resolves building code", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT building_id")) return [[{ building_id: 10 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkRooms(reqWithRows([{ room_no: "101", room_type: "LAB", capacity: 45, building_code: "MB" }]), res);

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(calls.at(-1).params, ["101", "LAB", 45, 10]);
});

test("bulkCourses inserts course rows and resolves department code", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT depart_id")) return [[{ depart_id: 7 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkCourses(
    reqWithRows([{ course_name: "B.Tech CSE", course_code: "BTCSE", department_code: "CSE", duration_years: 4 }]),
    res
  );

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(calls.at(-1).params, ["B.Tech CSE", "BTCSE", 7, 4]);
});

test("bulkTeachers inserts teacher rows with hashed password and department id", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT depart_id")) return [[{ depart_id: 3 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkTeachers(
    reqWithRows([{ name: "Dr. Smith", email: "smith@example.com", password: "teacher123", department_code: "CSE" }]),
    res
  );

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.equal(calls.at(-1).params[0], "Dr. Smith");
  assert.equal(calls.at(-1).params[1], "smith@example.com");
  assert.notEqual(calls.at(-1).params[7], "teacher123");
  assert.equal(calls.at(-1).params[8], 3);
});

test("bulkSubjects inserts subject rows and resolves course code", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT course_id")) return [[{ course_id: 12 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkSubjects(
    reqWithRows([{ subject_name: "Data Structures", subject_code: "CS301", course_code: "BTCSE", is_lab: "yes" }]),
    res
  );

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(calls.at(-1).params, ["Data Structures", "CS301", 12, 1, 3, 3, 1, "ANY"]);
});

test("bulkSections inserts section rows only when course exists", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT course_id")) return [[{ course_id: 9 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkSections(
    reqWithRows([{ section_name: "CSE-A", course_code: "BTCSE", semester: 3, strength: 60, batch_year: 2024 }]),
    res
  );

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(calls.at(-1).params, ["CSE-A", 9, 3, 60, 2024, 6, "ACTIVE"]);
});

test("bulkStudents inserts student rows only when section exists", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT section_id")) return [[{ section_id: 5 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkStudents(reqWithRows([{ name: "John Doe", roll_number: "2024001", section_name: "CSE-A" }]), res);

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.equal(calls.at(-1).params[0], "John Doe");
  assert.equal(calls.at(-1).params[1], "2024001");
  assert.notEqual(calls.at(-1).params[2], "student123");
  assert.equal(calls.at(-1).params[3], 5);
});

test("bulkTeacherSubjects inserts mapping when teacher and subject exist", async () => {
  const calls = mockQuery((sql) => {
    if (sql.includes("SELECT teacher_id")) return [[{ teacher_id: 2 }]];
    if (sql.includes("SELECT subject_id")) return [[{ subject_id: 8 }]];
    return [{ affectedRows: 1 }];
  });
  const res = createRes();

  await bulkTeacherSubjects(reqWithRows([{ teacher_email: "smith@example.com", subject_code: "CS301", priority: 2 }]), res);

  assert.deepEqual(res.body, { success: true, inserted: 1, skipped: 0, errors: [] });
  assert.deepEqual(calls.at(-1).params, [2, 8, 2]);
});

test("downloadTemplate returns one Excel sheet with reference codes to the right of upload columns", async () => {
  mockQuery(() => [[{ building_code: "MB", building_name: "Main Block", floors: 3 }]]);
  const res = createRes();

  await downloadTemplate({ params: { entity: "rooms" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.ok(Buffer.isBuffer(res.body));
  assert.ok(res.body.length > 0);

  const wb = xlsx.read(res.body, { type: "buffer" });
  assert.deepEqual(wb.SheetNames, ["Template"]);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets.Template, { header: 1, defval: "" });
  assert.deepEqual(rows[0].slice(0, 4), ["room_no", "room_type", "capacity", "building_code"]);
  assert.equal(rows[0][6], "Building Codes");
  assert.ok(rows.some((row) => row[6] === "MB"));
});

test("downloadTemplate returns 404 for unknown entities", async () => {
  const res = createRes();

  await downloadTemplate({ params: { entity: "unknown" } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, message: "Unknown entity" });
});
