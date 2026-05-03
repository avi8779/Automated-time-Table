import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import {
  generateTimetable,
  sendTimetableEmail,
  getTimetableForSection,
  getAllTimetables,
  getSectionsWithDepartment,
  getTimetableForTeacher,
} from "../Services/timetable.service.js";

/* POST /api/v1/timetables/generate */
export const generateTimetableController = async (req, res) => {
  try {
    const result = await generateTimetable(req.body || {});
    res.status(201).json({
      success:       true,
      message:       result.message,
      assignedCount: result.assignedCount,
      score:         result.score,
      unassigned:    result.unassigned,
      assignmentIssues: result.assignmentIssues,
      debugLogs:     result.debugLogs,
      debugInfo:     result.debugInfo,
      email:         result.email,
    });
  } catch (error) {
    console.error("=== TIMETABLE GENERATION ERROR ===");
    console.error("Message :", error.message);
    console.error("SQL     :", error.sql || "N/A");
    console.error("SQLState:", error.sqlState || "N/A");
    console.error("Stack   :\n", error.stack);
    console.error("==================================");
    res.status(500).json({
      success: false,
      message: error.message || "Timetable generation failed",
      sql:     error.sql     || undefined,
    });
  }
};

/* POST /api/v1/timetables/send-timetable-email */
export const sendTimetableEmailController = async (req, res) => {
  try {
    const result = await sendTimetableEmail(req.body || {});
    res.json({
      success: true,
      message: "Emails sent successfully",
      email: {
        ...result,
        blocked: false,
        issues: [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send timetable emails",
    });
  }
};

/* GET /api/v1/timetables/section/:section_id */
export const getTimetableBySection = asyncHandler(async (req, res) => {
  const { section_id } = req.params;
  if (!section_id || isNaN(Number(section_id))) throw new AppError("Invalid section_id", 400);
  const rows = await getTimetableForSection(section_id);
  if (!rows.length) throw new AppError("No timetable found for this section", 404);
  res.json({ success: true, count: rows.length, data: rows });
});

/* GET /api/v1/timetables/teacher/:teacher_id */
export const getTimetableByTeacher = asyncHandler(async (req, res) => {
  const { teacher_id } = req.params;
  if (!teacher_id || isNaN(Number(teacher_id))) throw new AppError("Invalid teacher_id", 400);
  const rows = await getTimetableForTeacher(teacher_id);
  if (!rows.length) throw new AppError("No timetable found for this teacher", 404);
  res.json({ success: true, count: rows.length, data: rows });
});

/* GET /api/v1/timetables */
export const getAllTimetablesController = asyncHandler(async (_req, res) => {
  const rows = await getAllTimetables();
  res.json({ success: true, count: rows.length, data: rows });
});

/* GET /api/v1/timetables/sections */
export const getSectionsWithDepartmentController = asyncHandler(async (_req, res) => {
  const rows = await getSectionsWithDepartment();
  res.json({ success: true, data: rows });
});
