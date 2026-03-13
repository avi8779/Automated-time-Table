import CrudForm from "../../Components/CrudForm";
import { courseSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = courseSlice.actions;

const validateCourse = (form) => {
  if (!form.course_code || !form.course_name || !form.depart_id || !form.duration_years) {
    return "All fields are required.";
  }
  if (Number(form.duration_years) < 1) {
    return "Duration must be at least 1 year.";
  }
  return null;
};

const transformCourse = (form) => ({
  ...form,
  depart_id:      Number(form.depart_id),
  duration_years: Number(form.duration_years),
});

function CreateCourse() {
  return (
    <CrudForm
      title="Courses"
      description="Manage courses"
      sliceKey="course"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="course_id"
      validate={validateCourse}
      transform={transformCourse}
      columns={[
        { header: "Code",           accessor: "course_code" },
        { header: "Name",           accessor: "course_name" },
        { header: "Department ID",  accessor: "depart_id" },
        { header: "Duration (Yrs)", accessor: "duration_years" },
      ]}
      fields={[
        { name: "course_code",    label: "Code" },
        { name: "course_name",    label: "Name" },
        { name: "depart_id",      label: "Department ID",    type: "number" },
        { name: "duration_years", label: "Duration (Years)", type: "number" },
      ]}
    />
  );
}

export default CreateCourse;