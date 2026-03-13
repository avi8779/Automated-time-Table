import CrudForm from "../../Components/CrudForm";
import { timeSlotSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = timeSlotSlice.actions;

const validateTimeSlot = (form) => {
  if (!form.day || !form.start_time || !form.end_time || !form.slot_order) {
    return "All fields are required.";
  }
  if (form.start_time >= form.end_time) {
    return "Start time must be before end time.";
  }
  return null;
};

const transformTimeSlot = (form) => ({
  ...form,
  slot_order: Number(form.slot_order),
  is_break:   Number(form.is_break) || 0,
});

function CreateTimeSlot() {
  return (
    <CrudForm
      title="Time Slots"
      description="Manage time slots"
      sliceKey="timeSlot"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="slot_id"
      validate={validateTimeSlot}
      transform={transformTimeSlot}
      columns={[
        { header: "Day",        accessor: "day" },
        { header: "Start Time", accessor: "start_time" },
        { header: "End Time",   accessor: "end_time" },
        { header: "Order",      accessor: "slot_order" },
        { header: "Is Break",   accessor: "is_break" },
      ]}
      fields={[
        { name: "day",        label: "Day (e.g. Monday)" },
        { name: "start_time", label: "Start Time (HH:MM)", type: "time" },
        { name: "end_time",   label: "End Time (HH:MM)",   type: "time" },
        { name: "slot_order", label: "Slot Order",         type: "number" },
        { name: "is_break",   label: "Is Break (0 / 1)",   type: "number" },
      ]}
    />
  );
}

export default CreateTimeSlot;