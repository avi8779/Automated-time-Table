import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { section: 'Overview' },
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/generate', label: 'Generate', icon: '⚡' },
  { path: '/timetable', label: 'View Timetable', icon: '⊞' },
  { section: 'Management' },
  { path: '/departments', label: 'Departments', icon: '⬡' },
  { path: '/courses', label: 'Courses', icon: '◉' },
  { path: '/teachers', label: 'Teachers', icon: '◎' },
  { path: '/subjects', label: 'Subjects', icon: '◇' },
  { path: '/sections', label: 'Sections', icon: '⊟' },
  { section: 'Infrastructure' },
  { path: '/buildings', label: 'Buildings', icon: '▣' },
  { path: '/rooms', label: 'Rooms', icon: '▤' },
  { path: '/timeslots', label: 'Time Slots', icon: '◷' },
  { path: '/assignments', label: 'Teacher–Subject', icon: '⟷' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          Auto<span>Schedule</span>
        </div>
        <div className={styles.logoSub}>Timetable Engine v1.0</div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className={styles.sectionLabel}>{item.section}</div>
            );
          }
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.apiStatus}>
          <span className={styles.dot} id="api-status-dot" />
          <span>API Connected</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
