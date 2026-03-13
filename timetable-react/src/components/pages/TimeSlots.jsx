import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table, { Badge } from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { timeSlotsApi } from '../../api';
import { formatTime, DAY_ORDER } from '../../utils/helpers';

const INIT = { day: 'MON', slot_order: '', start_time: '', end_time: '', is_break: '0', status: 'ACTIVE' };

const dayOptions = ['MON','TUE','WED','THU','FRI','SAT'].map((d) => ({ value: d, label: d }));
const statusOptions = [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }];
const breakOptions = [{ value: '0', label: 'No' }, { value: '1', label: 'Yes — Break' }];

const TimeSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = async () => {
    try {
      const r = await timeSlotsApi.getAll();
      const raw = r.data || [];
      setSlots(raw.sort((a, b) => (DAY_ORDER[a.day] - DAY_ORDER[b.day]) || a.slot_order - b.slot_order));
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    loadSlots().finally(() => setLoading(false));
  }, []);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });

  const handleCreate = async () => {
    if (!form.start_time || !form.end_time || !form.slot_order) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await timeSlotsApi.create({ ...form, slot_order: parseInt(form.slot_order), is_break: parseInt(form.is_break) });
      toast.success('Time slot created!');
      setModal(false);
      setForm(INIT);
      loadSlots();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this time slot?')) return;
    try {
      await timeSlotsApi.delete(id);
      toast.success('Slot deleted');
      loadSlots();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    {
      key: 'day', header: 'Day',
      render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)' }}>{r.day}</span>,
    },
    { key: 'start_time', header: 'Start Time', render: (r) => formatTime(r.start_time) },
    { key: 'end_time', header: 'End Time', render: (r) => formatTime(r.end_time) },
    {
      key: 'slot_order', header: 'Order',
      render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>#{r.slot_order}</span>,
    },
    {
      key: 'is_break', header: 'Break',
      render: (r) => r.is_break
        ? <Badge variant="warning">☕ Break</Badge>
        : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'active' : 'inactive'}>{r.status}</Badge> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => <Button size="sm" variant="danger" onClick={() => handleDelete(r.slot_id)}>Delete</Button>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Time Slots"
        subtitle="Configure daily time slots for scheduling"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Slot</Button>}
      />
      <Card>
        <Table columns={columns} data={slots} loading={loading} emptyIcon="◷" emptyTitle="No time slots yet" emptyDesc="Add time slots to enable timetable generation" />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Time Slot"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Slot</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Day" id="sl-day" type="select" options={dayOptions} required {...field('day')} />
          <FormField label="Slot Order" id="sl-order" type="number" min={1} placeholder="1" required {...field('slot_order')} />
          <FormField label="Start Time" id="sl-start" type="time" required {...field('start_time')} />
          <FormField label="End Time" id="sl-end" type="time" required {...field('end_time')} />
          <FormField label="Is Break?" id="sl-break" type="select" options={breakOptions} {...field('is_break')} />
          <FormField label="Status" id="sl-status" type="select" options={statusOptions} {...field('status')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default TimeSlots;
