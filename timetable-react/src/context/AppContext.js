import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  departmentsApi, coursesApi, teachersApi, subjectsApi,
  sectionsApi, buildingsApi
} from '../api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const refreshDepartments = useCallback(async () => {
    try { const r = await departmentsApi.getAll(); setDepartments(r.data || []); } catch {}
  }, []);

  const refreshCourses = useCallback(async () => {
    try { const r = await coursesApi.getAll(); setCourses(r.data || []); } catch {}
  }, []);

  const refreshTeachers = useCallback(async () => {
    try { const r = await teachersApi.getAll(); setTeachers(r.data || []); } catch {}
  }, []);

  const refreshSubjects = useCallback(async () => {
    try { const r = await subjectsApi.getAll(); setSubjects(r.data || []); } catch {}
  }, []);

  const refreshSections = useCallback(async () => {
    try {
      const r = await sectionsApi.getAll();
      setSections(Array.isArray(r) ? r : (r.data || []));
    } catch {}
  }, []);

  const refreshBuildings = useCallback(async () => {
    try { const r = await buildingsApi.getAll(); setBuildings(r.data || []); } catch {}
  }, []);

  return (
    <AppContext.Provider
      value={{
        departments, courses, teachers, subjects, sections, buildings,
        refreshDepartments, refreshCourses, refreshTeachers,
        refreshSubjects, refreshSections, refreshBuildings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
