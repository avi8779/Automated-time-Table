import client from './client';

// ── Departments ──────────────────────────────────────────────────────────────
export const departmentsApi = {
  getAll: () => client.get('/departments'),
  getById: (id) => client.get(`/departments/${id}`),
  create: (data) => client.post('/departments', data),
  update: (id, data) => client.put(`/departments/${id}`, data),
  delete: (id) => client.delete(`/departments/${id}`),
  restore: (id) => client.patch(`/departments/${id}/restore`),
  getDeleted: () => client.get('/departments/deleted'),
};

// ── Courses ──────────────────────────────────────────────────────────────────
export const coursesApi = {
  getAll: () => client.get('/courses'),
  getById: (id) => client.get(`/courses/${id}`),
  create: (data) => client.post('/courses', data),
  update: (id, data) => client.put(`/courses/${id}`, data),
  delete: (id) => client.delete(`/courses/${id}`),
  restore: (id) => client.patch(`/courses/${id}/restore`),
};

// ── Teachers ─────────────────────────────────────────────────────────────────
export const teachersApi = {
  getAll: () => client.get('/teachers'),
  getById: (id) => client.get(`/teachers/${id}`),
  create: (data) => client.post('/teachers', data),
  update: (id, data) => client.put(`/teachers/${id}`, data),
  delete: (id) => client.delete(`/teachers/${id}`),
  restore: (id) => client.patch(`/teachers/${id}/restore`),
};

// ── Subjects ─────────────────────────────────────────────────────────────────
export const subjectsApi = {
  getAll: () => client.get('/subjects'),
  getById: (id) => client.get(`/subjects/${id}`),
  create: (data) => client.post('/subjects', data),
  update: (id, data) => client.put(`/subjects/${id}`, data),
  delete: (id) => client.delete(`/subjects/${id}`),
};

// ── Sections ─────────────────────────────────────────────────────────────────
export const sectionsApi = {
  getAll: () => client.get('/sections'),
  getById: (id) => client.get(`/sections/${id}`),
  create: (data) => client.post('/sections', data),
  update: (id, data) => client.put(`/sections/${id}`, data),
  delete: (id) => client.delete(`/sections/${id}`),
};

// ── Buildings ────────────────────────────────────────────────────────────────
export const buildingsApi = {
  getAll: () => client.get('/buildings'),
  create: (data) => client.post('/buildings', data),
};

// ── Rooms ────────────────────────────────────────────────────────────────────
export const roomsApi = {
  getAll: () => client.get('/rooms'),
  create: (data) => client.post('/rooms', data),
};

// ── Time Slots ───────────────────────────────────────────────────────────────
export const timeSlotsApi = {
  getAll: () => client.get('/time-slots'),
  getById: (id) => client.get(`/time-slots/${id}`),
  getByDay: (day) => client.get(`/time-slots/day/${day}`),
  create: (data) => client.post('/time-slots', data),
  update: (id, data) => client.put(`/time-slots/${id}`, data),
  delete: (id) => client.delete(`/time-slots/${id}`),
};

// ── Teacher-Subject ───────────────────────────────────────────────────────────
export const teacherSubjectApi = {
  assign: (data) => client.post('/teacher-Subjects', data),
  getByTeacher: (teacher_id) => client.get(`/teacher-Subjects/teacher/${teacher_id}`),
  getBySubject: (subject_id) => client.get(`/teacher-Subjects/subject/${subject_id}`),
  remove: (teacher_id, subject_id) =>
    client.delete(`/teacher-Subjects/${teacher_id}/${subject_id}`),
};

// ── Timetable ─────────────────────────────────────────────────────────────────
export const timetableApi = {
  generate: () => client.post('/timetables/generate'),
  getBySection: (section_id) => client.get(`/timetables/section/${section_id}`),
};
