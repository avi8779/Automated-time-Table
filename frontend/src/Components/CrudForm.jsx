import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../Helper/axiosInstance";
import { toast } from "react-toastify";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

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
  validate,
  transform,
  normalize,   // optional: normalize item values before populating edit form
  uploadKey,
  filterConfig = [], // [{ key: "semester", label: "Semester", options: [{value,label}] }]
                     // or { key, label, apiEndpoint, valueKey, labelKey } for dynamic
}) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state[sliceKey]);

  const [search,      setSearch]      = useState("");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [form,        setForm]        = useState({});
  const [formError,   setFormError]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({});

  // ── Filters ──
  const [activeFilters, setActiveFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  // ── Pagination ──
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Upload ──
  const [uploadFile,      setUploadFile]      = useState(null);
  const [uploading,       setUploading]       = useState(false);
  const [uploadResult,    setUploadResult]    = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const fileRef = useRef();

  // Load data + dynamic options
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    dispatch(getAllAction());

    const fetchDynamic = async () => {
      const updates = {};

      // CrudForm field dropdowns
      for (const field of fields) {
        if (field.type === "select" && field.apiEndpoint) {
          try {
            const res = await axiosInstance.get(`/${field.apiEndpoint}`);
            const items = res.data?.data ?? res.data ?? [];
            updates[field.name] = items.map((item) => ({
              value: item[field.valueKey],
              label: item[field.labelKey] ?? item[field.valueKey],
            }));
          } catch {
            updates[field.name] = [];
          }
        }
      }

      // Filter dropdowns (dynamic)
      const fOpts = {};
      for (const fc of filterConfig) {
        if (fc.apiEndpoint) {
          try {
            const res = await axiosInstance.get(`/${fc.apiEndpoint}`);
            const items = res.data?.data ?? res.data ?? [];
            fOpts[fc.key] = items.map((item) => ({
              value: String(item[fc.valueKey]),
              label: item[fc.labelKey] ?? item[fc.valueKey],
            }));
          } catch {
            fOpts[fc.key] = [];
          }
        } else if (fc.options) {
          fOpts[fc.key] = fc.options;
        } else {
          // Auto-derive unique values from data
          fOpts[fc.key] = [];
        }
      }
      setFilterOptions(fOpts);

      if (Object.keys(updates).length) setDynamicOptions((prev) => ({ ...prev, ...updates }));
    };

    fetchDynamic();
  }, [dispatch]);

  // Auto-derive filter options from data when no explicit options given
  useEffect(() => {
    const derived = {};
    for (const fc of filterConfig) {
      if (!fc.options && !fc.apiEndpoint && data.length) {
        const unique = [...new Set(data.map((item) => item[fc.key]).filter(Boolean))].sort();
        derived[fc.key] = unique.map((v) => ({ value: String(v), label: fc.labelPrefix ? `${fc.labelPrefix} ${v}` : String(v) }));
      }
    }
    if (Object.keys(derived).length) {
      setFilterOptions((prev) => ({ ...prev, ...derived }));
    }
  }, [data]);

  // ── Filtered + searched + paginated data ──
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply filters
    for (const [key, val] of Object.entries(activeFilters)) {
      if (!val) continue;
      result = result.filter((item) => String(item[key]) === String(val));
    }

    // Apply search
    const q = search.toLowerCase();
    if (q) {
      result = result.filter((item) =>
        Object.values(item).join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [data, activeFilters, search]);

  // Reset to page 1 when filters/search change
  useEffect(() => { setPage(1); }, [activeFilters, search]);

  const totalPages  = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const setFilter = (key, val) => {
    setActiveFilters((prev) => ({ ...prev, [key]: val }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearch("");
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean) || search;

  // ── CRUD handlers ──
  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm({}); setFormError(null); setModalOpen(true);
  };

  const openEdit = (item) => {
    setIsEditing(true); setEditingId(item[idKey]);
    setForm(normalize ? normalize(item) : item);
    setFormError(null); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (validate) {
      const err = validate(form);
      if (err) { setFormError(err); return; }
    }
    const payload = transform ? transform(form) : form;
    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateAction({ id: editingId, data: payload }));
      } else {
        await dispatch(createAction(payload));
      }
      await dispatch(getAllAction());
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await dispatch(deleteAction(id));
    await dispatch(getAllAction());
  };

  // ── Upload handlers ──
  const handleFileChange = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) {
      toast.error("Only .xlsx, .xls or .csv files supported"); return;
    }
    setUploadFile(f); setUploadResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(`/bulk/template/${uploadKey}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `${uploadKey}_template.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded!");
    } catch { toast.error("Failed to download template"); }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    setUploading(true); setUploadResult(null);
    try {
      const res = await axiosInstance.post(`/bulk/${uploadKey}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
      if (res.data.inserted > 0) {
        toast.success(`${res.data.inserted} records inserted!`);
        dispatch(getAllAction());
      } else {
        toast.info("No new records — all duplicates skipped");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false); setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const renderField = (field) => {
    const cls = "app-input w-full px-3 py-2 rounded-xl text-sm";
    if (field.type === "select") {
      const opts = field.options ?? dynamicOptions[field.name] ?? [];
      const currentVal = form[field.name] ?? "";
      // If options loaded but current value not in list, still show it
      const valExists = opts.some((o) => String(o.value) === String(currentVal));
      return (
        <select
          name={field.name}
          value={currentVal}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
          required
          className={cls}
        >
          <option value="">— select —</option>
          {/* If editing and value not yet in loaded options, show placeholder */}
          {currentVal && !valExists && (
            <option value={currentVal}>Loading...</option>
          )}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={field.type || "text"}
        name={field.name}
        value={form[field.name] ?? ""}
        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        min={field.min ?? (field.type === "number" ? 0 : undefined)}
        max={field.max ?? undefined}
        required
        className={cls}
      />
    );
  };

  // ── Pagination controls ──
  const PaginationBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/80">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="app-input px-2 py-1 rounded"
        >
          {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>per page · {filteredData.length} total</span>
      </div>

      <div className="flex items-center gap-1">
        <PageBtn onClick={() => setPage(1)}         disabled={page === 1}          label="«" />
        <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1}       label="‹" />
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2 text-slate-600 text-xs">…</span>
          ) : (
            <PageBtn key={p} onClick={() => setPage(p)} active={page === p} label={String(p)} />
          )
        )}
        <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} label="›" />
        <PageBtn onClick={() => setPage(totalPages)}  disabled={page === totalPages}  label="»" />
      </div>
    </div>
  );

  return (
    <div className="app-page">
      <div className="app-container">

        {/* Header */}
        <div className="app-panel flex flex-wrap justify-between items-start gap-3 mb-6 rounded-3xl p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Management</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1 text-slate-600 text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {uploadKey && (
              <button
                onClick={() => { setShowUploadPanel((s) => !s); setUploadResult(null); setUploadFile(null); }}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                  showUploadPanel ? "bg-sky-50 text-sky-700 border-sky-200" : "app-secondary-btn"
                }`}
              >Bulk Upload</button>
            )}
            <button onClick={openCreate} className="app-primary-btn px-4 py-2 rounded-xl font-black transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Bulk Upload Panel */}
        {uploadKey && showUploadPanel && (
          <div className="app-card mb-6 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sky-700">Bulk Upload - {title}</h2>
              <button onClick={handleDownloadTemplate} className="app-secondary-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                Download Template
              </button>
            </div>
            <p className="text-xs text-slate-500">Download the template, fill in your data, then upload. Duplicates are skipped.</p>
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileChange(e.target.files[0])}
                className="block text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
              <button onClick={handleUpload} disabled={!uploadFile || uploading}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm disabled:opacity-40 transition-colors shrink-0">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadResult && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex gap-6">
                  <div className="text-center"><p className="text-xl font-bold text-emerald-400">{uploadResult.inserted}</p><p className="text-xs text-slate-500">Inserted</p></div>
                  <div className="text-center"><p className="text-xl font-bold text-amber-400">{uploadResult.skipped}</p><p className="text-xs text-slate-500">Skipped</p></div>
                  {uploadResult.errors?.length > 0 && <div className="text-center"><p className="text-xl font-bold text-red-400">{uploadResult.errors.length}</p><p className="text-xs text-slate-500">Errors</p></div>}
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResult.errors.map((e, i) => <p key={i} className="text-xs text-red-300 font-mono">{e}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Filter Bar ── */}
        {filterConfig.length > 0 && (
          <div className="app-card mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Filter</span>
            {filterConfig.map((fc) => (
              <div key={fc.key} className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">{fc.label}</label>
                <select
                  value={activeFilters[fc.key] || ""}
                  onChange={(e) => setFilter(fc.key, e.target.value)}
                  className="app-input px-3 py-1.5 rounded-xl text-xs min-w-[130px]"
                >
                  <option value="">All</option>
                  {(filterOptions[fc.key] || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="app-secondary-btn mt-4 px-3 py-1.5 rounded-lg text-xs transition-colors">
                Clear
              </button>
            )}
            {hasActiveFilters && (
              <span className="mt-4 text-xs text-slate-500">{filteredData.length} result{filteredData.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Search */}
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="app-input mb-4 px-4 py-2.5 rounded-2xl w-full max-w-md" />

        {error && (
          <div className="mb-4 px-4 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{error}</div>
        )}

        {/* Table */}
        <div className="app-panel rounded-2xl overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm animate-pulse">Loading...</div>
          ) : paginatedData.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
              {hasActiveFilters ? "No records match your filters." : "No records found. Click \"+ Add\" to create one."}
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 w-10">#</th>
                    {columns.map((col) => (
                      <th key={col.accessor} className="px-4 py-3 text-left">{col.header}</th>
                    ))}
                    {(updateAction || deleteAction) && (
                      <th className="px-4 py-3 text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, idx) => (
                    <tr key={item[idKey]} className="border-t border-slate-200 hover:bg-teal-50/35 transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs">{(page - 1) * pageSize + idx + 1}</td>
                      {columns.map((col) => (
                        <td key={col.accessor} className="px-4 py-3">
                          {item[col.accessor] !== null && item[col.accessor] !== undefined
                            ? String(item[col.accessor])
                            : <span className="text-slate-600">—</span>}
                        </td>
                      ))}
                      {(updateAction || deleteAction) && (
                        <td className="px-4 py-3 text-center space-x-2">
                          {updateAction && (
                            <button onClick={() => openEdit(item)} className="app-secondary-btn px-3 py-1 rounded-lg text-xs transition-colors">Edit</button>
                          )}
                          {deleteAction && (
                            <button onClick={() => handleDelete(item[idKey])} className="px-3 py-1 rounded-lg text-xs bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors">Delete</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationBar />
            </>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="app-panel p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">{isEditing ? `Edit ${title}` : `Add ${title}`}</h2>
              {formError && (
                <div className="mb-4 px-4 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{formError}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <div key={field.name} className={field.fullWidth ? "col-span-2" : ""}>
                      <label className="text-xs text-slate-400 block mb-1">{field.label}</label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="px-4 py-2 rounded text-sm text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="app-primary-btn disabled:opacity-50 font-black px-4 py-2 rounded-xl text-sm transition-colors">
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

// ── Helpers ──
function PageBtn({ onClick, disabled, label, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-teal-700 text-white"
          : disabled
          ? "text-slate-700 cursor-not-allowed"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total-4, total-3, total-2, total-1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default CrudForm;
