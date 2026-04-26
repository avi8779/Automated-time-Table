import CrudForm from "../../Components/CrudForm";
import { departmentSlice } from "../../Redux/store";

const { getAll, createItem, updateItem, deleteItem } = departmentSlice.actions;

const validateDepartment = (form) => {
  if (!form.department_code || !form.name) {
    return "All fields are required.";
  }
  return null;
};

function CreateDepartment() {
  return (
    <CrudForm
      title="Departments"
      description="Manage departments"
      sliceKey="department"
      getAllAction={getAll}
      createAction={createItem}
      updateAction={updateItem}
      deleteAction={deleteItem}
      idKey="depart_id"
      validate={validateDepartment}
      columns={[
        { header: "Code", accessor: "department_code" },
        { header: "Name", accessor: "name" },
      ]}
      fields={[
        { name: "department_code", label: "Code" },
        { name: "name",            label: "Name" },
      ]}
    />
  );
}

export default CreateDepartment;