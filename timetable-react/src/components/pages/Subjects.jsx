import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table, { Badge } from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { subjectsApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { subject_code: '', name: '', course_id: '', depart_id: '', weekly_hours: '', is_lab: '0' };

const Subjects = () => {
  const { subjects, departments, courses, refreshSubjects, refreshDepartments, refreshCourses } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshSubjects(), refreshDepartments(), refreshCourses()]).finally(() => setLoading(false));
  }, [refreshSubjects, refreshDepartments, refreshCourses]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });

  const deptOptions = departments.map((d) => ({ value: d.depart_id || d.department_id, label: `${d.name} (${d.department_code})` }));
  const courseOptions = courses.map((c) => ({ value: c.course_id, label: `${c.course_name} (${c.course_code})` }));

  const handleCreate = async () => {
    if (!form.subject_code || !form.name || !form.course_id || !form.depart_id || !form.weekly_hours)
      return toast.error('All required fields must be provided');
    setSubmitting(true);
    try {
      await subjectsApi.create({ ...form, weekly_hours: parseInt(form.weekly_hours), is_lab: parseInt(form.is_lab) });
      toast.success('Subject created!');
      setModal(false);
      setForm(INIT);
      refreshSubjects();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await subjectsApi.delete(id);
      toast.success('Subject deleted');
      refreshSubjects();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    {
      key: 'subject_code', header: 'Code',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {r.subject_code}
        </span>
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'course_name', header: 'Course', render: (r) => r.course_name || '—' },
    {
      key: 'weekly_hours', header: 'Hrs/Week',
      render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.weekly_hours}</span>,
    },
    {
      key: 'is_lab', header: 'Type',
      render: (r) => <Badge variant={r.is_lab ? 'lab' : 'classroom'}>{r.is_lab ? 'Lab' : 'Classroom'}</Badge>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => <Button size="sm" variant="danger" onClick={() => handleDelete(r.subject_id)}>Delete</Button>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects assigned to courses"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Subject</Button>}
      />
      <Card>
        <Table columns={columns} data={subjects} loading={loading} emptyIcon="◇" emptyTitle="No subjects yet" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Subject"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Subject</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Subject Code" id="s-code" placeholder="e.g. CS301" required {...field('subject_code')} />
          <FormField label="Subject Name" id="s-name" placeholder="e.g. Data Structures" required {...field('name')} />
          <FormField label="Course" id="s-course" type="select" options={courseOptions} required {...field('course_id')} />
          <FormField label="Department" id="s-dept" type="select" options={deptOptions} required {...field('depart_id')} />
          <FormField label="Weekly Hours (1–10)" id="s-hrs" type="number" min={1} max={10} placeholder="3" required {...field('weekly_hours')} />
          <FormField label="Type" id="s-lab" type="select" options={[{ value: '0', label: 'Classroom' }, { value: '1', label: 'Lab' }]} {...field('is_lab')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Subjects;
