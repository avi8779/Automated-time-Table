import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../common/PageHeader';
import { Card } from '../common/Card';
import Table, { Badge } from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import FormField, { FormGrid } from '../common/FormField';
import { roomsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import styles from './Rooms.module.css';

const INIT = { room_code: '', building_id: '', capacity: '', room_type: 'CLASSROOM' };

const Rooms = () => {
  const { buildings, refreshBuildings } = useApp();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const loadRooms = async () => {
    try { const r = await roomsApi.getAll(); setRooms(r.data || []); } catch {}
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadRooms(), refreshBuildings()]).finally(() => setLoading(false));
  }, [refreshBuildings]);

  const field = (key) => ({ value: form[key], onChange: (v) => setForm((p) => ({ ...p, [key]: v })) });
  const buildingOptions = buildings.map((b) => ({ value: b.building_id, label: `${b.name} (${b.building_code})` }));
  const typeOptions = [{ value: 'CLASSROOM', label: 'Classroom' }, { value: 'LAB', label: 'Lab' }];

  const filtered = filter === 'all' ? rooms : rooms.filter((r) => r.room_type === filter);

  const handleCreate = async () => {
    if (!form.room_code || !form.building_id || !form.capacity || !form.room_type)
      return toast.error('All fields required');
    setSubmitting(true);
    try {
      await roomsApi.create({ ...form, capacity: parseInt(form.capacity) });
      toast.success('Room created!');
      setModal(false);
      setForm(INIT);
      loadRooms();
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const columns = [
    {
      key: 'room_code', header: 'Room Code',
      render: (r) => (
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 5 }}>
          {r.room_code}
        </span>
      ),
    },
    { key: 'building_name', header: 'Building', render: (r) => r.building_name || '—' },
    { key: 'room_type', header: 'Type', render: (r) => <Badge variant={r.room_type === 'LAB' ? 'lab' : 'classroom'}>{r.room_type}</Badge> },
    { key: 'capacity', header: 'Capacity', render: (r) => <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{r.capacity}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Manage classrooms and laboratories"
        action={<Button onClick={() => setModal(true)} icon="＋">Add Room</Button>}
      />
      <div className={styles.filters}>
        {['all', 'CLASSROOM', 'LAB'].map((f) => (
          <button
            key={f}
            className={`${styles.chip} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Rooms' : f === 'CLASSROOM' ? '📖 Classrooms' : '🔬 Labs'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-dim)' }}>
          {filtered.length} room{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>
      <Card>
        <Table columns={columns} data={filtered} loading={loading} emptyIcon="▤" emptyTitle="No rooms found" searchable={false} />
      </Card>
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(INIT); }}
        title="Add Room"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleCreate}>Create Room</Button>
          </>
        }
      >
        <FormGrid>
          <FormField label="Room Code" id="r-code" placeholder="e.g. A101" required {...field('room_code')} />
          <FormField label="Building" id="r-building" type="select" options={buildingOptions} required {...field('building_id')} />
          <FormField label="Capacity" id="r-cap" type="number" min={1} max={300} placeholder="60" required {...field('capacity')} />
          <FormField label="Room Type" id="r-type" type="select" options={typeOptions} required {...field('room_type')} />
        </FormGrid>
      </Modal>
    </div>
  );
};

export default Rooms;
