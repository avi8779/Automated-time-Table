import { useRef, useState } from "react";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

const ENTITIES = [
  { key: "buildings", label: "Buildings", icon: "BD", fields: "building_name, building_code, floors" },
  { key: "rooms", label: "Rooms", icon: "RM", fields: "room_no, room_type, capacity, building_code" },
  { key: "courses", label: "Courses", icon: "CR", fields: "course_name, course_code, department_code, duration_years" },
  { key: "teachers", label: "Teachers", icon: "TC", fields: "name, email, max_hours_per_day, max_hours_per_week, department_code" },
  { key: "subjects", label: "Subjects", icon: "SB", fields: "subject_name, subject_code, course_code, semester, weekly_hours, credits, is_lab, preferred_slot" },
  { key: "sections", label: "Sections", icon: "SC", fields: "section_name, course_code, semester, strength, batch_year, max_slots_per_day, status" },
  { key: "students", label: "Students", icon: "ST", fields: "name, roll_number, section_name, password" },
  { key: "teacher_subjects", label: "Teacher-Subject Mapping", icon: "TS", fields: "teacher_email, subject_code, priority" },
];

export default function BulkUpload() {
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleSelect = (entity) => {
    setSelected(entity);
    setFile(null);
    setResult(null);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Only .xlsx, .xls or .csv files are supported");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(`/bulk/template/${selected.key}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.key}_template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file || !selected) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setResult(null);
    try {
      const res = await axiosInstance.post(`/bulk/${selected.key}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} row error(s). Check upload result.`);
      else if (res.data.inserted > 0) toast.success(`${res.data.inserted} records inserted!`);
      else toast.info("No new records inserted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Data operations</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Bulk Upload</h1>
          <p className="mt-1 text-sm text-slate-600">Upload Excel or CSV files to insert multiple records at once.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ENTITIES.map((entity) => (
            <button
              key={entity.key}
              onClick={() => handleSelect(entity)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected?.key === entity.key
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:border-teal-200 hover:text-slate-900"
              }`}
            >
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black">
                {entity.icon}
              </span>
              <span className="block text-sm font-semibold">{entity.label}</span>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="app-panel rounded-2xl p-6 space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-base font-bold text-slate-950">{selected.label}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Required columns: <span className="font-mono text-slate-700">{selected.fields}</span>
                  <span className="block">Downloaded templates include valid code references below the upload rows.</span>
                </p>
              </div>
              <button onClick={handleDownloadTemplate} className="app-secondary-btn rounded-xl px-3 py-2 text-xs font-bold">
                Download Template
              </button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver || file ? "border-teal-600 bg-teal-50" : "border-slate-300 bg-white/60 hover:border-teal-300"
              }`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-teal-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB - Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">
                    Drag and drop your Excel file here, or <span className="font-semibold text-teal-700">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">.xlsx, .xls, .csv supported</p>
                </div>
              )}
            </div>

            <button onClick={handleUpload} disabled={!file || uploading} className="app-primary-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-40">
              {uploading ? "Uploading and processing..." : `Upload ${selected.label}`}
            </button>

            {result && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Upload Result</h3>
                <div className="flex gap-5">
                  <Metric label="Inserted" value={result.inserted} tone="text-teal-700" />
                  <Metric label="Skipped" value={result.skipped} tone="text-amber-600" />
                  {result.errors?.length > 0 && <Metric label="Errors" value={result.errors.length} tone="text-rose-600" />}
                </div>
                {result.errors?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="font-mono text-xs text-rose-600">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="app-panel rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-bold text-slate-800">How it works</h2>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
              <li>Select the entity type you want to bulk upload above.</li>
              <li>Download the template to get the correct Excel format.</li>
              <li>Fill in your data without changing column headers.</li>
              <li>Upload the filled file and review inserted, skipped, and row-level errors.</li>
            </ol>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Tip:</strong> Upload in order: Buildings, Rooms, Courses, Teachers, Subjects, Sections, Students, then Teacher-Subject Mapping.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
