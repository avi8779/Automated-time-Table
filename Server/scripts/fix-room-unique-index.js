import { pool } from "../config/dbConn.js";

const run = async () => {
  const [indexes] = await pool.query("SHOW INDEX FROM rooms");
  const roomNoUniqueIndexes = indexes.filter(
    (idx) => idx.Non_unique === 0 && idx.Column_name === "room_no"
  );
  const compositeExists = indexes.some(
    (idx) => idx.Non_unique === 0 && idx.Key_name === "unique_room_per_building"
  );

  for (const index of roomNoUniqueIndexes) {
    if (index.Key_name !== "PRIMARY" && index.Key_name !== "unique_room_per_building") {
      await pool.query(`ALTER TABLE rooms DROP INDEX \`${index.Key_name}\``);
      console.log(`Dropped unique index: ${index.Key_name}`);
    }
  }

  if (!compositeExists) {
    await pool.query(
      "ALTER TABLE rooms ADD UNIQUE KEY unique_room_per_building (building_id, room_no)"
    );
    console.log("Added unique index: unique_room_per_building (building_id, room_no)");
  } else {
    console.log("Composite unique index already exists.");
  }

  await pool.end();
};

run().catch(async (err) => {
  console.error(err.message);
  await pool.end();
  process.exit(1);
});
