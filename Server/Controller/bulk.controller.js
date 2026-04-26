import xlsx from "xlsx";
import bcrypt from "bcrypt";
import { pool } from "../config/dbConn.js";

/* ── HELPER: parse uploaded file buffer → array of row objects ── */
const parseExcel = (buffer) => {
  const wb   = xlsx.read(buffer, { type: "buffer" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: "" });
};

/* ── HELPER: clean string ── */
const str  = (v) => String(v ?? "").trim();
const num  = (v) => Number(v) || 0;
const bool = (v) => ["1","true","yes"].includes(String(v).toLowerCase());

/* ════════════════════════════════════════════
   BUILDINGS
════════════════════════════════════════════ */
export const bulkBuildings = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const building_name = str(row["building_name"] || row["Building Name"] || row["name"]);
      const building_code = str(row["building_code"] || row["Building Code"] || row["code"]);
      if (!building_name || !building_code) {
        errors.push(`Row ${i+2}: building_name and building_code are required`);
        continue;
      }
      try {
        await pool.query(
          `INSERT IGNORE INTO buildings (building_name, building_code) VALUES (?,?)`,
          [building_name, building_code]
        );
        inserted++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   ROOMS
════════════════════════════════════════════ */
export const bulkRooms = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const room_no   = str(row["room_no"]   || row["Room No"]   || row["room"]);
      const room_type = str(row["room_type"] || row["Room Type"] || "CLASSROOM").toUpperCase();
      const capacity  = num(row["capacity"]  || row["Capacity"]  || 60);
      const building_code = str(row["building_code"] || row["Building Code"] || "");

      if (!room_no) { errors.push(`Row ${i+2}: room_no is required`); continue; }

      let building_id = null;
      if (building_code) {
        const [b] = await pool.query("SELECT building_id FROM buildings WHERE building_code=?", [building_code]);
        if (b.length) building_id = b[0].building_id;
      }

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO rooms (room_no, room_type, capacity, building_id) VALUES (?,?,?,?)`,
          [room_no, room_type, capacity, building_id]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   COURSES
════════════════════════════════════════════ */
export const bulkCourses = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const course_name = str(row["course_name"] || row["Course Name"]);
      const course_code = str(row["course_code"] || row["Course Code"]);
      const dept_code   = str(row["department_code"] || row["Department Code"] || row["dept_code"]);
      const duration    = num(row["duration_years"] || row["Duration"] || 2);

      if (!course_name || !course_code) {
        errors.push(`Row ${i+2}: course_name and course_code are required`); continue;
      }

      let depart_id = null;
      if (dept_code) {
        const [d] = await pool.query("SELECT depart_id FROM department WHERE department_code=?", [dept_code]);
        if (d.length) depart_id = d[0].depart_id;
      }

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO courses (course_name, course_code, depart_id, duration_years) VALUES (?,?,?,?)`,
          [course_name, course_code, depart_id, duration]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   TEACHERS
════════════════════════════════════════════ */
export const bulkTeachers = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const name              = str(row["name"]              || row["Name"]);
      const email             = str(row["email"]             || row["Email"]);
      const phone             = str(row["phone"]             || row["Phone"]             || "");
      const qualification     = str(row["qualification"]     || row["Qualification"]     || "");
      const specialization    = str(row["specialization"]    || row["Specialization"]    || "");
      const max_hours_per_day = num(row["max_hours_per_day"] || row["Max Hours/Day"]     || 6);
      const max_hours_per_week= num(row["max_hours_per_week"]|| row["Max Hours/Week"]    || 30);
      const password_plain    = str(row["password"]          || row["Password"]          || "teacher123");
      const dept_code         = str(row["department_code"]   || row["Department Code"]   || "");

      if (!name || !email) {
        errors.push(`Row ${i+2}: name and email are required`); continue;
      }

      let depart_id = null;
      if (dept_code) {
        const [d] = await pool.query("SELECT depart_id FROM department WHERE department_code=?", [dept_code]);
        if (d.length) depart_id = d[0].depart_id;
      }

      const hashed = await bcrypt.hash(password_plain, 10);

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO teachers
           (name, email, phone, qualification, specialization, max_hours_per_day, max_hours_per_week, password, depart_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [name, email, phone, qualification, specialization, max_hours_per_day, max_hours_per_week, hashed, depart_id]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   SUBJECTS
════════════════════════════════════════════ */
export const bulkSubjects = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const subject_name   = str(row["subject_name"]   || row["Subject Name"]);
      const subject_code   = str(row["subject_code"]   || row["Subject Code"]);
      const course_code    = str(row["course_code"]    || row["Course Code"]);
      const semester       = num(row["semester"]       || row["Semester"]      || 1);
      const weekly_hours   = num(row["weekly_hours"]   || row["Weekly Hours"]  || 3);
      const credits        = num(row["credits"]        || row["Credits"]       || 3);
      const is_lab         = bool(row["is_lab"]        || row["Is Lab"]        || 0) ? 1 : 0;
      const preferred_slot = str(row["preferred_slot"] || row["Preferred Slot"]|| "ANY").toUpperCase();

      if (!subject_name || !subject_code) {
        errors.push(`Row ${i+2}: subject_name and subject_code required`); continue;
      }

      let course_id = null;
      if (course_code) {
        const [c] = await pool.query("SELECT course_id FROM courses WHERE course_code=?", [course_code]);
        if (c.length) course_id = c[0].course_id;
      }

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO subjects
           (subject_name, subject_code, course_id, semester, weekly_hours, credits, is_lab, preferred_slot)
           VALUES (?,?,?,?,?,?,?,?)`,
          [subject_name, subject_code, course_id, semester, weekly_hours, credits, is_lab, preferred_slot]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   SECTIONS
════════════════════════════════════════════ */
export const bulkSections = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const section_name     = str(row["section_name"]     || row["Section Name"]);
      const course_code      = str(row["course_code"]      || row["Course Code"]);
      const semester         = num(row["semester"]         || row["Semester"]         || 1);
      const strength         = num(row["strength"]         || row["Strength"]         || 60);
      const batch_year       = num(row["batch_year"]       || row["Batch Year"]       || new Date().getFullYear());
      const max_slots_per_day= num(row["max_slots_per_day"]|| row["Max Slots/Day"]    || 6);
      const status           = str(row["status"]           || row["Status"]           || "ACTIVE").toUpperCase();

      if (!section_name || !course_code) {
        errors.push(`Row ${i+2}: section_name and course_code required`); continue;
      }

      let course_id = null;
      const [c] = await pool.query("SELECT course_id FROM courses WHERE course_code=?", [course_code]);
      if (c.length) course_id = c[0].course_id;
      else { errors.push(`Row ${i+2}: course_code "${course_code}" not found`); continue; }

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO sections
           (section_name, course_id, semester, strength, batch_year, max_slots_per_day, status)
           VALUES (?,?,?,?,?,?,?)`,
          [section_name, course_id, semester, strength, batch_year, max_slots_per_day, status]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   STUDENTS
════════════════════════════════════════════ */
export const bulkStudents = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const name         = str(row["name"]         || row["Name"]);
      const roll_number  = str(row["roll_number"]  || row["Roll Number"] || row["roll"]);
      const section_name = str(row["section_name"] || row["Section"]     || row["section"]);
      const password_plain = str(row["password"]   || row["Password"]   || "student123");

      if (!name || !roll_number || !section_name) {
        errors.push(`Row ${i+2}: name, roll_number, section_name required`); continue;
      }

      let section_id = null;
      const [s] = await pool.query("SELECT section_id FROM sections WHERE section_name=? AND is_deleted=0", [section_name]);
      if (s.length) section_id = s[0].section_id;
      else { errors.push(`Row ${i+2}: section "${section_name}" not found`); continue; }

      const hashed = await bcrypt.hash(password_plain, 10);

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO students (name, roll_number, password, section_id) VALUES (?,?,?,?)`,
          [name, roll_number, hashed, section_id]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   TEACHER-SUBJECT MAPPING
════════════════════════════════════════════ */
export const bulkTeacherSubjects = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];

    for (const [i, row] of rows.entries()) {
      const teacher_email  = str(row["teacher_email"]  || row["Teacher Email"] || row["email"]);
      const subject_code   = str(row["subject_code"]   || row["Subject Code"]);
      const priority       = num(row["priority"]       || row["Priority"]      || 1);

      if (!teacher_email || !subject_code) {
        errors.push(`Row ${i+2}: teacher_email and subject_code required`); continue;
      }

      const [t] = await pool.query("SELECT teacher_id FROM teachers WHERE email=? AND is_deleted=0", [teacher_email]);
      const [s] = await pool.query("SELECT subject_id FROM subjects WHERE subject_code=? AND is_deleted=0", [subject_code]);

      if (!t.length) { errors.push(`Row ${i+2}: teacher "${teacher_email}" not found`); continue; }
      if (!s.length) { errors.push(`Row ${i+2}: subject "${subject_code}" not found`); continue; }

      try {
        const [result] = await pool.query(
          `INSERT IGNORE INTO teacher_subject (teacher_id, subject_id, priority) VALUES (?,?,?)`,
          [t[0].teacher_id, s[0].subject_id, priority]
        );
        result.affectedRows ? inserted++ : skipped++;
      } catch { skipped++; }
    }
    res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════
   TEMPLATE DOWNLOAD
════════════════════════════════════════════ */
const TEMPLATES = {
  buildings:       [{ building_name: "Main Block",  building_code: "MB", floor: "3" }],
  rooms:           [{ room_no: "R-101", room_type: "CLASSROOM", capacity: 60, building_code: "MB" }],
  courses:         [{ course_name: "B.Tech CSE", course_code: "BTCSE", department_code: "CSE", duration_years: 4 }],
  teachers:        [{ name: "Dr. Smith", email: "smith@college.com", max_hours_per_day: 6, max_hours_per_week: 30, password: "teacher123", department_code: "CSE" }],
  subjects:        [{ subject_name: "Data Structures", subject_code: "CS301", course_code: "BTCSE", semester: 3, weekly_hours: 4, credits: 4, is_lab: 0, preferred_slot: "ANY" }],
  sections:        [{ section_name: "CSE-A", course_code: "BTCSE", semester: 3, strength: 60, batch_year: 2024, max_slots_per_day: 6, status: "ACTIVE" }],
  students:        [{ name: "John Doe", roll_number: "2024001", section_name: "CSE-A", password: "student123" }],
  teacher_subjects:[{ teacher_email: "smith@college.com", subject_code: "CS301", priority: 1 }],
};

export const downloadTemplate = (req, res) => {
  const { entity } = req.params;
  const data = TEMPLATES[entity];
  if (!data) return res.status(404).json({ success: false, message: "Unknown entity" });

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, entity);
  const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${entity}_template.xlsx"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
};