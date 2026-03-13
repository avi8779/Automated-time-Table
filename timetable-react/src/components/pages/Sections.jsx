import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table, { Badge } from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { sectionsApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { section_name: '', course_id: '', semester: '', strength: '', batch_year: '', status: 'ACTIVE' };

const Sections = () => {
  const { sections, courses, refreshSections, refreshCourses } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshSections(), refreshCourses()]).finally(() => setLoading(false));
  }, [refreshSections, refreshCourses]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });
  const courseOptions = courses.map((c) => ({ value: c.course_id, label: `${c.course_name} (${c.course_code})` }));
  const statusOptions = [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }];

  const handleCreate = async () => {
    if (!form.section_name || !form.course_id || !form.semester || !form.strength || !form.batch_year)
      return toast.error('All fields required');
    setSubmitting(true);
    try {
      await sectionsApi.create({
        ...form,
        semester: parseInt(form.semester),
        strength: parseInt(form.strength),
        batch_year: parseInt(form.batch_year),
      });
      toast.success('Section created!');
      setModal(false);
      setForm(INIT);
      refreshSections();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await sectionsApi.delete(id);
      toast.success('Section deleted');
      refreshSections();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'section_name', header: 'Section Name', render: (r) => <strong>{r.section_name}</strong> },
    { key: 'course_name', header: 'Course', render: (r) => r.course_name || '—' },
    { key: 'semester', header: 'Semester', render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>Sem {r.semester}</span> },
    { key: 'strength', header: 'Strength', render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.strength}</span> },
    { key: 'batch_year', header: 'Batch', render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.batch_year}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'active' : 'inactive'}>{r.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => <Button size="sm" variant="danger" onClick={() => handleDelete(r.section_id)}>Delete</Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Sections"
        subtitle="Manage class sections across courses and semesters"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Section</Button>}
      />
      <Card>
        <Table columns={columns} data={sections} loading={loading} emptyIcon="⊟" emptyTitle="No sections yet" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Section"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Section</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Section Name" id="sec-name" placeholder="e.g. CS-A" required {...field('section_name')} />
          <FormField label="Course" id="sec-course" type="select" options={courseOptions} required {...field('course_id')} />
          <FormField label="Semester" id="sec-sem" type="number" min={1} max={10} placeholder="1" required {...field('semester')} />
          <FormField label="Strength" id="sec-str" type="number" min={1} max={300} placeholder="60" required {...field('strength')} />
          <FormField label="Batch Year" id="sec-batch" type="number" min={2000} max={2100} placeholder="2024" required {...field('batch_year')} />
          <FormField label="Status" id="sec-status" type="select" options={statusOptions} {...field('status')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Sections;
