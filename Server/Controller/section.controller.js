import {
  sectionNameExists,
  courseExistsById,
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  softDeleteSection,
} from "../model/section.model.js";

export const createSectionController = async (req, res) => {
  try {
    const { section_name, course_id, semester, strength, batch_year, max_slots_per_day, status } = req.body;

    if (!section_name || !course_id || !semester || !strength || !batch_year || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (Number(strength) < 1 || Number(strength) > 500) {
      return res.status(400).json({ success: false, message: "Strength must be between 1 and 500" });
    }

    if (await sectionNameExists(section_name)) {
      return res.status(409).json({ success: false, message: "Section already exists" });
    }

    if (!(await courseExistsById(course_id))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const section_id = await createSection({
      section_name, course_id, semester, strength,
      batch_year, max_slots_per_day: max_slots_per_day ?? 6, status,
    });

    res.status(201).json({ success: true, message: "Section created successfully", section_id });
  } catch (error) {
    console.error("Create Section Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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

    const affectedRows = await updateSection(req.params.id, {
      section_name, course_id, semester, strength,
      batch_year, max_slots_per_day: max_slots_per_day ?? 6, status,
    });

    if (!affectedRows) return res.status(404).json({ success: false, message: "Section not found" });
    res.status(200).json({ success: true, message: "Section updated successfully" });
  } catch (error) {
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