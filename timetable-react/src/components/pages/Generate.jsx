import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { timetableApi } from '../../api';
import styles from './Generate.module.css';

const STEPS = [
  { icon: '⬡', title: 'Departments & Courses', desc: 'Define your academic structure' },
  { icon: '◎', title: 'Teachers', desc: 'Add faculty with hour constraints' },
  { icon: '◇', title: 'Subjects', desc: 'Map subjects to courses' },
  { icon: '⟷', title: 'Assignments', desc: 'Link teachers to their subjects' },
  { icon: '⊟', title: 'Sections', desc: 'Create class sections' },
  { icon: '▤', title: 'Rooms & Time Slots', desc: 'Configure rooms and schedule slots' },
];

const FEATURES = [
  { icon: '🔄', title: 'Constraint Solving', desc: 'Avoids teacher conflicts, room double-booking, and respects max hours per day/week.' },
  { icon: '🏫', title: 'Smart Room Matching', desc: 'Assigns classrooms or labs based on subject type and section strength.' },
  { icon: '📊', title: 'Weekly Distribution', desc: 'Distributes subject hours across the week as per your configuration.' },
  { icon: '⚡', title: 'Instant Generation', desc: 'Generates complete timetables for all sections simultaneously.' },
];

const Generate = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await timetableApi.generate();
      toast.success(r.message || 'Timetable generated!');
      setResult({ success: true, message: r.message });
    } catch (e) {
      toast.error(e.message);
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.heroLabel}>Scheduling Engine</div>
          <h1 className={styles.heroTitle}>Generate Timetable</h1>
          <p className={styles.heroDesc}>
            Our constraint-based engine automatically assigns teachers, rooms,
            and time slots to all active sections — in one click.
          </p>
          <button
            className={`${styles.genBtn} ${loading ? styles.genBtnLoading : ''}`}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Generating…
              </>
            ) : (
              <>⚡ Generate Now</>
            )}
          </button>

          {result && (
            <div className={`${styles.result} ${result.success ? styles.resultSuccess : styles.resultError}`}>
              <span>{result.success ? '✅' : '❌'}</span>
              {result.message}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sections}>
        <div className={styles.sectionTitle}>
          <h2>How it works</h2>
          <p>The engine uses all the data you've configured to build conflict-free schedules.</p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.checklist}>
          <h3 className={styles.checklistTitle}>Prerequisites Checklist</h3>
          <p className={styles.checklistSub}>Make sure these are set up before generating:</p>
          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;
