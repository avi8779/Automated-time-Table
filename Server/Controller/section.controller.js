import {
  sectionNameExists,
  courseExistsById,
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  softDeleteSection
} from "../model/section.model.js";

/* ===================== CREATE ===================== */
export const createSectionController = async (req, res) => {
  try {
    const { section_name, course_id, semester, strength, batch_year, status } = req.body;

    if (!section_name || !course_id || !semester || !strength || !batch_year || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (await sectionNameExists(section_name)) {
      return res.status(409).json({ success: false, message: "Section already exists" });
    }

    if (!(await courseExistsById(course_id))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const section_id = await createSection({ section_name, course_id, semester, strength, batch_year, status });

    res.status(201).json({ success: true, message: "Section created successfully", section_id });
  } catch (error) {
    console.error("Create Section Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ===================== GET ALL ===================== */
export const getAllSectionsController = async (req, res) => {
  try {
    const sections = await getAllSections();
    // ✅ was: res.json(sections)  →  frontend reads res.data.data which was undefined
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    console.error("Get Sections Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ===================== GET BY ID ===================== */
export const getSectionByIdController = async (req, res) => {
  try {
    const section = await getSectionById(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    console.error("Get Section Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ===================== UPDATE ===================== */
export const updateSectionController = async (req, res) => {
  try {
    const { section_name, course_id, semester, strength, batch_year, status } = req.body;

    if (!section_name || !course_id || !semester || !strength || !batch_year || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!(await courseExistsById(course_id))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const affectedRows = await updateSection(req.params.id, { section_name, course_id, semester, strength, batch_year, status });
    if (!affectedRows) return res.status(404).json({ success: false, message: "Section not found" });

    res.status(200).json({ success: true, message: "Section updated successfully" });
  } catch (error) {
    console.error("Update Section Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ===================== DELETE ===================== */
export const deleteSectionController = async (req, res) => {
  try {
    const affectedRows = await softDeleteSection(req.params.id);
    if (!affectedRows) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    console.error("Delete Section Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};