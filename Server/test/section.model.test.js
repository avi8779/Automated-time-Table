import test from "node:test";
import assert from "node:assert/strict";

import { pool } from "../config/dbConn.js";
import { createSection, updateSection, getAllSections, getSectionConflict } from "../model/section.model.js";

const originalQuery = pool.query;

test.afterEach(() => {
  pool.query = originalQuery;
});

test("getAllSections returns course id and max slots fields from the query", async () => {
  let sqlText = "";
  pool.query = async (sql) => {
    sqlText = sql;
    return [[]];
  };

  await getAllSections();

  assert.match(sqlText, /s\.course_id/);
  assert.match(sqlText, /s\.max_slots_per_day/);
});

test("createSection persists max_slots_per_day", async () => {
  let params = [];
  pool.query = async (_sql, values) => {
    params = values;
    return [{ insertId: 12 }];
  };

  const id = await createSection({
    section_name: "CSE-A",
    course_id: 1,
    semester: 3,
    strength: 60,
    batch_year: 2024,
    max_slots_per_day: 7,
    status: "ACTIVE",
  });

  assert.equal(id, 12);
  assert.deepEqual(params, ["CSE-A", 1, 3, 60, 2024, 7, "ACTIVE"]);
});

test("updateSection persists max_slots_per_day", async () => {
  let params = [];
  pool.query = async (_sql, values) => {
    params = values;
    return [{ affectedRows: 1 }];
  };

  const affected = await updateSection(9, {
    section_name: "CSE-A",
    course_id: 1,
    semester: 3,
    strength: 60,
    batch_year: 2024,
    max_slots_per_day: 8,
    status: "ACTIVE",
  });

  assert.equal(affected, 1);
  assert.deepEqual(params, ["CSE-A", 1, 3, 60, 2024, 8, "ACTIVE", 9]);
});

test("getSectionConflict checks course, batch year, and section name together", async () => {
  let queryCall;
  pool.query = async (sql, params) => {
    queryCall = { sql, params };
    return [[{ section_id: 4, is_deleted: 1 }]];
  };

  const conflict = await getSectionConflict(1, 2024, "CSE-A", 9);

  assert.deepEqual(conflict, { section_id: 4, is_deleted: 1 });
  assert.match(queryCall.sql, /course_id = \?/);
  assert.match(queryCall.sql, /batch_year = \?/);
  assert.match(queryCall.sql, /section_name = \?/);
  assert.match(queryCall.sql, /section_id != \?/);
  assert.deepEqual(queryCall.params, [1, 2024, "CSE-A", 9]);
});
