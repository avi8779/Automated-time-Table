import { configureStore } from '@reduxjs/toolkit';
import { createCrudSlice } from './createCrudSlice';

// 🏗 Create slices using the factory
// Args: (sliceKey, apiEndpoint, idKey)
export const teacherSlice    = createCrudSlice("teacher",    "teachers",    "teacher_id");
export const buildingSlice   = createCrudSlice("building",   "buildings",   "building_id");
export const roomSlice       = createCrudSlice("room",       "rooms",       "room_id");
export const departmentSlice = createCrudSlice("department", "departments", "department_id");
export const courseSlice     = createCrudSlice("course",     "courses",     "course_id");
export const subjectSlice    = createCrudSlice("subject",    "subjects",    "subject_id");
export const sectionSlice    = createCrudSlice("section",    "sections",    "section_id");
export const timeSlotSlice   = createCrudSlice("timeSlot",   "time-slots",  "slot_id");

const store = configureStore({
    reducer: {
        teacher:    teacherSlice.reducer,
        building:   buildingSlice.reducer,
        room:       roomSlice.reducer,
        department: departmentSlice.reducer,
        course:     courseSlice.reducer,
        subject:    subjectSlice.reducer,
        section:    sectionSlice.reducer,
        timeSlot:   timeSlotSlice.reducer,
    }
});

export default store;