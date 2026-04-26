import {
  getSubjectsByTeacher,
  getAllMappings,
  createMapping,
  softDeleteMapping,
} from "../model/teacherSubject.model.js";

/* GET /api/v1/teacher-subjects */
export const getAllMappingsController = async (req, res) => {
  try {
    const rows = await getAllMappings();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/v1/teacher-subjects/teacher/:teacher_id */
export const getSubjectsByTeacherController = async (req, res) => {
  try {
    const rows = await getSubjectsByTeacher(req.params.teacher_id);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/v1/teacher-subjects */
export const assignSubjectController = async (req, res) => {
  try {
    const { teacher_id, subject_id, section_id, priority, can_substitute } = req.body;
    if (!teacher_id || !subject_id)
      return res.status(400).json({ success: false, message: "teacher_id and subject_id are required" });

    await createMapping({ teacher_id, subject_id, section_id, priority, can_substitute });
    res.status(201).json({ success: true, message: "Assignment created successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ success: false, message: "This mapping already exists" });
    res.status(500).json({ success: false, message: err.message });
  }
};

/* DELETE /api/v1/teacher-subjects/:teacher_id/:subject_id/:section_id? */
export const removeTeacherSubjectController = async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.params;
    const section_id = req.params.section_id || req.query.section_id || null;

    const affected = await softDeleteMapping({
      teacher_id: Number(teacher_id),
      subject_id: Number(subject_id),
      section_id: section_id ? Number(section_id) : null,
    });

    if (!affected)
      return res.status(404).json({ success: false, message: "Mapping not found" });

    res.json({ success: true, message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};