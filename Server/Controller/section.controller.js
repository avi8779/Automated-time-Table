import {
  getSectionConflict,
  courseExistsById,
  createSection,
  getAllSections,
  getDeletedSections,
  getSectionById,
  updateSection,
  softDeleteSection,
  restoreSection,
  restoreSectionWithData,
} from "../model/section.model.js";

const sectionConflictMessage = (section_name) =>
  `Section "${section_name}" already exists for this course and batch year`;

const deletedSectionConflictMessage = (section_name) =>
  `Section "${section_name}" already exists in deleted sections for this course and batch year. Use a different section name or restore that section first.`;

const handleSectionError = (res, error) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Section already exists for this course and batch year",
    });
  }
  return res.status(500).json({ success: false, message: error.message || "Internal server error" });
};

export const createSectionController = async (req, res) => {
  try {
    const { section_name, course_id, semester, strength, batch_year, max_slots_per_day, status } = req.body;

    if (!section_name || !course_id || !semester || !strength || !batch_year || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (Number(strength) < 1 || Number(strength) > 500) {
      return res.status(400).json({ success: false, message: "Strength must be between 1 and 500" });
    }

    if (!(await courseExistsById(course_id))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const conflict = await getSectionConflict(course_id, batch_year, section_name);
    if (conflict?.is_deleted) {
      const restored = await restoreSectionWithData(conflict.section_id, {
        section_name, course_id, semester, strength,
        batch_year, max_slots_per_day: max_slots_per_day ?? 6, status,
      });

      if (!restored) {
        return res.status(409).json({ success: false, message: deletedSectionConflictMessage(section_name) });
      }

      return res.status(200).json({
        success: true,
        message: "Section restored successfully",
        section_id: conflict.section_id,
      });
    }
    if (conflict) {
      return res.status(409).json({ success: false, message: sectionConflictMessage(section_name) });
    }

    const section_id = await createSection({
      section_name, course_id, semester, strength,
      batch_year, max_slots_per_day: max_slots_per_day ?? 6, status,
    });

    res.status(201).json({ success: true, message: "Section created successfully", section_id });
  } catch (error) {
    console.error("Create Section Error:", error);
    return handleSectionError(res, error);
  }
};

export const getAllSectionsController = async (req, res) => {
  try {
    const sections = await getAllSections();
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    console.error("Get Sections Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSectionByIdController = async (req, res) => {
  try {
    const section = await getSectionById(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSectionController = async (req, res) => {
  try {
    const { section_name, course_id, semester, strength, batch_year, max_slots_per_day, status } = req.body;

    if (!section_name || !course_id || !semester || !strength || !batch_year || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (Number(strength) < 1 || Number(strength) > 500) {
      return res.status(400).json({ success: false, message: "Strength must be between 1 and 500" });
    }

    if (!(await courseExistsById(course_id))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const conflict = await getSectionConflict(course_id, batch_year, section_name, req.params.id);
    if (conflict?.is_deleted) {
      return res.status(409).json({ success: false, message: deletedSectionConflictMessage(section_name) });
    }
    if (conflict) {
      return res.status(409).json({ success: false, message: sectionConflictMessage(section_name) });
    }

    const affectedRows = await updateSection(req.params.id, {
      section_name, course_id, semester, strength,
      batch_year, max_slots_per_day: max_slots_per_day ?? 6, status,
    });

    if (!affectedRows) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, message: "Section updated successfully" });
  } catch (error) {
    return handleSectionError(res, error);
  }
};

export const getDeletedSectionsController = async (req, res) => {
  try {
    const sections = await getDeletedSections();
    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    console.error("Get Deleted Sections Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteSectionController = async (req, res) => {
  try {
    const affectedRows = await softDeleteSection(req.params.id);
    if (!affectedRows) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const restoreSectionController = async (req, res) => {
  try {
    const affectedRows = await restoreSection(req.params.id);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Section not found or already active" });
    }
    res.status(200).json({ success: true, message: "Section restored successfully" });
  } catch (error) {
    console.error("Restore Section Error:", error);
    return handleSectionError(res, error);
  }
};
