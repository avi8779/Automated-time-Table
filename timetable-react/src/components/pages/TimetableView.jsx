import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { timetableApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { formatTime, DAYS, DAY_LABELS } from '../../utils/helpers';
import styles from './TimetableView.module.css';
import { Spinner } from '../common/Table';

const TimetableView = () => {
  const { sections, refreshSections } = useApp();
  const [selectedSection, setSelectedSection] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { refreshSections(); }, [refreshSections]);

  const loadTimetable = async (sectionId) => {
    if (!sectionId) return;
    setLoading(true);
    setLoaded(false);
    try {
      const r = await timetableApi.getBySection(sectionId);
      setTimetable(r.data || []);
      setLoaded(true);
    } catch (e) {
      toast.error(e.message);
      setTimetable([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedSection(id);
    if (id) loadTimetable(id);
    else { setTimetable([]); setLoaded(false); }
  };

  // Build grid data
  const byTime = {};
  timetable.forEach((row) => {
    const key = `${row.start_time}__${row.end_time}`;
    if (!byTime[key]) byTime[key] = { start: row.start_time, end: row.end_time, slots: {} };
    byTime[key].slots[row.day] = row;
  });
  const times = Object.values(byTime).sort((a, b) => a.start.localeCompare(b.start));

  const sectionObj = sections.find((s) => String(s.section_id) === String(selectedSection));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Timetable Viewer</h1>
          <p className={styles.subtitle}>Select a section to view its generated timetable</p>
        </div>
      </div>

      <div className={styles.selectorCard}>
        <div className={styles.selectorRow}>
          <div className={styles.selectorLeft}>
            <label className={styles.selectorLabel}>Section</label>
            <select className={styles.selectorInput} value={selectedSection} onChange={handleChange}>
              <option value="">— Choose a section —</option>
              {sections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name} {s.course_name ? `· ${s.course_name}` : ''} · Sem {s.semester} · {s.batch_year}
                </option>
              ))}
            </select>
          </div>
          {sectionObj && (
            <div className={styles.sectionMeta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>Strength</span>
                <span className={styles.metaVal}>{sectionObj.strength}</span>
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>Status</span>
                <span className={styles.metaVal}>{sectionObj.status}</span>
              </span>
              {timetable.length > 0 && (
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Classes</span>
                  <span className={styles.metaVal}>{timetable.length}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.loadingWrap}><Spinner center /></div>
      )}

      {!loading && loaded && timetable.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No timetable found for this section</h3>
          <p>Generate a timetable first from the Generate page, then come back to view it.</p>
        </div>
      )}

      {!loading && times.length > 0 && (
        <div className={styles.tableWrap}>
          <div className={styles.printInfo}>
            Timetable for <strong>{sectionObj?.section_name}</strong>
            {sectionObj?.course_name && ` · ${sectionObj.course_name}`}
            {sectionObj?.semester && ` · Semester ${sectionObj.semester}`}
          </div>
          <div className={styles.gridScroll}>
            <div className={styles.grid} style={{ gridTemplateColumns: `90px repeat(${DAYS.length}, 1fr)` }}>
              {/* Header */}
              <div className={styles.headCell} />
              {DAYS.map((d) => (
                <div key={d} className={styles.headCell}>
                  <span className={styles.dayAbbr}>{d}</span>
                  <span className={styles.dayFull}>{DAY_LABELS[d]}</span>
                </div>
              ))}

              {/* Rows */}
              {times.map((t, ri) => (
                <React.Fragment key={`${t.start}__${t.end}`}>
                  <div className={styles.timeCell}>
                    <span className={styles.timeStart}>{formatTime(t.start)}</span>
                    <span className={styles.timeSep}>↓</span>
                    <span className={styles.timeEnd}>{formatTime(t.end)}</span>
                  </div>
                  {DAYS.map((d) => {
                    const slot = t.slots[d];
                    return (
                      <div key={d} className={`${styles.cell} ${ri % 2 === 0 ? styles.cellAlt : ''}`}>
                        {slot ? (
                          <div className={`${styles.slot} ${slot.is_lab ? styles.slotLab : ''}`}>
                            <div className={styles.slotSubject}>{slot.subject_name}</div>
                            <div className={styles.slotTeacher}>{slot.teacher_name}</div>
                            <div className={styles.slotRoom}>
                              <span className={styles.roomDot}>◉</span> {slot.room_code}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.emptyCell}>—</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendTitle}>Legend:</span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'rgba(99,179,237,0.2)', borderColor: 'rgba(99,179,237,0.4)' }} />
              Classroom
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'rgba(183,148,244,0.15)', borderColor: 'rgba(183,148,244,0.4)' }} />
              Lab
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
