import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { roomSlice } from "../../Redux/store";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

const { getAll, createItem, updateItem, deleteItem } = roomSlice.actions;

const INPUT_CLS  = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500";
const SELECT_CLS = "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40";

const EMPTY = {
  building_id: "", room_no: "", floor_no: "", room_type: "CLASSROOM",
  capacity: 40, status: "AVAILABLE", has_projector: 0, has_ac: 0,
};

export default function CreateRoom() {
  const dispatch = useDispatch();
  const { data: rooms, loading } = useSelector((s) => s.room);

  const [buildings,    setBuildings]    = useState([]);
  const [roomSlots,    setRoomSlots]    = useState([]); // unassigned slots for selected building
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [isEditing,    setIsEditing]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [submitting,   setSubmitting]   = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    dispatch(getAll());
    axiosInstance.get("/buildings")
      .then((r) => setBuildings(r.data.data || []))
      .catch(() => {});
  }, [dispatch]);

  // Load room slots when building changes in form
  useEffect(() => {
    if (!form.building_id) { setRoomSlots([]); return; }
    setLoadingSlots(true);
    axiosInstance.get(`/buildings/${form.building_id}/room-slots`)
      .then((r) => setRoomSlots(r.data.data || []))
      .catch(() => toast.error("Failed to load room slots"))
      .finally(() => setLoadingSlots(false));
  }, [form.building_id]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // When a room slot is selected, auto-fill floor_no
  const handleRoomSelect = (room_no) => {
    const slot = roomSlots.find((s) => s.room_no === room_no);
    setForm((f) => ({
      ...f,
      room_no,
      floor_no: slot ? slot.floor_no : f.floor_no,
    }));
  };

  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm(EMPTY); setModalOpen(true);
  };

  const openEdit = (item) => {
    setIsEditing(true); setEditingId(item.room_id);
    setForm({
      building_id:   item.building_id   || "",
      room_no:       item.room_no       || "",
      floor_no:      item.floor_no      || "",
      room_type:     item.room_type     || "CLASSROOM",
      capacity:      item.capacity      || 40,
      status:        item.status        || "AVAILABLE",
      has_projector: item.has_projector || 0,
      has_ac:        item.has_ac        || 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building_id || !form.room_no || !form.capacity || !form.room_type)
      return toast.error("Building, Room No, Capacity and Type are required");

    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateItem({ id: editingId, data: form }));
      } else {
        await dispatch(createItem({
          ...form,
          building_id:   Number(form.building_id),
          capacity:      Number(form.capacity),
          floor_no:      Number(form.floor_no),
          has_projector: Number(form.has_projector),
          has_ac:        Number(form.has_ac),
        }));
      }
      await dispatch(getAll());
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    await dispatch(deleteItem(id));
    await dispatch(getAll());
  };

  const displayData = useMemo(() => {
    let r = rooms;
    if (filterType)   r = r.filter((x) => x.room_type === filterType);
    if (filterStatus) r = r.filter((x) => x.status === filterStatus);
    if (search) r = r.filter((x) => Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [rooms, filterType, filterStatus, search]);

  const totalPages    = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
  const paginatedData = displayData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group slots by floor for display
  const slotsByFloor = useMemo(() => {
    const map = {};
    roomSlots.forEach((s) => {
      if (!map[s.floor_no]) map[s.floor_no] = [];
      map[s.floor_no].push(s);
    });
    return map;
  }, [roomSlots]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">Rooms</h1>
            <p className="text-slate-400 text-sm mt-1">Room numbers come from building floor plans</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400">
            + Add Room
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl items-end">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 self-center">Filter</span>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Type</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none">
              <option value="">All Types</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Lab</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none">
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none w-48" />
          {(filterType || filterStatus || search) && (
            <button onClick={() => { setFilterType(""); setFilterStatus(""); setSearch(""); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 self-end">✕ Clear</button>
          )}
          <span className="text-xs text-slate-500 self-end">{displayData.length} rooms</span>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 animate-pulse text-sm">Loading...</div>
          ) : paginatedData.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No rooms found.</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 bg-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Room No</th>
                    <th className="px-4 py-3 text-left">Building</th>
                    <th className="px-4 py-3 text-left">Floor</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Capacity</th>
                    <th className="px-4 py-3 text-left">Projector</th>
                    <th className="px-4 py-3 text-left">AC</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((r, idx) => (
                    <tr key={r.room_id} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs">{(page-1)*PAGE_SIZE+idx+1}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{r.room_no}</td>
                      <td className="px-4 py-3 text-slate-400">{r.building_name || r.building_code || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{r.floor_no}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.room_type === "LAB" ? "bg-violet-900/50 text-violet-300" : "bg-blue-900/50 text-blue-300"}`}>
                          {r.room_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.capacity}</td>
                      <td className="px-4 py-3 text-xs">{r.has_projector ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-3 text-xs">{r.has_ac ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "AVAILABLE" ? "bg-emerald-900/50 text-emerald-300" : r.status === "MAINTENANCE" ? "bg-amber-900/50 text-amber-300" : "bg-slate-700 text-slate-400"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button onClick={() => openEdit(r)} className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600">Edit</button>
                        <button onClick={() => handleDelete(r.room_id)} className="px-3 py-1 rounded text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{displayData.length} rooms · Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(1)} disabled={page===1} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">«</button>
                    <button onClick={() => setPage(p=>p-1)} disabled={page===1} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">‹</button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-xs ${p===page?"bg-emerald-500 text-slate-950 font-bold":"text-slate-400 hover:bg-slate-800"}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p=>p+1)} disabled={page===totalPages} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">›</button>
                    <button onClick={() => setPage(totalPages)} disabled={page===totalPages} className="px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">»</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-1">{isEditing ? "Edit Room" : "Add Room"}</h2>
              {!isEditing && <p className="text-xs text-slate-500 mb-5">Select a building to see available room numbers from its floor plan</p>}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">

                  {/* Step 1 — Building */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Building <span className="text-red-400">*</span></label>
                    <select value={form.building_id}
                      onChange={(e) => { setField("building_id", e.target.value); setField("room_no", ""); setField("floor_no", ""); }}
                      className={SELECT_CLS}>
                      <option value="">— select building —</option>
                      {buildings.map((b) => (
                        <option key={b.building_id} value={b.building_id}>
                          {b.building_name} ({b.building_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2 — Room Number from slots */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">
                      Room Number <span className="text-red-400">*</span>
                      {form.building_id && !isEditing && (
                        <span className="ml-2 text-slate-500 normal-case font-normal">
                          {loadingSlots ? "Loading slots…" : `${roomSlots.length} slots available`}
                        </span>
                      )}
                    </label>
                    {isEditing ? (
                      <input type="text" value={form.room_no} onChange={(e) => setField("room_no", e.target.value)} className={INPUT_CLS} />
                    ) : (
                      <>
                        <select value={form.room_no} onChange={(e) => handleRoomSelect(e.target.value)}
                          disabled={!form.building_id || loadingSlots}
                          className={SELECT_CLS}>
                          <option value="">— select room number —</option>
                          {Object.entries(slotsByFloor).sort(([a],[b])=>Number(a)-Number(b)).map(([floor, slots]) => (
                            <optgroup key={floor} label={`Floor ${floor}`}>
                              {slots.map((s) => (
                                <option key={s.slot_id} value={s.room_no}>{s.room_no}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {form.building_id && roomSlots.length === 0 && !loadingSlots && (
                          <p className="text-xs text-amber-400 mt-1">⚠️ All room slots for this building are already configured.</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Floor (auto-filled) */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Floor No {!isEditing && <span className="text-slate-600">(auto-filled)</span>}</label>
                    <input type="number" min="0" value={form.floor_no} onChange={(e) => setField("floor_no", e.target.value)}
                      readOnly={!isEditing} className={`${INPUT_CLS} ${!isEditing ? "opacity-60" : ""}`} />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Capacity <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="300" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)} className={INPUT_CLS} />
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Room Type</label>
                    <select value={form.room_type} onChange={(e) => setField("room_type", e.target.value)} className={SELECT_CLS}>
                      <option value="CLASSROOM">Classroom</option>
                      <option value="LAB">Lab / Practical</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={SELECT_CLS}>
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  {/* Amenities */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-2">Amenities</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!Number(form.has_projector)}
                          onChange={(e) => setField("has_projector", e.target.checked ? 1 : 0)}
                          className="w-4 h-4 accent-emerald-500" />
                        <span className="text-sm text-slate-300">📽️ Projector</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!Number(form.has_ac)}
                          onChange={(e) => setField("has_ac", e.target.checked ? 1 : 0)}
                          className="w-4 h-4 accent-emerald-500" />
                        <span className="text-sm text-slate-300">❄️ AC</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-4 py-2 rounded text-sm">
                    {submitting ? "Saving..." : isEditing ? "Update Room" : "Add Room"}
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