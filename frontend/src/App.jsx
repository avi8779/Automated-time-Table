import { Route, Routes } from 'react-router-dom';

import Navbar from './Components/Navbar';

import Dashboard        from './Pages/Dashbord';
import Login            from './Pages/Login';
import CreateTeacher    from './Pages/Teachers/CreateTeacher';
import CreateDepartment from './Pages/Departments/CreateDepartment';
import CreateBuilding   from './Pages/Buildings/CreateBuilding';
import CreateRoom       from './Pages/Rooms/CreateRoom';
import CreateCourse     from './Pages/Courses/CreateCourse';
import CreateSubject    from './Pages/Subjects/CreateSubject';
import CreateSection    from './Pages/Section/CreateSection';
import CreateTimeSlot   from './Pages/TimeSlot/CreateTimeSlot';
import TeacherSubject   from './Components/TeacherSubject';
import Timetable        from './Components/Timetable';
import TeacherTimetable from './Components/TeacherTimetable';

export default function App() {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      <Navbar />

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path='/'                       element={<Dashboard />} />
          <Route path='/login'                  element={<Login />} />
          <Route path='/teacher/create'         element={<CreateTeacher />} />
          <Route path='/department/create'      element={<CreateDepartment />} />
          <Route path='/building/create'        element={<CreateBuilding />} />
          <Route path='/room/create'            element={<CreateRoom />} />
          <Route path='/course/create'          element={<CreateCourse />} />
          <Route path='/subject/create'         element={<CreateSubject />} />
          <Route path='/section/create'         element={<CreateSection />} />
          <Route path='/time-slot/create'        element={<CreateTimeSlot />} />
          <Route path='/teacher-Subjects'        element={<TeacherSubject />} />
          <Route path='/timetable'              element={<Timetable />} />
          <Route path="/teacher-timetable" element={<TeacherTimetable />} />
        </Routes>
      </main>

    </div>
  );
}