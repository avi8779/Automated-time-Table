import CrudForm from "../../Components/CrudForm";
import { roomSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = roomSlice.actions;

// DB: room_id, room_no, building_id, capacity, room_type,
//     floor_no, status, has_projector, has_ac

const validateRoom = (form) => {
  if (!form.room_no || !form.building_id || !form.capacity || !form.room_type || !form.floor_no) {
    return "All required fields must be filled.";
  }
  const capacity = Number(form.capacity);
  if (capacity < 1 || capacity > 300) {
    return "Capacity must be between 1 and 300.";
  }
  if (!["CLASSROOM", "LAB"].includes(form.room_type.toUpperCase())) {
    return "Room type must be CLASSROOM or LAB.";
  }
  if (form.status && !["AVAILABLE", "OCCUPIED", "MAINTENANCE"].includes(form.status.toUpperCase())) {
    return "Status must be AVAILABLE, OCCUPIED or MAINTENANCE.";
  }
  return null;
};

const transformRoom = (form) => ({
  ...form,
  room_type:     form.room_type.toUpperCase(),
  building_id:   Number(form.building_id),
  capacity:      Number(form.capacity),
  floor_no:      Number(form.floor_no),
  status:        form.status?.toUpperCase() || "AVAILABLE",
  has_projector: Number(form.has_projector) || 0,
  has_ac:        Number(form.has_ac) || 0,
});

function CreateRoom() {
  return (
    <CrudForm
      title="Rooms"
      description="Manage rooms"
      sliceKey="room"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}   // ✅ now supported
      deleteAction={deleteItem}   // ✅ now supported
      idKey="room_id"
      validate={validateRoom}
      transform={transformRoom}
      columns={[
        { header: "Room No",   accessor: "room_no" },
        { header: "Building",  accessor: "building_name" },
        { header: "Capacity",  accessor: "capacity" },
        { header: "Type",      accessor: "room_type" },
        { header: "Floor",     accessor: "floor_no" },
        { header: "Status",    accessor: "status" },
        { header: "Projector", accessor: "has_projector" },
        { header: "AC",        accessor: "has_ac" },
      ]}
      fields={[
        { name: "room_no",       label: "Room No" },
        { name: "building_id",   label: "Building ID",                        type: "number" },
        { name: "capacity",      label: "Capacity",                           type: "number" },
        { name: "room_type",     label: "Type (CLASSROOM / LAB)" },
        { name: "floor_no",      label: "Floor No",                           type: "number" },
        { name: "status",        label: "Status (AVAILABLE / OCCUPIED / MAINTENANCE)" },
        { name: "has_projector", label: "Has Projector (0 / 1)",              type: "number" },
        { name: "has_ac",        label: "Has AC (0 / 1)",                     type: "number" },
      ]}
    />
  );
}

export default CreateRoom;