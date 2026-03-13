import React from 'react'
import { Link } from 'react-router-dom';

function Layout() {
  return (
    <>
          <li>
            <Link to={"/"}>Dashbord</Link>
          </li>
          <li>
            <Link to={"/teacher/create"}>Teacher</Link>
          </li>
          <li>
            <Link to={"/department/create"}>Departments</Link>
          </li>
          <li>
            <Link to={"/course/create"}>Courses</Link>
          </li>
          <li>
            <Link to={"/building/create"}>Buildings</Link>
          </li>
          <li>
            <Link to={"/room/create"}>Rooms</Link>
          </li>
          <li>
            <Link to={"/subject/create"}>Subjects</Link>
          </li>
          <li>
            <Link to={"/login"}>Login</Link>
          </li>
          <li>
            <Link to={"/time-slot/create"}>Time slots</Link>
          </li>
    </>
  )
}

export default Layout;