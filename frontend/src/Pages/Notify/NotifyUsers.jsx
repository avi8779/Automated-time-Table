import { useEffect, useState } from "react";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

const TEMP_PASSWORD = "Welcome@123";

export default function NotifyUsers() {
  const [teachers,    setTeachers]    = useState([]);
  const [students,    setStudents]    = useState([]);
  const [selected,    setSelected]    = useState({});   // { id_role: true }
  const [tab,         setTab]         = useState("teachers");
  const [sending,     setSending]     = useState(false);
  const [results,     setResults]     = useState(null);
  const [resetting,   setResetting]   = useState(null); // id_role being reset
  const [customPass,  setCustomPass]  = useState({});   // { id_role: "newpass" }
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    axiosInstance.get("/notify/recipients")
      .then((r) => {
        setTeachers(r.data.data.teachers || []);
        setStudents(r.data.data.students || []);
      })
      .catch(() => toast.error("Failed to load recipients"))
      .finally(() => setLoading(false));
  }, []);

  const key = (item) => `${item.id}_${item.role}`;

  const toggleSelect = (item) => {
    setSelected((prev) => ({ ...prev, [key(item)]: !prev[key(item)] }));
  };

  const selectAll = (list) => {
    const upd = {};
    list.forEach((i) => { upd[key(i)] = true; });
    setSelected((prev) => ({ ...prev, ...upd }));
  };

  const deselectAll = (list) => {
    const upd = {};
    list.forEach((i) => { upd[key(i)] = false; });
    setSelected((prev) => ({ ...prev, ...upd }));
  };

  const currentList = tab === "teachers" ? teachers : students;
  const selectedCount = currentList.filter((i) => selected[key(i)]).length;

  const handleSend = async () => {
    const recipients = currentList
      .filter((i) => selected[key(i)])
      .map((i) => ({
        id:          i.id,
        role:        i.role,
        name:        i.name,
        email:       i.email,
        identifier:  i.role === "teacher" ? i.email : i.roll_number,
        tempPassword: customPass[key(i)] || TEMP_PASSWORD,
      }));

    if (!recipients.length) { toast.error("Select at least one recipient"); return; }
    const noEmail = recipients.filter((r) => !r.email);
    if (noEmail.length) {
      toast.error(`${noEmail.length} selected have no email address`); return;
    }

    setSending(true); setResults(null);
    try {
      const res = await axiosInstance.post("/notify/send", { recipients });
      setResults(res.data);
      toast.success(`${res.data.sent} email(s) sent!`);
      setSelected({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (item) => {
    const pass = customPass[key(item)] || TEMP_PASSWORD;
    if (!window.confirm(`Reset password for ${item.name} to "${pass}"?`)) return;
    setResetting(key(item));
    try {
      await axiosInstance.post("/notify/reset-password", {
        id: item.id, role: item.role, newPassword: pass,
      });
      toast.success(`Password reset for ${item.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">📧 Notify Users</h1>
          <p className="text-slate-400 text-sm mt-1">
            Send login credentials to teachers and students via email
          </p>
        </div>

        {/* Default password notice */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">Default temporary password: <code className="font-mono bg-amber-900/40 px-2 py-0.5 rounded">{TEMP_PASSWORD}</code></p>
            <p className="text-xs text-amber-400/70 mt-1">Users will be forced to change this on first login. You can set a custom password per user below.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          {["teachers","students"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t} ({(t === "teachers" ? teachers : students).length})
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button onClick={() => selectAll(currentList)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">Select All</button>
            <button onClick={() => deselectAll(currentList)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">Deselect All</button>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || selectedCount === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm disabled:opacity-40 transition-colors"
          >
            {sending ? "Sending…" : `📤 Send to ${selectedCount} selected`}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-emerald-400">✅ {results.sent} email(s) sent successfully</p>
            {results.failed?.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-semibold mb-1">❌ Failed ({results.failed.length}):</p>
                {results.failed.map((f, i) => (
                  <p key={i} className="text-xs text-red-300">{f.name}: {f.reason}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 animate-pulse">Loading…</div>
        ) : currentList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No {tab} found.</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">{tab === "teachers" ? "Email" : "Roll No."}</th>
                  {tab === "students" && <th className="px-4 py-3 text-left">Section</th>}
                  <th className="px-4 py-3 text-left">Custom Password</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((item) => (
                  <tr key={key(item)} className={`border-t border-slate-800 transition-colors ${selected[key(item)] ? "bg-emerald-900/10" : "hover:bg-slate-800/30"}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={!!selected[key(item)]} onChange={() => toggleSelect(item)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {tab === "teachers" ? (item.email || <span className="text-red-400 italic">No email</span>) : item.roll_number}
                    </td>
                    {tab === "students" && <td className="px-4 py-3 text-slate-400 text-xs">{item.section_name || "—"}</td>}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder={TEMP_PASSWORD}
                        value={customPass[key(item)] || ""}
                        onChange={(e) => setCustomPass((p) => ({ ...p, [key(item)]: e.target.value }))}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 w-32 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => { toggleSelect(item); handleSend(); }}
                        className="px-2 py-1 rounded text-xs bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors"
                        title="Send email to this person"
                      >
                        📧 Send
                      </button>
                      <button
                        onClick={() => handleReset(item)}
                        disabled={resetting === key(item)}
                        className="px-2 py-1 rounded text-xs bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition-colors disabled:opacity-40"
                        title="Reset password in DB"
                      >
                        🔑 Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}