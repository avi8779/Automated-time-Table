import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buildingSlice } from "../../Redux/store";
import { toast } from "react-toastify";
import axiosInstance from "../../Helper/axiosInstance";

const { getAll, createItem, updateItem, deleteItem } = buildingSlice.actions;

const INPUT_CLS  = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500";
const SELECT_CLS = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500";

const EMPTY = { building_code: "", building_name: "", floors: 1, rooms_per_floor: 10, status: "ACTIVE" };

export default function CreateBuilding() {
  const dispatch = useDispatch();
  const { data: buildings, loading } = useSelector((s) => s.building);

  const [modalOpen,  setModalOpen]  = useState(false);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [search,     setSearch]     = useState("");

  // Floor preview panel
  const [previewOpen, setPreviewOpen] = useState(null); // building_id

  useEffect(() => { dispatch(getAll()); }, [dispatch]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Generate room number preview
  const roomPreview = useMemo(() => {
    const floors = Number(form.floors) || 0;
    const rpf    = Number(form.rooms_per_floor) || 0;
    const result = [];
    for (let f = 1; f <= Math.min(floors, 5); f++) {
      const rooms = [];
      for (let r = 1; r <= Math.min(rpf, 10); r++) {
        rooms.push(`${f}${String(r).padStart(2, "0")}`);
      }
      if (rpf > 10) rooms.push(`...+${rpf - 10} more`);
      result.push({ floor: f, rooms });
    }
    if (floors > 5) result.push({ floor: "...", rooms: [`+${floors - 5} more floors`] });
    return result;
  }, [form.floors, form.rooms_per_floor]);

  const totalRooms = Number(form.floors) * Number(form.rooms_per_floor);

  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm(EMPTY); setModalOpen(true);
  };

  const openEdit = (item) => {
    setIsEditing(true); setEditingId(item.building_id);
    setForm({
      building_code:  item.building_code,
      building_name:  item.building_name,
      floors:         item.floors,
      rooms_per_floor: item.rooms_per_floor || 10,
      status:         item.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building_code || !form.building_name || !form.floors || !form.rooms_per_floor)
      return toast.error("All fields are required");

    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateItem({ id: editingId, data: form }));
      } else {
        await dispatch(createItem({
          ...form,
          floors:          Number(form.floors),
          rooms_per_floor: Number(form.rooms_per_floor),
        }));
      }
      await dispatch(getAll());
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this building?")) return;
    await dispatch(deleteItem(id));
    await dispatch(getAll());
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? buildings.filter((b) => Object.values(b).join(" ").toLowerCase().includes(q)) : buildings;
  }, [buildings, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">Buildings</h1>
            <p className="text-slate-400 text-sm mt-1">Manage buildings — room numbers are auto-generated per floor</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400">
            + Add Building
          </button>
        </div>

        {/* Search */}
        <input type="text" placeholder="Search buildings..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-slate-900 border border-slate-800 w-80 focus:outline-none focus:border-emerald-500 text-slate-100 text-sm" />

        {/* Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 animate-pulse text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No buildings yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Floors</th>
                  <th className="px-4 py-3 text-left">Rooms/Floor</th>
                  <th className="px-4 py-3 text-left">Total Slots</th>
                  <th className="px-4 py-3 text-left">Configured</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => (
                  <tr key={b.building_id} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-600 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{b.building_code}</td>
                    <td className="px-4 py-3 font-medium">{b.building_name}</td>
                    <td className="px-4 py-3 text-slate-400">{b.floors}</td>
                    <td className="px-4 py-3 text-slate-400">{b.rooms_per_floor}</td>
                    <td className="px-4 py-3 text-slate-400">{b.total_slots || b.floors * b.rooms_per_floor}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400">{b.configured_rooms || 0}</span>
                      <span className="text-slate-600"> / {b.total_slots || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.status === "ACTIVE" ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button onClick={() => setPreviewOpen(previewOpen === b.building_id ? null : b.building_id)}
                        className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300 hover:bg-blue-900/50">
                        🏢 Floors
                      </button>
                      <button onClick={() => openEdit(b)} className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600">Edit</button>
                      <button onClick={() => handleDelete(b.building_id)} className="px-3 py-1 rounded text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Floor preview panel */}
        {previewOpen && <FloorPreview buildingId={previewOpen} buildings={buildings} />}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-1">{isEditing ? "Edit Building" : "Add Building"}</h2>
              <p className="text-xs text-slate-500 mb-5">Room numbers are auto-generated: Floor 1 → 101, 102... Floor 2 → 201, 202...</p>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Building Code <span className="text-red-400">*</span></label>
                    <input type="text" value={form.building_code} onChange={(e) => setField("building_code", e.target.value)}
                      placeholder="e.g. MB" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Building Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.building_name} onChange={(e) => setField("building_name", e.target.value)}
                      placeholder="e.g. Main Block" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Number of Floors <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="20" value={form.floors} onChange={(e) => setField("floors", e.target.value)} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Rooms per Floor <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="50" value={form.rooms_per_floor} onChange={(e) => setField("rooms_per_floor", e.target.value)} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={SELECT_CLS}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full px-4 py-2.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{totalRooms}</p>
                      <p className="text-xs text-slate-500">total room slots</p>
                    </div>
                  </div>
                </div>

                {/* Room number preview */}
                {form.floors > 0 && form.rooms_per_floor > 0 && (
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Room Number Preview</p>
                    {roomPreview.map((fp, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs text-slate-500 w-16 shrink-0">
                          {fp.floor === "..." ? fp.floor : `Floor ${fp.floor}`}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {fp.rooms.map((r, j) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded font-mono ${
                              r.includes("+") ? "text-slate-500 italic" : "bg-slate-700 text-slate-300"
                            }`}>{r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-4 py-2 rounded text-sm">
                    {submitting ? "Saving..." : isEditing ? "Update" : `Create with ${totalRooms} slots`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FloorPreview({ buildingId, buildings }) {
  const [floors, setFloors] = useState({});
  const [loading, setLoading] = useState(true);
  const building = buildings.find((b) => b.building_id === buildingId);

  useEffect(() => {
    axiosInstance.get(`/buildings/${buildingId}/floors`)
      .then((r) => setFloors(r.data.data || {}))
      .catch(() => toast.error("Failed to load floor data"))
      .finally(() => setLoading(false));
  }, [buildingId]);

  return (
    <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-blue-300">
        🏢 {building?.building_name} — Floor Map
      </h2>
      {loading ? (
        <div className="py-6 text-center text-slate-500 animate-pulse text-sm">Loading floor data...</div>
      ) : Object.keys(floors).length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-sm">No room slots generated yet.</div>
      ) : (
        Object.entries(floors).sort(([a],[b]) => Number(a)-Number(b)).map(([floor, rooms]) => (
          <div key={floor}>
            <p className="text-xs font-semibold text-slate-400 mb-2">Floor {floor}</p>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <div key={r.slot_id} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                  r.is_configured
                    ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  {r.room_no}
                  {r.is_configured && r.room_type && (
                    <span className="ml-1.5 text-slate-500">({r.room_type.charAt(0)})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <div className="flex gap-4 text-xs text-slate-500 pt-1">
        <span><span className="inline-block w-3 h-3 rounded bg-emerald-900/50 mr-1"></span>Configured</span>
        <span><span className="inline-block w-3 h-3 rounded bg-slate-800 mr-1"></span>Available</span>
      </div>
    </div>
  );
}