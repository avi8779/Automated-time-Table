import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card, CardHeader, CardBody } from '../common/Card';
import Table, { Badge } from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { departmentsApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { department_code: '', name: '' };

const Departments = () => {
  const { departments, refreshDepartments } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [editForm, setEditForm] = useState(INIT);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    refreshDepartments().finally(() => setLoading(false));
  }, [refreshDepartments]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });
  const editField = (key) => ({ value: editForm[key], onChange: (v) => setEditForm((p) => ({ ...p, [key]: v })) });

  const handleCreate = async () => {
    if (!form.department_code || !form.name) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await departmentsApi.create(form);
      toast.success('Department created!');
      setModal(false);
      setForm(INIT);
      refreshDepartments();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editForm.department_code || !editForm.name) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await departmentsApi.update(editId, editForm);
      toast.success('Department updated!');
      setEditModal(false);
      refreshDepartments();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await departmentsApi.delete(id);
      toast.success('Department deleted');
      refreshDepartments();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    {
      key: 'department_code', header: 'Code',
      render: (row) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {row.department_code}
        </span>
      ),
    },
    { key: 'name', header: 'Name' },
    {
      key: 'status', header: 'Status',
      render: () => <Badge variant="active">● Active</Badge>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => {
            setEditId(row.depart_id || row.department_id);
            setEditForm({ department_code: row.department_code, name: row.name });
            setEditModal(true);
          }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.depart_id || row.department_id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage academic departments"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Department</Button>}
      />

      <Card>
        <Table
          columns={columns}
          data={departments}
          loading={loading}
          emptyIcon="⬡"
          emptyTitle="No departments yet"
          emptyDesc="Add your first department to get started"
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Department</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Department Code" id="dept-code" placeholder="e.g. CS, IT" required {...field('department_code')} />
          <FormField label="Department Name" id="dept-name" placeholder="e.g. Computer Science" required {...field('name')} />
        </FormGrid>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleEdit}>Save Changes</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Department Code" id="edit-dept-code" placeholder="e.g. CS" required {...editField('department_code')} />
          <FormField label="Department Name" id="edit-dept-name" placeholder="e.g. Computer Science" required {...editField('name')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Departments;
