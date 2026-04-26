import { useState, useRef } from "react";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

const ENTITIES = [
  { key: "buildings",        label: "Buildings",              icon: "🏢", fields: "building_name, building_code" },
  { key: "rooms",            label: "Rooms",                  icon: "🚪", fields: "room_no, room_type, capacity, building_code" },
  { key: "courses",          label: "Courses",                icon: "📚", fields: "course_name, course_code, department_code, duration_years" },
  { key: "teachers",         label: "Teachers",               icon: "👨‍🏫", fields: "name, email, max_hours_per_day, max_hours_per_week, password, department_code"},
  { key: "subjects",         label: "Subjects",               icon: "📖", fields: "subject_name, subject_code, course_code, semester, weekly_hours, credits, is_lab, preferred_slot" },
  { key: "sections",         label: "Sections",               icon: "🗂",  fields: "section_name, course_code, semester, strength, batch_year, max_slots_per_day, status" },
  { key: "students",         label: "Students",               icon: "🎓", fields: "name, roll_number, section_name, password" },
  { key: "teacher_subjects", label: "Teacher–Subject Mapping",icon: "🔗", fields: "teacher_email, subject_code, priority" },
];

export default function BulkUpload() {
  const [selected,   setSelected]   = useState(null);
  const [file,       setFile]       = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileRef = useRef();

  const handleSelect = (entity) => {
    setSelected(entity);
    setFile(null);
    setResult(null);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) {
      toast.error("Only .xlsx, .xls or .csv files are supported");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(`/bulk/template/${selected.key}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement("a");
      a.href     = url;
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
      if (res.data.inserted > 0) toast.success(`${res.data.inserted} records inserted!`);
      else toast.info("No new records inserted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bulk Upload</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload Excel or CSV files to insert multiple records at once
          </p>
        </div>

        {/* Entity selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ENTITIES.map((e) => (
            <button
              key={e.key}
              onClick={() => handleSelect(e)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected?.key === e.key
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              <div className="text-2xl mb-2">{e.icon}</div>
              <div className="text-sm font-semibold">{e.label}</div>
            </button>
          ))}
        </div>

        {/* Upload area */}
        {selected && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">

            {/* Selected entity info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {selected.icon} {selected.label}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Required columns: <span className="text-slate-400 font-mono">{selected.fields}</span>
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                ⬇️ Download Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-emerald-500 bg-emerald-500/5"
                  : file
                  ? "border-emerald-600 bg-emerald-900/10"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="space-y-1">
                  <div className="text-3xl">📄</div>
                  <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📂</div>
                  <p className="text-sm text-slate-400">
                    Drag & drop your Excel file here, or <span className="text-emerald-400 font-semibold">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-600">.xlsx, .xls, .csv supported</p>
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors disabled:opacity-40"
            >
              {uploading ? "Uploading & Processing…" : `Upload ${selected.label}`}
            </button>

            {/* Result */}
            {result && (
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Upload Result</h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{result.inserted}</p>
                    <p className="text-xs text-slate-500">Inserted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">{result.skipped}</p>
                    <p className="text-xs text-slate-500">Skipped</p>
                  </div>
                  {result.errors?.length > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{result.errors.length}</p>
                      <p className="text-xs text-slate-500">Errors</p>
                    </div>
                  )}
                </div>

                {result.errors?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-red-400 mb-1">Row Errors:</p>
                    <div className="bg-slate-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-300 font-mono">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!selected && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">How it works</h2>
            <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
              <li>Select the entity type you want to bulk upload above</li>
              <li>Click <span className="text-emerald-400 font-semibold">Download Template</span> to get the correct Excel format</li>
              <li>Fill in your data in the template — do not change the column headers</li>
              <li>Upload the filled Excel file — duplicates are automatically skipped</li>
              <li>Review the result — inserted count, skipped count, and any row errors</li>
            </ol>
            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/40 rounded-lg">
              <p className="text-xs text-amber-300">
                💡 <strong>Tip:</strong> Upload in order — Buildings → Rooms → Courses → Teachers → Subjects → Sections → Students → Teacher-Subject Mapping
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}