import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { coursesApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { course_code: '', course_name: '', depart_id: '', duration_years: '' };

const Courses = () => {
  const { courses, departments, refreshCourses, refreshDepartments } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshCourses(), refreshDepartments()]).finally(() => setLoading(false));
  }, [refreshCourses, refreshDepartments]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });

  const deptOptions = departments.map((d) => ({
    value: d.depart_id || d.department_id,
    label: `${d.name} (${d.department_code})`,
  }));

  const handleCreate = async () => {
    if (!form.course_code || !form.course_name || !form.depart_id || !form.duration_years)
      return toast.error('All fields required');
    setSubmitting(true);
    try {
      await coursesApi.create({ ...form, duration_years: parseInt(form.duration_years) });
      toast.success('Course created!');
      setModal(false);
      setForm(INIT);
      refreshCourses();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await coursesApi.delete(id);
      toast.success('Course deleted');
      refreshCourses();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    {
      key: 'course_code', header: 'Code',
      render: (row) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {row.course_code}
        </span>
      ),
    },
    { key: 'course_name', header: 'Course Name' },
    { key: 'department_name', header: 'Department', render: (r) => r.department_name || '—' },
    {
      key: 'duration_years', header: 'Duration',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.duration_years} yrs</span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(r.course_id)}>Delete</Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Manage academic courses offered by departments"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Course</Button>}
      />
      <Card>
        <Table columns={columns} data={courses} loading={loading} emptyIcon="◉" emptyTitle="No courses yet" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Course"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Course</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Course Code" id="course-code" placeholder="e.g. BTECH-CS" required {...field('course_code')} />
          <FormField label="Course Name" id="course-name" placeholder="e.g. B.Tech Computer Science" required {...field('course_name')} />
          <FormField label="Department" id="course-dept" type="select" options={deptOptions} required {...field('depart_id')} />
          <FormField label="Duration (years)" id="course-dur" type="number" placeholder="4" min={1} max={6} required {...field('duration_years')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Courses;
