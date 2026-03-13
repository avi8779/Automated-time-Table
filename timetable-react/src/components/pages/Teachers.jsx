import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { teachersApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { teacher_code: '', name: '', email: '', depart_id: '', max_hours_per_day: '4', max_hours_per_week: '20' };

const Teachers = () => {
  const { teachers, departments, refreshTeachers, refreshDepartments } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshTeachers(), refreshDepartments()]).finally(() => setLoading(false));
  }, [refreshTeachers, refreshDepartments]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });

  const deptOptions = departments.map((d) => ({
    value: d.depart_id || d.department_id,
    label: `${d.name} (${d.department_code})`,
  }));

  const handleCreate = async () => {
    if (!form.teacher_code || !form.name || !form.email || !form.depart_id)
      return toast.error('All required fields must be provided');
    setSubmitting(true);
    try {
      await teachersApi.create({
        ...form,
        max_hours_per_day: parseInt(form.max_hours_per_day),
        max_hours_per_week: parseInt(form.max_hours_per_week),
      });
      toast.success('Teacher created!');
      setModal(false);
      setForm(INIT);
      refreshTeachers();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await teachersApi.delete(id);
      toast.success('Teacher deleted');
      refreshTeachers();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    {
      key: 'teacher_code', header: 'Code',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {r.teacher_code}
        </span>
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email', render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.email}</span> },
    { key: 'department_name', header: 'Department', render: (r) => r.department_name || '—' },
    {
      key: 'max_hours_per_day', header: 'Max Hrs/Day',
      render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.max_hours_per_day}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(r.teacher_id)}>Delete</Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="Manage faculty members and their availability"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Teacher</Button>}
      />
      <Card>
        <Table columns={columns} data={teachers} loading={loading} emptyIcon="◎" emptyTitle="No teachers yet" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Teacher</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Teacher Code" id="t-code" placeholder="e.g. T001" required {...field('teacher_code')} />
          <FormField label="Full Name" id="t-name" placeholder="e.g. Dr. Jane Smith" required {...field('name')} />
          <FormField label="Email" id="t-email" type="email" placeholder="jane@college.edu" required full {...field('email')} />
          <FormField label="Department" id="t-dept" type="select" options={deptOptions} required {...field('depart_id')} />
          <FormField label="Max hrs/day (1–6)" id="t-maxd" type="number" min={1} max={6} placeholder="4" {...field('max_hours_per_day')} />
          <FormField label="Max hrs/week (1–30)" id="t-maxw" type="number" min={1} max={30} placeholder="20" {...field('max_hours_per_week')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Teachers;
