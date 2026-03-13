import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function CrudForm({
  title,
  description,
  sliceKey,
  columns = [],
  fields = [],
  getAllAction,
  createAction,
  updateAction,
  deleteAction,
  idKey = "_id",
  validate,     // optional: (formData) => "error string" | null
  transform,    // optional: (formData) => transformedData
  // Pass updateAction/deleteAction as null to hide those buttons if backend doesn't support them
}) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state[sliceKey]);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getAllAction());
  }, [dispatch]);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      Object.values(item).join(" ").toLowerCase().includes(q)
    );
  }, [search, data]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({});
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setIsEditing(true);
    setEditingId(item[idKey]);
    setForm(item);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // 1️⃣ Validate
    if (validate) {
      const validationError = validate(form);
      if (validationError) {
        setFormError(validationError);
        return;
      }
    }

    // 2️⃣ Transform (cast types etc.)
    const payload = transform ? transform(form) : form;

    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateAction({ id: editingId, data: payload }));
      } else {
        await dispatch(createAction(payload));
      }
      // ✅ Always refetch — works even when backend returns only an ID, not the full item
      await dispatch(getAllAction());
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await dispatch(deleteAction(id));
    // ✅ Always refetch after delete too
    await dispatch(getAllAction());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 px-3 py-2 rounded bg-slate-900 border border-slate-800 w-96 focus:outline-none focus:border-emerald-500"
        />

        {/* Global redux error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              Loading...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
              No records found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  {columns.map((col) => (
                    <th key={col.accessor} className="px-4 py-3 text-left">
                      {col.header}
                    </th>
                  ))}
                  {/* ✅ Only show Actions column if at least one action exists */}
                  {(updateAction || deleteAction) && (
                    <th className="px-4 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr
                    key={item[idKey]}
                    className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.accessor} className="px-4 py-3">
                        {item[col.accessor]}
                      </td>
                    ))}
                    {(updateAction || deleteAction) && (
                      <td className="px-4 py-3 text-center space-x-2">
                        {updateAction && (
                          <button
                            onClick={() => openEdit(item)}
                            className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {deleteAction && (
                          <button
                            onClick={() => handleDelete(item[idKey])}
                            className="px-3 py-1 rounded text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-950 p-6 rounded-lg w-full max-w-2xl border border-slate-800 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">
                {isEditing ? `Edit ${title}` : `Add ${title}`}
              </h2>

              {/* Form validation error */}
              {formError && (
                <div className="mb-4 px-4 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label className="text-xs text-slate-400 block mb-1">
                        {field.label}
                      </label>
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={form[field.name] ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, [field.name]: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:outline-none focus:border-emerald-500 text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-4 py-2 rounded text-sm transition-colors"
                  >
                    {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CrudForm;