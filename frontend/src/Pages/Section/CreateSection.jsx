import CrudForm from "../../Components/CrudForm";
import { sectionSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = sectionSlice.actions;

const validateSection = (form) => {
  if (
    !form.section_name ||
    !form.course_id ||
    !form.semester ||
    !form.strength ||
    !form.batch_year ||
    !form.status
  ) {
    return "All fields are required.";
  }
  return null;
};

const transformSection = (form) => ({
  ...form,
  course_id:  Number(form.course_id),
  semester:   Number(form.semester),
  strength:   Number(form.strength),
  batch_year: Number(form.batch_year),
});

function CreateSection() {
  return (
    <CrudForm
      title="Sections"
      description="Manage sections"
      sliceKey="section"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="section_id"
      validate={validateSection}
      transform={transformSection}
      columns={[
        { header: "Name",       accessor: "section_name" },
        { header: "Course ID",  accessor: "course_id" },
        { header: "Semester",   accessor: "semester" },
        { header: "Strength",   accessor: "strength" },
        { header: "Batch Year", accessor: "batch_year" },
        { header: "Status",     accessor: "status" },
      ]}
      fields={[
        { name: "section_name", label: "Section Name" },
        { name: "course_id",    label: "Course ID",   type: "number" },
        { name: "semester",     label: "Semester",    type: "number" },
        { name: "strength",     label: "Strength",    type: "number" },
        { name: "batch_year",   label: "Batch Year",  type: "number" },
        { name: "status",       label: "Status (active / inactive)" },
      ]}
    />
  );
}

export default CreateSection;