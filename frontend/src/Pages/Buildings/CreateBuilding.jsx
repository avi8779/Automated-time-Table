import CrudForm from "../../Components/CrudForm";
import { buildingSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = buildingSlice.actions;

const validateBuilding = (form) => {
  if (!form.building_code || !form.building_name || !form.floors || !form.status) {
    return "All fields are required.";
  }
  if (Number(form.floors) < 1) {
    return "Floors must be at least 1.";
  }
  if (!["ACTIVE", "INACTIVE"].includes(form.status.toUpperCase())) {
    return "Status must be ACTIVE or INACTIVE.";
  }
  return null;
};

const transformBuilding = (form) => ({
  ...form,
  floors: Number(form.floors),
  status: form.status.toUpperCase(),
});

function CreateBuilding() {
  return (
    <CrudForm
      title="Buildings"
      description="Manage buildings"
      sliceKey="building"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}   // ✅ now supported
      deleteAction={deleteItem}   // ✅ now supported
      idKey="building_id"
      validate={validateBuilding}
      transform={transformBuilding}
      columns={[
        { header: "Code",   accessor: "building_code" },
        { header: "Name",   accessor: "building_name" },
        { header: "Floors", accessor: "floors" },
        { header: "Status", accessor: "status" },
      ]}
      fields={[
        { name: "building_code", label: "Code" },
        { name: "building_name", label: "Name" },
        { name: "floors",        label: "Floors",                    type: "number" },
        { name: "status",        label: "Status (ACTIVE / INACTIVE)" },
      ]}
    />
  );
}

export default CreateBuilding;