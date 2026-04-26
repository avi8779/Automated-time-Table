import CrudForm from "../../Components/CrudForm";
import { teacherSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = teacherSlice.actions;

const validateTeacher = (form) => {
  const daily  = Number(form.max_hours_per_day);
  const weekly = Number(form.max_hours_per_week);
  if (!form.teacher_code || !form.name || !form.email || !form.depart_id) {
    return "All fields are required.";
  }
  if (daily < 1 || daily > 6)   return "Max hours per day must be between 1 and 6.";
  if (weekly < 1 || weekly > 30) return "Max hours per week must be between 1 and 30.";
  if (daily > weekly)            return "Max hours per day cannot exceed max hours per week.";
  return null;
};

const transformTeacher = (form) => ({
  ...form,
  depart_id:          Number(form.depart_id),
  max_hours_per_day:  Number(form.max_hours_per_day),
  max_hours_per_week: Number(form.max_hours_per_week),
});

function CreateTeacher() {
  return (
    <CrudForm
      title="Teachers"
      description="Manage teaching staff"
      sliceKey="teacher"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      uploadKey="teachers"
      filterConfig={[
        { key: "status", label: "Status", options: [{value:"ACTIVE",label:"Active"},{value:"INACTIVE",label:"Inactive"}] },
      ]}
      idKey="teacher_id"
      validate={validateTeacher}
      transform={transformTeacher}
      columns={[
        { header: "Code",           accessor: "teacher_code"       },
        { header: "Name",           accessor: "name"               },
        { header: "Email",          accessor: "email"              },
        { header: "Department",     accessor: "department_name"    },
        { header: "Max Hrs/Day",    accessor: "max_hours_per_day"  },
        { header: "Max Hrs/Week",   accessor: "max_hours_per_week" },
      ]}
      fields={[
        { name: "teacher_code",       label: "Teacher Code (e.g. TCH001)" },
        { name: "name",               label: "Full Name" },
        { name: "email",              label: "Email",               type: "email" },
        {
          name: "depart_id",
          label: "Department",
          type: "select",
          apiEndpoint: "departments",
          valueKey: "depart_id",
          labelKey: "name",
        },
        { name: "max_hours_per_day",  label: "Max Hours Per Day (1–6)",    type: "number" },
        { name: "max_hours_per_week", label: "Max Hours Per Week (1–30)",  type: "number" },
      ]}
    />
  );
}

export default CreateTeacher;