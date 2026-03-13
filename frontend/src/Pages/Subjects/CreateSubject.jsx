import CrudForm from "../../Components/CrudForm";
import { subjectSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = subjectSlice.actions;

// DB: subject_id, subject_code, subject_name, course_id, semester,
//     weekly_hours, credits, is_lab, preferred_slot, status

const validateSubject = (form) => {
  if (!form.subject_code || !form.subject_name || !form.course_id || !form.semester || !form.weekly_hours || !form.credits) {
    return "All required fields must be filled.";
  }
  const hours = Number(form.weekly_hours);
  if (hours < 1 || hours > 10) {
    return "Weekly hours must be between 1 and 10.";
  }
  if (form.preferred_slot && !["ANY", "MORNING", "AFTERNOON"].includes(form.preferred_slot.toUpperCase())) {
    return "Preferred slot must be ANY, MORNING or AFTERNOON.";
  }
  return null;
};

const transformSubject = (form) => ({
  ...form,
  course_id:      Number(form.course_id),
  semester:       Number(form.semester),
  weekly_hours:   Number(form.weekly_hours),
  credits:        Number(form.credits),
  is_lab:         Number(form.is_lab) || 0,
  preferred_slot: form.preferred_slot?.toUpperCase() || "ANY",
  status:         form.status?.toUpperCase() || "ACTIVE",
});

function CreateSubject() {
  return (
    <CrudForm
      title="Subjects"
      description="Manage subjects"
      sliceKey="subject"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="subject_id"
      validate={validateSubject}
      transform={transformSubject}
      columns={[
        { header: "Code",           accessor: "subject_code" },
        { header: "Name",           accessor: "subject_name" },
        { header: "Course",         accessor: "course_name" },
        { header: "Semester",       accessor: "semester" },
        { header: "Weekly Hrs",     accessor: "weekly_hours" },
        { header: "Credits",        accessor: "credits" },
        { header: "Is Lab",         accessor: "is_lab" },
        { header: "Status",         accessor: "status" },
      ]}
      fields={[
        { name: "subject_code",   label: "Code" },
        { name: "subject_name",   label: "Name" },
        { name: "course_id",      label: "Course ID",                              type: "number" },
        { name: "semester",       label: "Semester",                               type: "number" },
        { name: "weekly_hours",   label: "Weekly Hours",                           type: "number" },
        { name: "credits",        label: "Credits",                                type: "number" },
        { name: "is_lab",         label: "Is Lab (0 / 1)",                         type: "number" },
        { name: "preferred_slot", label: "Preferred Slot (ANY / MORNING / AFTERNOON)" },
        { name: "status",         label: "Status (ACTIVE / INACTIVE)" },
      ]}
    />
  );
}

export default CreateSubject;