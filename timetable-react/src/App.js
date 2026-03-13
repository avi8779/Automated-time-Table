import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import Departments from './components/pages/Departments';
import Courses from './components/pages/Courses';
import Teachers from './components/pages/Teachers';
import Subjects from './components/pages/Subjects';
import Sections from './components/pages/Sections';
import Buildings from './components/pages/Buildings';
import Rooms from './components/pages/Rooms';
import TimeSlots from './components/pages/TimeSlots';
import Assignments from './components/pages/Assignments';
import Generate from './components/pages/Generate';
import TimetableView from './components/pages/TimetableView';

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="departments" element={<Departments />} />
          <Route path="courses" element={<Courses />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="sections" element={<Sections />} />
          <Route path="buildings" element={<Buildings />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="timeslots" element={<TimeSlots />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="generate" element={<Generate />} />
          <Route path="timetable" element={<TimetableView />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

export default App;
