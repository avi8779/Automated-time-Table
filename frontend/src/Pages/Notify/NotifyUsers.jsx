import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../Helper/axiosInstance";
import { toast } from "react-toastify";

const TEMP_PASSWORD = "Welcome@123";

export default function NotifyUsers() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({});
  const [tab, setTab] = useState("teachers");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [customPass, setCustomPass] = useState({});
  const [loading, setLoading] = useState(true);

  const loadRecipients = () => {
    setLoading(true);
    axiosInstance.get("/notify/recipients")
      .then((r) => {
        setTeachers(r.data.data.teachers || []);
        setStudents(r.data.data.students || []);
      })
      .catch(() => toast.error("Failed to load recipients"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecipients(); }, []);

  const key = (item) => `${item.id}_${item.role}`;
  const currentList = tab === "teachers" ? teachers : students;

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((item) =>
      [item.name, item.email, item.roll_number, item.section_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [currentList, query]);

  const selectedRows = currentList.filter((item) => selected[key(item)]);
  const selectedCount = selectedRows.length;

  const buildRecipient = (item) => ({
    id: item.id,
    role: item.role,
    name: item.name,
    email: item.email,
    identifier: item.role === "teacher" ? item.email : item.roll_number,
    tempPassword: customPass[key(item)] || TEMP_PASSWORD,
  });

  const toggleSelect = (item) => {
    setSelected((prev) => ({ ...prev, [key(item)]: !prev[key(item)] }));
  };

  const selectVisible = () => {
    const update = {};
    filteredList.forEach((item) => { update[key(item)] = true; });
    setSelected((prev) => ({ ...prev, ...update }));
  };

  const clearVisible = () => {
    const update = {};
    filteredList.forEach((item) => { update[key(item)] = false; });
    setSelected((prev) => ({ ...prev, ...update }));
  };

  const sendRecipients = async (recipients) => {
    if (!recipients.length) {
      toast.error("Select at least one recipient");
      return;
    }

    const noEmail = recipients.filter((r) => !r.email);
    if (noEmail.length) {
      toast.error(`${noEmail.length} selected user(s) have no email address`);
      return;
    }

    const weakPassword = recipients.find((r) => !r.tempPassword || r.tempPassword.length < 6);
    if (weakPassword) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!window.confirm(`Reset password and send login email to ${recipients.length} user(s)?`)) return;

    setSending(true);
    setResults(null);
    try {
      const res = await axiosInstance.post("/notify/send", { recipients });
      setResults(res.data);
      if (res.data.sent) toast.success(`${res.data.sent} email(s) sent`);
      if (res.data.failed?.length) toast.warning(`${res.data.failed.length} email(s) failed`);
      setSelected({});
      loadRecipients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  const handleSendSelected = () => {
    sendRecipients(selectedRows.map(buildRecipient));
  };

  const handleSendOne = (item) => {
    sendRecipients([buildRecipient(item)]);
  };

  const handleReset = async (item) => {
    const pass = customPass[key(item)] || TEMP_PASSWORD;
    if (pass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!window.confirm(`Reset password for ${item.name}?`)) return;

    setResetting(key(item));
    try {
      await axiosInstance.post("/notify/reset-password", {
        id: item.id,
        role: item.role,
        newPassword: pass,
      });
      toast.success(`Password reset for ${item.name}`);
      loadRecipients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Notify Users</h1>
            <p className="text-slate-600 text-sm mt-1">
              Manually reset passwords and email login credentials to teachers or students.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[360px]">
            <Summary label="Teachers" value={teachers.length} />
            <Summary label="Students" value={students.length} />
            <Summary label="Selected" value={selectedCount} accent />
          </div>
        </div>

        <div className="app-panel rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Manual sending only</p>
            <p className="text-xs text-slate-500 mt-1">
              Creating a teacher or student will not send email automatically. This page saves the password first, then sends the email.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Default password:
            <code className="ml-2 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-teal-700">{TEMP_PASSWORD}</code>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            {["teachers", "students"].map((value) => (
              <button
                key={value}
                onClick={() => { setTab(value); setQuery(""); setResults(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  tab === value
                    ? "bg-teal-700 text-white"
                    : "bg-white/80 text-slate-500 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="app-input px-3 py-2 rounded-lg text-sm w-64"
            />
            <button onClick={selectVisible} className="app-secondary-btn px-3 py-2 rounded-lg text-xs">
              Select visible
            </button>
            <button onClick={clearVisible} className="app-secondary-btn px-3 py-2 rounded-lg text-xs">
              Clear visible
            </button>
            <button
              onClick={handleSendSelected}
              disabled={sending || selectedCount === 0}
              className="app-primary-btn px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40"
            >
              {sending ? "Sending..." : `Reset and send ${selectedCount}`}
            </button>
          </div>
        </div>

        {results && (
          <div className="app-panel rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-emerald-400">{results.sent} email(s) sent successfully</p>
            {results.failed?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-rose-400 font-semibold">Failed ({results.failed.length})</p>
                {results.failed.map((f, i) => (
                  <p key={i} className="text-xs text-rose-300">{f.name}: {f.reason}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 animate-pulse">Loading...</div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No {tab} found.</div>
        ) : (
          <div className="app-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Login ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  {tab === "students" && <th className="px-4 py-3 text-left">Section</th>}
                  <th className="px-4 py-3 text-left">Password to send</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => (
                  <tr key={key(item)} className={`border-t border-slate-200 ${selected[key(item)] ? "bg-teal-50" : "hover:bg-teal-50/35"}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selected[key(item)]}
                        onChange={() => toggleSelect(item)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {item.role === "teacher" ? item.email : item.roll_number}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {item.email || <span className="text-rose-400 italic">No email</span>}
                    </td>
                    {tab === "students" && <td className="px-4 py-3 text-slate-400 text-xs">{item.section_name || "-"}</td>}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder={TEMP_PASSWORD}
                        value={customPass[key(item)] || ""}
                        onChange={(e) => setCustomPass((p) => ({ ...p, [key(item)]: e.target.value }))}
                        className="app-input px-2 py-1.5 rounded text-xs w-36"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                        item.has_password ? "bg-emerald-900/30 text-emerald-300" : "bg-amber-900/30 text-amber-300"
                      }`}>
                        {item.has_password ? "Password set" : "No password"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleSendOne(item)}
                        disabled={sending || !item.email}
                        className="px-2.5 py-1.5 rounded text-xs bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-40"
                      >
                        Reset + Email
                      </button>
                      <button
                        onClick={() => handleReset(item)}
                        disabled={resetting === key(item)}
                        className="ml-2 px-2.5 py-1.5 rounded text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                      >
                        Reset only
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

function Summary({ label, value, accent = false }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${accent ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white/80"}`}>
      <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? "text-teal-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
