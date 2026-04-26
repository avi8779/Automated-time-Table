import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import Navbar           from "./Components/Navbar";
import ProtectedRoute   from "./Components/ProtectedRoute";
import Unauthorized     from "./Components/Unauthorized";

import Login            from "./Pages/Login";
import Dashboard        from "./Pages/Dashbord";
import CreateTeacher    from "./Pages/Teachers/CreateTeacher";
import CreateDepartment from "./Pages/Departments/CreateDepartment";
import CreateBuilding   from "./Pages/Buildings/CreateBuilding";
import CreateRoom       from "./Pages/Rooms/CreateRoom";
import CreateCourse     from "./Pages/Courses/CreateCourse";
import CreateSubject    from "./Pages/Subjects/CreateSubject";
import CreateSection    from "./Pages/Section/CreateSection";
import CreateTimeSlot   from "./Pages/TimeSlot/CreateTimeSlot";
import TeacherSubject   from "./Components/TeacherSubject";
import Timetable        from "./Components/Timetable";
import TeacherTimetable from "./Components/TeacherTimetable";
import MyTimetable      from "./Components/MyTimetable";
import ChangePassword   from "./Components/ChangePassword";
import NotifyUsers      from "./Pages/Notify/NotifyUsers";
import Students         from "./Pages/Students/Students";
import BulkUpload       from "./Pages/BulkUploads/BulkUpload";

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading…</div>
    </div>
  );

  // Not logged in — only show login page
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Force password change before anything else
  if (user.mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/login" element={<Navigate to={user.role === "admin" ? "/" : "/my-timetable"} replace />} />
          <Route path="/unauthorized"   element={<Unauthorized />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* ── ADMIN ONLY ── */}
          <Route path="/" element={
            <ProtectedRoute roles={["admin"]}><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/teacher/create" element={
            <ProtectedRoute roles={["admin"]}><CreateTeacher /></ProtectedRoute>
          }/>
          <Route path="/department/create" element={
            <ProtectedRoute roles={["admin"]}><CreateDepartment /></ProtectedRoute>
          }/>
          <Route path="/building/create" element={
            <ProtectedRoute roles={["admin"]}><CreateBuilding /></ProtectedRoute>
          }/>
          <Route path="/room/create" element={
            <ProtectedRoute roles={["admin"]}><CreateRoom /></ProtectedRoute>
          }/>
          <Route path="/course/create" element={
            <ProtectedRoute roles={["admin"]}><CreateCourse /></ProtectedRoute>
          }/>
          <Route path="/subject/create" element={
            <ProtectedRoute roles={["admin"]}><CreateSubject /></ProtectedRoute>
          }/>
          <Route path="/section/create" element={
            <ProtectedRoute roles={["admin"]}><CreateSection /></ProtectedRoute>
          }/>
          <Route path="/time-slot/create" element={
            <ProtectedRoute roles={["admin"]}><CreateTimeSlot /></ProtectedRoute>
          }/>
          <Route path="/teacher-Subjects" element={
            <ProtectedRoute roles={["admin"]}><TeacherSubject /></ProtectedRoute>
          }/>
          <Route path="/timetable" element={
            <ProtectedRoute roles={["admin"]}><Timetable /></ProtectedRoute>
          }/>
          <Route path="/teacher-timetable" element={
            <ProtectedRoute roles={["admin"]}><TeacherTimetable /></ProtectedRoute>
          }/>
          <Route path="/students" element={
            <ProtectedRoute roles={["admin"]}><Students /></ProtectedRoute>
          }/>
          <Route path="/bulk-upload" element={
            <ProtectedRoute roles={["admin"]}><BulkUpload /></ProtectedRoute>
          }/>
          <Route path="/notify" element={
            <ProtectedRoute roles={["admin"]}><NotifyUsers /></ProtectedRoute>
          }/>

          {/* ── TEACHER + STUDENT ── */}
          <Route path="/my-timetable" element={
            <ProtectedRoute roles={["teacher","student"]}><MyTimetable /></ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to={user.role === "admin" ? "/" : "/my-timetable"} replace />} />
        </Routes>
      </main>
    </div>
  );
}