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
const normalizeKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
const getCell = (row, keys) => {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );
  for (const key of keys) {
    const value = normalized[normalizeKey(key)];
    if (value !== undefined && value !== "") return value;
  }
  return "";
};
const duplicateInFile = (seen, key, message, rowNo, errors) => {
  const normalizedKey = String(key).toLowerCase();
  if (seen.has(normalizedKey)) {
    errors.push(`Row ${rowNo}: Duplicate in Excel file - ${message}`);
    return true;
  }
  seen.add(normalizedKey);
  return false;
};
const insertErrorMessage = (err, duplicateMessage) =>
  err.code === "ER_DUP_ENTRY" ? duplicateMessage : err.message;
const getBuildingCodeStatus = async (building_code) => {
  const [rows] = await pool.query(
    "SELECT building_id, is_deleted FROM buildings WHERE building_code = ? LIMIT 1",
    [building_code]
  );
  return rows[0] || null;
};

/* ════════════════════════════════════════════
   BUILDINGS
════════════════════════════════════════════ */
export const bulkBuildings = async (req, res) => {
  try {
    const rows = parseExcel(req.file.buffer);
    let inserted = 0, skipped = 0, errors = [];
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const building_name = str(getCell(row, ["building_name", "Building Name", "name"]));
      const building_code = str(getCell(row, ["building_code", "Building Code", "code"]));
      const floors = num(getCell(row, ["floors", "floor", "building_floor", "Building Floor", "Building Floors"]));
      if (!building_name || !building_code || !floors) {
        errors.push(`Row ${rowNo}: building_name, building_code and floors are required`);
        skipped++;
        continue;
      }
      if (duplicateInFile(seen, building_code, `building_code "${building_code}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }
      try {
        const existingBuilding = await getBuildingCodeStatus(building_code);
        if (existingBuilding?.is_deleted) {
          errors.push(`Row ${rowNo}: building_code "${building_code}" already exists in deleted buildings. Use a different code or restore that building first.`);
          skipped++;
          continue;
        }
        if (existingBuilding) {
          errors.push(`Row ${rowNo}: building_code "${building_code}" already exists`);
          skipped++;
          continue;
        }

        await pool.query(
          `INSERT INTO buildings (building_name, building_code, floors) VALUES (?,?,?)`,
          [building_name, building_code, floors]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `building_code "${building_code}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const room_no   = str(row["room_no"]   || row["Room No"]   || row["room"]);
      const room_type = str(row["room_type"] || row["Room Type"] || "CLASSROOM").toUpperCase();
      const capacity  = num(row["capacity"]  || row["Capacity"]  || 60);
      const building_code = str(row["building_code"] || row["Building Code"] || "");

      if (!room_no) { errors.push(`Row ${rowNo}: room_no is required`); skipped++; continue; }
      if (duplicateInFile(seen, `${building_code}:${room_no}`, `room_no "${room_no}" appears more than once for building_code "${building_code}"`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let building_id = null;
      if (building_code) {
        const [b] = await pool.query("SELECT building_id FROM buildings WHERE building_code=?", [building_code]);
        if (b.length) building_id = b[0].building_id;
        else { errors.push(`Row ${rowNo}: building_code "${building_code}" not found`); skipped++; continue; }
      }

      try {
        await pool.query(
          `INSERT INTO rooms (room_no, room_type, capacity, building_id) VALUES (?,?,?,?)`,
          [room_no, room_type, capacity, building_id]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `room_no "${room_no}" already exists for building_code "${building_code}"`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const course_name = str(row["course_name"] || row["Course Name"]);
      const course_code = str(row["course_code"] || row["Course Code"]);
      const dept_code   = str(row["department_code"] || row["Department Code"] || row["dept_code"]);
      const duration    = num(row["duration_years"] || row["Duration"] || 2);

      if (!course_name || !course_code) {
        errors.push(`Row ${rowNo}: course_name and course_code are required`); skipped++; continue;
      }
      if (duplicateInFile(seen, course_code, `course_code "${course_code}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let depart_id = null;
      if (dept_code) {
        const [d] = await pool.query("SELECT depart_id FROM department WHERE department_code=?", [dept_code]);
        if (d.length) depart_id = d[0].depart_id;
      }

      try {
        await pool.query(
          `INSERT INTO courses (course_name, course_code, depart_id, duration_years) VALUES (?,?,?,?)`,
          [course_name, course_code, depart_id, duration]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `course_code "${course_code}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
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
        errors.push(`Row ${rowNo}: name and email are required`); skipped++; continue;
      }
      if (duplicateInFile(seen, email, `email "${email}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let depart_id = null;
      if (dept_code) {
        const [d] = await pool.query("SELECT depart_id FROM department WHERE department_code=?", [dept_code]);
        if (d.length) depart_id = d[0].depart_id;
      }

      const hashed = await bcrypt.hash(password_plain, 10);

      try {
        await pool.query(
          `INSERT INTO teachers
           (name, email, phone, qualification, specialization, max_hours_per_day, max_hours_per_week, password, depart_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [name, email, phone, qualification, specialization, max_hours_per_day, max_hours_per_week, hashed, depart_id]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `email "${email}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const subject_name   = str(row["subject_name"]   || row["Subject Name"]);
      const subject_code   = str(row["subject_code"]   || row["Subject Code"]);
      const course_code    = str(row["course_code"]    || row["Course Code"]);
      const semester       = num(row["semester"]       || row["Semester"]      || 1);
      const weekly_hours   = num(row["weekly_hours"]   || row["Weekly Hours"]  || 3);
      const credits        = num(row["credits"]        || row["Credits"]       || 3);
      const is_lab         = bool(row["is_lab"]        || row["Is Lab"]        || 0) ? 1 : 0;
      const preferred_slot = str(row["preferred_slot"] || row["Preferred Slot"]|| "ANY").toUpperCase();

      if (!subject_name || !subject_code) {
        errors.push(`Row ${rowNo}: subject_name and subject_code required`); skipped++; continue;
      }
      if (duplicateInFile(seen, subject_code, `subject_code "${subject_code}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let course_id = null;
      if (course_code) {
        const [c] = await pool.query("SELECT course_id FROM courses WHERE course_code=?", [course_code]);
        if (c.length) course_id = c[0].course_id;
      }

      try {
        await pool.query(
          `INSERT INTO subjects
           (subject_name, subject_code, course_id, semester, weekly_hours, credits, is_lab, preferred_slot)
           VALUES (?,?,?,?,?,?,?,?)`,
          [subject_name, subject_code, course_id, semester, weekly_hours, credits, is_lab, preferred_slot]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `subject_code "${subject_code}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const section_name     = str(row["section_name"]     || row["Section Name"]);
      const course_code      = str(row["course_code"]      || row["Course Code"]);
      const semester         = num(row["semester"]         || row["Semester"]         || 1);
      const strength         = num(row["strength"]         || row["Strength"]         || 60);
      const batch_year       = num(row["batch_year"]       || row["Batch Year"]       || new Date().getFullYear());
      const max_slots_per_day= num(row["max_slots_per_day"]|| row["Max Slots/Day"]    || 6);
      const status           = str(row["status"]           || row["Status"]           || "ACTIVE").toUpperCase();

      if (!section_name || !course_code) {
        errors.push(`Row ${rowNo}: section_name and course_code required`); skipped++; continue;
      }
      if (duplicateInFile(seen, section_name, `section_name "${section_name}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let course_id = null;
      const [c] = await pool.query("SELECT course_id FROM courses WHERE course_code=?", [course_code]);
      if (c.length) course_id = c[0].course_id;
      else { errors.push(`Row ${rowNo}: course_code "${course_code}" not found`); skipped++; continue; }

      try {
        await pool.query(
          `INSERT INTO sections
           (section_name, course_id, semester, strength, batch_year, max_slots_per_day, status)
           VALUES (?,?,?,?,?,?,?)`,
          [section_name, course_id, semester, strength, batch_year, max_slots_per_day, status]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `section_name "${section_name}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const name         = str(row["name"]         || row["Name"]);
      const roll_number  = str(row["roll_number"]  || row["Roll Number"] || row["roll"]);
      const section_name = str(row["section_name"] || row["Section"]     || row["section"]);
      const password_plain = str(row["password"]   || row["Password"]   || "student123");

      if (!name || !roll_number || !section_name) {
        errors.push(`Row ${rowNo}: name, roll_number, section_name required`); skipped++; continue;
      }
      if (duplicateInFile(seen, roll_number, `roll_number "${roll_number}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      let section_id = null;
      const [s] = await pool.query("SELECT section_id FROM sections WHERE section_name=? AND is_deleted=0", [section_name]);
      if (s.length) section_id = s[0].section_id;
      else { errors.push(`Row ${rowNo}: section "${section_name}" not found`); skipped++; continue; }

      const hashed = await bcrypt.hash(password_plain, 10);

      try {
        await pool.query(
          `INSERT INTO students (name, roll_number, password, section_id) VALUES (?,?,?,?)`,
          [name, roll_number, hashed, section_id]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `roll_number "${roll_number}" already exists`)}`);
        skipped++;
      }
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
    const seen = new Set();

    for (const [i, row] of rows.entries()) {
      const rowNo = i + 2;
      const teacher_email  = str(row["teacher_email"]  || row["Teacher Email"] || row["email"]);
      const subject_code   = str(row["subject_code"]   || row["Subject Code"]);
      const priority       = num(row["priority"]       || row["Priority"]      || 1);

      if (!teacher_email || !subject_code) {
        errors.push(`Row ${rowNo}: teacher_email and subject_code required`); skipped++; continue;
      }
      if (duplicateInFile(seen, `${teacher_email}:${subject_code}`, `teacher_email "${teacher_email}" with subject_code "${subject_code}" appears more than once`, rowNo, errors)) {
        skipped++;
        continue;
      }

      const [t] = await pool.query("SELECT teacher_id FROM teachers WHERE email=? AND is_deleted=0", [teacher_email]);
      const [s] = await pool.query("SELECT subject_id FROM subjects WHERE subject_code=? AND is_deleted=0", [subject_code]);

      if (!t.length) { errors.push(`Row ${rowNo}: teacher "${teacher_email}" not found`); skipped++; continue; }
      if (!s.length) { errors.push(`Row ${rowNo}: subject "${subject_code}" not found`); skipped++; continue; }

      try {
        await pool.query(
          `INSERT INTO teacher_subject (teacher_id, subject_id, priority) VALUES (?,?,?)`,
          [t[0].teacher_id, s[0].subject_id, priority]
        );
        inserted++;
      } catch (err) {
        errors.push(`Row ${rowNo}: ${insertErrorMessage(err, `teacher "${teacher_email}" is already assigned to subject "${subject_code}"`)}`);
        skipped++;
      }
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
  buildings:       [{ building_name: "Main Block",  building_code: "MB", floors: 3 }],
  rooms:           [{ room_no: "R-101", room_type: "CLASSROOM", capacity: 60, building_code: "MB" }],
  courses:         [{ course_name: "B.Tech CSE", course_code: "BTCSE", department_code: "CSE", duration_years: 4 }],
  teachers:        [{ name: "Dr. Smith", email: "smith@college.com", max_hours_per_day: 6, max_hours_per_week: 30, password: "teacher123", department_code: "CSE" }],
  subjects:        [{ subject_name: "Data Structures", subject_code: "CS301", course_code: "BTCSE", semester: 3, weekly_hours: 4, credits: 4, is_lab: 0, preferred_slot: "ANY" }],
  sections:        [{ section_name: "CSE-A", course_code: "BTCSE", semester: 3, strength: 60, batch_year: 2024, max_slots_per_day: 6, status: "ACTIVE" }],
  students:        [{ name: "John Doe", roll_number: "2024001", section_name: "CSE-A", password: "student123" }],
  teacher_subjects:[{ teacher_email: "smith@college.com", subject_code: "CS301", priority: 1 }],
};

const TEMPLATE_REFERENCES = {
  buildings: [
    {
      sheetName: "Existing Buildings",
      query: `SELECT building_code, building_name, floors
              FROM buildings
              WHERE is_deleted = 0
              ORDER BY building_code`,
    },
  ],
  rooms: [
    {
      sheetName: "Building Codes",
      query: `SELECT building_code, building_name, floors
              FROM buildings
              WHERE is_deleted = 0
              ORDER BY building_code`,
    },
  ],
  courses: [
    {
      sheetName: "Department Codes",
      query: `SELECT department_code, name AS department_name
              FROM department
              WHERE is_deleted = 0
              ORDER BY department_code`,
    },
  ],
  teachers: [
    {
      sheetName: "Department Codes",
      query: `SELECT department_code, name AS department_name
              FROM department
              WHERE is_deleted = 0
              ORDER BY department_code`,
    },
  ],
  subjects: [
    {
      sheetName: "Course Codes",
      query: `SELECT c.course_code, c.course_name, d.department_code
              FROM courses c
              LEFT JOIN department d ON d.depart_id = c.depart_id
              WHERE c.is_deleted = 0
              ORDER BY c.course_code`,
    },
  ],
  sections: [
    {
      sheetName: "Course Codes",
      query: `SELECT c.course_code, c.course_name, d.department_code
              FROM courses c
              LEFT JOIN department d ON d.depart_id = c.depart_id
              WHERE c.is_deleted = 0
              ORDER BY c.course_code`,
    },
  ],
  students: [
    {
      sheetName: "Section Names",
      query: `SELECT s.section_name, c.course_code, c.course_name, s.semester, s.batch_year
              FROM sections s
              LEFT JOIN courses c ON c.course_id = s.course_id
              WHERE s.is_deleted = 0
              ORDER BY s.section_name`,
    },
  ],
  teacher_subjects: [
    {
      sheetName: "Teachers",
      query: `SELECT email AS teacher_email, name AS teacher_name
              FROM teachers
              WHERE is_deleted = 0
              ORDER BY name`,
    },
    {
      sheetName: "Subject Codes",
      query: `SELECT subject_code, subject_name
              FROM subjects
              WHERE is_deleted = 0
              ORDER BY subject_code`,
    },
  ],
};

const getReferenceSections = async (entity) => {
  const references = TEMPLATE_REFERENCES[entity] || [];
  const sections = [];

  for (const reference of references) {
    const [rows] = await pool.query(reference.query);
    sections.push({
      title: reference.sheetName,
      rows: rows.length ? rows : [{ note: "No records found" }],
    });
  }

  return sections;
};

const buildTemplateSheet = (data, referenceSections) => {
  const uploadRows = xlsx.utils.json_to_sheet(data);
  const rows = xlsx.utils.sheet_to_json(uploadRows, { header: 1, defval: "" });
  const uploadColumnCount = rows[0]?.length || 0;
  const referenceStartColumn = uploadColumnCount + 2;
  let referenceStartRow = 0;

  for (const section of referenceSections) {
    const referenceRows = xlsx.utils.sheet_to_json(
      xlsx.utils.json_to_sheet(section.rows),
      { header: 1, defval: "" }
    );
    const sectionRows = [[section.title], ...referenceRows, []];

    sectionRows.forEach((sectionRow, offset) => {
      const targetRow = referenceStartRow + offset;
      if (!rows[targetRow]) rows[targetRow] = [];
      while (rows[targetRow].length < referenceStartColumn) rows[targetRow].push("");
      rows[targetRow].splice(referenceStartColumn, sectionRow.length, ...sectionRow);
    });

    referenceStartRow += sectionRows.length + 1;
  }

  return xlsx.utils.aoa_to_sheet(rows);
};

export const downloadTemplate = async (req, res) => {
  try {
    const { entity } = req.params;
    const data = TEMPLATES[entity];
    if (!data) return res.status(404).json({ success: false, message: "Unknown entity" });

    const wb = xlsx.utils.book_new();
    const referenceSections = await getReferenceSections(entity);
    const ws = buildTemplateSheet(data, referenceSections);
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="${entity}_template.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
