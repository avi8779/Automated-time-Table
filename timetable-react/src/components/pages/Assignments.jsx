import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card, CardHeader, CardBody } from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { teacherSubjectApi } from '../../api';
import { useApp } from '../../context/AppContext';
import styles from './Assignments.module.css';

const Assignments = () => {
  const { teachers, subjects, refreshTeachers, refreshSubjects } = useApp();
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [modal, setModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ teacher_id: '', subject_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refreshTeachers();
    refreshSubjects();
  }, [refreshTeachers, refreshSubjects]);

  const loadAssignments = async (teacherId) => {
    if (!teacherId) return setAssignments([]);
    setLoadingAssignments(true);
    try {
      const r = await teacherSubjectApi.getByTeacher(teacherId);
      setAssignments(r.data || []);
    } catch { setAssignments([]); } finally { setLoadingAssignments(false); }
  };

  const handleTeacherChange = (id) => {
    setSelectedTeacher(id);
    loadAssignments(id);
  };

  const handleAssign = async () => {
    if (!assignForm.teacher_id || !assignForm.subject_id) return toast.error('Select both teacher and subject');
    setSubmitting(true);
    try {
      await teacherSubjectApi.assign({ teacher_id: assignForm.teacher_id, subject_id: assignForm.subject_id });
      toast.success('Subject assigned!');
      setModal(false);
      setAssignForm({ teacher_id: '', subject_id: '' });
      if (selectedTeacher === assignForm.teacher_id) loadAssignments(selectedTeacher);
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleRemove = async (subjectId) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await teacherSubjectApi.remove(selectedTeacher, subjectId);
      toast.success('Assignment removed');
      loadAssignments(selectedTeacher);
    } catch (e) { toast.error(e.message); }
  };

  const teacherOptions = teachers.map((t) => ({ value: String(t.teacher_id), label: `${t.name} (${t.teacher_code})` }));
  const subjectOptions = subjects.map((s) => ({ value: String(s.subject_id), label: `${s.name} (${s.subject_code})` }));

  const columns = [
    {
      key: 'subject_code', header: 'Subject Code',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {r.subject_code}
        </span>
      ),
    },
    { key: 'name', header: 'Subject Name' },
    { key: 'weekly_hours', header: 'Hrs/Week', render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.weekly_hours}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => <Button size="sm" variant="danger" onClick={() => handleRemove(r.subject_id)}>Remove</Button>,
    },
  ];

  const selectedTeacherObj = teachers.find((t) => String(t.teacher_id) === String(selectedTeacher));

  return (
    <div>
      <PageHeader
        title="Teacher–Subject Assignments"
        subtitle="Link teachers to the subjects they can teach"
        action={<Button onClick={() => setModal(true)} icon="＋">New Assignment</Button>}
      />

      <Card>
        <CardHeader title="Select Teacher to View Assignments" />
        <CardBody>
          <div className={styles.selectorRow}>
            <select
              className={styles.teacherSelect}
              value={selectedTeacher}
              onChange={(e) => handleTeacherChange(e.target.value)}
            >
              <option value="">— Select a teacher —</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.name} ({t.teacher_code})
                </option>
              ))}
            </select>
            {selectedTeacherObj && (
              <div className={styles.teacherInfo}>
                <span className={styles.teacherName}>{selectedTeacherObj.name}</span>
                <span className={styles.teacherMeta}>{selectedTeacherObj.email}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {selectedTeacher && (
        <div style={{ marginTop: 20 }}>
          <Card>
            <CardHeader
              title={`Subjects assigned to ${selectedTeacherObj?.name || 'teacher'}`}
              action={
                <Button size="sm" onClick={() => {
                  setAssignForm({ teacher_id: String(selectedTeacher), subject_id: '' });
                  setModal(true);
                }} icon="＋">Add Subject</Button>
              }
            />
            <Table
              columns={columns}
              data={assignments}
              loading={loadingAssignments}
              emptyIcon="⟷"
              emptyTitle="No subjects assigned"
              emptyDesc="Assign subjects to this teacher to enable scheduling"
              searchable={false}
            />
          </Card>
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setAssignForm({ teacher_id: '', subject_id: '' }); }}
        title="Assign Subject to Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <FormGrid cols={1}>
          <FormField
            label="Teacher" id="a-teacher" type="select"
            options={teacherOptions} required
            value={assignForm.teacher_id}
            onChange={(v) => setAssignForm((p) => ({ ...p, teacher_id: v }))}
          />
          <FormField
            label="Subject" id="a-subject" type="select"
            options={subjectOptions} required
            value={assignForm.subject_id}
            onChange={(v) => setAssignForm((p) => ({ ...p, subject_id: v }))}
          />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Assignments;
