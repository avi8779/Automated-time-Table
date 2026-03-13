import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard, Card, CardHeader, CardBody } from '../common/Card';
import { Badge } from '../common/Table';
import { useApp } from '../../context/AppContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    departments, courses, teachers, subjects, sections,
    refreshDepartments, refreshCourses, refreshTeachers, refreshSubjects, refreshSections,
  } = useApp();

  useEffect(() => {
    refreshDepartments();
    refreshCourses();
    refreshTeachers();
    refreshSubjects();
    refreshSections();
  }, [refreshDepartments, refreshCourses, refreshTeachers, refreshSubjects, refreshSections]);

  return (
    <div>
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <div className={styles.welcomeLabel}>Welcome back</div>
          <h1 className={styles.welcomeTitle}>Timetable Dashboard</h1>
          <p className={styles.welcomeSub}>
            Manage your academic resources and generate automated schedules.
          </p>
        </div>
        <button className={styles.ctaBtn} onClick={() => navigate('/generate')}>
          <span>⚡</span> Generate Timetable
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon="⬡" value={departments.length} label="Departments" color="blue" />
        <StatCard icon="◉" value={courses.length} label="Courses" color="purple" />
        <StatCard icon="◎" value={teachers.length} label="Teachers" color="green" />
        <StatCard icon="◇" value={subjects.length} label="Subjects" color="orange" />
        <StatCard icon="⊟" value={sections.length} label="Sections" color="red" />
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Departments"
            action={
              <button className={styles.linkBtn} onClick={() => navigate('/departments')}>
                View all →
              </button>
            }
          />
          <CardBody noPad>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Code</th><th>Name</th>
                </tr>
              </thead>
              <tbody>
                {departments.slice(0, 6).map((d) => (
                  <tr key={d.depart_id || d.department_id}>
                    <td>
                      <span className={styles.code}>{d.department_code}</span>
                    </td>
                    <td>{d.name}</td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr><td colSpan={2} className={styles.emptyCell}>No departments yet</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Teachers"
            action={
              <button className={styles.linkBtn} onClick={() => navigate('/teachers')}>
                View all →
              </button>
            }
          />
          <CardBody noPad>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Dept</th>
                </tr>
              </thead>
              <tbody>
                {teachers.slice(0, 6).map((t) => (
                  <tr key={t.teacher_id}>
                    <td><span className={styles.code}>{t.teacher_code}</span></td>
                    <td>{t.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {t.department_name || '—'}
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan={3} className={styles.emptyCell}>No teachers yet</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Sections"
            action={
              <button className={styles.linkBtn} onClick={() => navigate('/sections')}>
                View all →
              </button>
            }
          />
          <CardBody noPad>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Name</th><th>Sem</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sections.slice(0, 6).map((s) => (
                  <tr key={s.section_id}>
                    <td><strong>{s.section_name}</strong></td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      Sem {s.semester}
                    </td>
                    <td>
                      <Badge variant={s.status === 'ACTIVE' ? 'active' : 'inactive'}>
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr><td colSpan={3} className={styles.emptyCell}>No sections yet</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody>
            <div className={styles.quickActions}>
              {[
                { label: 'Add Department', to: '/departments', icon: '⬡' },
                { label: 'Add Teacher', to: '/teachers', icon: '◎' },
                { label: 'Add Subject', to: '/subjects', icon: '◇' },
                { label: 'Add Section', to: '/sections', icon: '⊟' },
                { label: 'Add Room', to: '/rooms', icon: '▤' },
                { label: 'View Timetable', to: '/timetable', icon: '⊞' },
              ].map((a) => (
                <button key={a.to} className={styles.quickBtn} onClick={() => navigate(a.to)}>
                  <span className={styles.quickIcon}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
