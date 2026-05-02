import test from "node:test";
import assert from "node:assert/strict";

import { pool } from "../config/dbConn.js";
import { roomNoExists } from "../model/room.model.js";

const originalQuery = pool.query;

test.afterEach(() => {
  pool.query = originalQuery;
});

test("roomNoExists checks room number within the selected building only", async () => {
  let queryCall;
  pool.query = async (sql, params) => {
    queryCall = { sql, params };
    return [[]];
  };

  const exists = await roomNoExists("101", 2);

  assert.equal(exists, false);
  assert.match(queryCall.sql, /room_no = \?/);
  assert.match(queryCall.sql, /building_id = \?/);
  assert.deepEqual(queryCall.params, ["101", 2]);
});

test("roomNoExists can exclude the room being updated", async () => {
  let queryCall;
  pool.query = async (sql, params) => {
    queryCall = { sql, params };
    return [[]];
  };

  await roomNoExists("101", 2, 9);

  assert.match(queryCall.sql, /room_id != \?/);
  assert.deepEqual(queryCall.params, ["101", 2, 9]);
});
