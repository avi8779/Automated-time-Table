import CrudForm from "../../Components/CrudForm";
import { teacherSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = teacherSlice.actions;

// ✅ Cast number fields before sending to API (HTML inputs always return strings)
const transformTeacher = (form) => ({
  ...form,
  depart_id:          Number(form.depart_id),
  max_hours_per_day:  Number(form.max_hours_per_day),
  max_hours_per_week: Number(form.max_hours_per_week),
});

// ✅ Frontend validation matching backend rules
const validateTeacher = (form) => {
  const daily  = Number(form.max_hours_per_day);
  const weekly = Number(form.max_hours_per_week);

  if (!form.teacher_code || !form.name || !form.email || !form.depart_id) {
    return "All fields are required.";
  }
  if (daily < 1 || daily > 6) {
    return "Max hours per day must be between 1 and 6.";
  }
  if (weekly < 1 || weekly > 30) {
    return "Max hours per week must be between 1 and 30.";
  }
  if (daily > weekly) {
    return "Max hours per day cannot be greater than max hours per week.";
  }
  return null;
};

function CreateTeacher() {
  return (
    <CrudForm
      title="Teachers"
      description="Manage teachers"
      sliceKey="teacher"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="teacher_id"
      validate={validateTeacher}
      transform={transformTeacher}
      columns={[
        { header: "Code",           accessor: "teacher_code" },
        { header: "Name",           accessor: "name" },
        { header: "Email",          accessor: "email" },
        { header: "Department ID",  accessor: "depart_id" },
        { header: "Max Hours/Day",  accessor: "max_hours_per_day" },
        { header: "Max Hours/Week", accessor: "max_hours_per_week" },
      ]}
      fields={[
        { name: "teacher_code",       label: "Code" },
        { name: "name",               label: "Name" },
        { name: "email",              label: "Email",              type: "email"  },
        { name: "depart_id",          label: "Department ID",      type: "number" },
        { name: "max_hours_per_day",  label: "Max Hours Per Day",  type: "number" },
        { name: "max_hours_per_week", label: "Max Hours Per Week", type: "number" },
      ]}
    />
  );
}

export default CreateTeacher;