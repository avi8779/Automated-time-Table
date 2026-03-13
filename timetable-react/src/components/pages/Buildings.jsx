import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { buildingsApi } from '../../api';
import { useApp } from '../../context/AppContext';

const INIT = { building_code: '', name: '' };

const Buildings = () => {
  const { buildings, refreshBuildings } = useApp();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    refreshBuildings().finally(() => setLoading(false));
  }, [refreshBuildings]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });

  const handleCreate = async () => {
    if (!form.building_code || !form.name) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await buildingsApi.create(form);
      toast.success('Building created!');
      setModal(false);
      setForm(INIT);
      refreshBuildings();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const columns = [
    {
      key: 'building_code', header: 'Code',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {r.building_code}
        </span>
      ),
    },
    { key: 'name', header: 'Building Name' },
  ];

  return (
    <div>
      <PageHeader
        title="Buildings"
        subtitle="Manage campus buildings and infrastructure"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Building</Button>}
      />
      <Card>
        <Table columns={columns} data={buildings} loading={loading} emptyIcon="▣" emptyTitle="No buildings yet" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Building"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Building</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Building Code" id="b-code" placeholder="e.g. A, MAIN" required {...field('building_code')} />
          <FormField label="Building Name" id="b-name" placeholder="e.g. Main Block" required {...field('name')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Buildings;
