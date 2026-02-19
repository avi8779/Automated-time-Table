import { Route, Routes } from 'react-router-dom';

import Dashbord from './Pages/Dashbord';
import Login from './Pages/Login';
import CreateCourse from './Pages/Courses/CreateCourse';
import CreateDepartment from './Pages/Departments/CreateDepartment';
import CreateRoom from './Pages/Rooms/CreateRoom';
import CreateSubject from './Pages/Subjects/CreateSubject';
import CreateTeacher from './Pages/Teachers/CreateTeacher';
import CreateBuilding from './Pages/Buildings/CreateBuilding'

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Dashbord />} />
      <Route path='/login' element={<Login />} />
      <Route path='/course/create' element={<CreateCourse />} />
      <Route path='/department/create' element={<CreateDepartment />} />
      <Route path='/subject/create' element={<CreateSubject />} />
      <Route path='/room/create' element={<CreateRoom />} />
      <Route path='/teacher/create' element={<CreateTeacher />} />
      <Route path='/building/create' element={<CreateBuilding />} />
    </Routes>
  );
}
