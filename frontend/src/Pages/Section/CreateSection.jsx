import CrudForm from "../../Components/CrudForm";
import { sectionSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = sectionSlice.actions;

const SEMESTER_OPTIONS = [1,2,3,4,5,6,7,8].map((n) => ({ value: n, label: `Semester ${n}` }));
const STATUS_OPTIONS   = [
  { value: "ACTIVE",   label: "Active"   },
  { value: "INACTIVE", label: "Inactive" },
];

const validateSection = (form) => {
  if (!form.section_name || !form.course_id || !form.semester ||
      !form.strength || !form.batch_year || !form.status) {
    return "All fields are required.";
  }
  const strength = Number(form.strength);
  if (isNaN(strength) || strength < 1 || strength > 500)
    return "Strength must be between 1 and 500.";
  const year = Number(form.batch_year);
  if (isNaN(year) || year < 2000 || year > 2100)
    return "Batch year must be between 2000 and 2100.";
  const slots = Number(form.max_slots_per_day);
  if (slots < 1 || slots > 10) return "Max slots per day must be between 1 and 10.";
  return null;
};

const transformSection = (form) => ({
  ...form,
  course_id:        Number(form.course_id),
  semester:         Number(form.semester),
  strength:         Number(form.strength),
  batch_year:       Number(form.batch_year),
  max_slots_per_day: Number(form.max_slots_per_day) || 6,
});

// Ensure course_id in form matches string values used by select options
const normalizeSection = (item) => ({
  ...item,
  course_id:         String(item.course_id ?? ""),
  semester:          String(item.semester ?? ""),
  max_slots_per_day: item.max_slots_per_day ?? 6,
});

function CreateSection() {
  return (
    <CrudForm
      title="Sections"
      description="Manage class sections — set max slots per day to control how many classes per day"
      sliceKey="section"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      uploadKey="sections"
      filterConfig={[
        { key: "semester", label: "Semester", labelPrefix: "Sem" },
        { key: "status",   label: "Status",   options: [{value:"ACTIVE",label:"Active"},{value:"INACTIVE",label:"Inactive"}] },
      ]}
      idKey="section_id"
      normalize={normalizeSection}
      validate={validateSection}
      transform={transformSection}
      columns={[
        { header: "Name",            accessor: "section_name"      },
        { header: "Course",          accessor: "course_name"       },
        { header: "Semester",        accessor: "semester"          },
        { header: "Slots/Day",       accessor: "max_slots_per_day" },
        { header: "Strength",        accessor: "strength"          },
        { header: "Batch Year",      accessor: "batch_year"        },
        { header: "Status",          accessor: "status"            },
      ]}
      fields={[
        { name: "section_name", label: "Section Name (e.g. CSE-A)" },
        {
          name: "course_id",
          label: "Course",
          type: "select",
          apiEndpoint: "courses",
          valueKey: "course_id",
          labelKey: "course_name",
        },
        {
          name: "semester",
          label: "Semester",
          type: "select",
          options: SEMESTER_OPTIONS,
        },
        {
          name: "max_slots_per_day",
          label: "Max Slots Per Day (1–10)",
          type: "number",
          // Examples shown in placeholder via label:
          // 4 = UG half day, 6-7 = PG full day
        },
        { name: "strength",   label: "Strength (No. of Students)", type: "number", min: 1, max: 500 },
        { name: "batch_year", label: "Batch Year (e.g. 2024)",     type: "number", min: 2000, max: 2100 },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: STATUS_OPTIONS,
        },
      ]}
    />
  );
}

export default CreateSection;