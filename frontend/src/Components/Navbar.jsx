import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { toast } from "react-toastify";
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiDatabase,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMail,
  FiMap,
  FiMenu,
  FiUsers,
  FiX,
} from "react-icons/fi";

const ADMIN_MENU = [
  {
    group: "Overview",
    items: [{ icon: FiHome, label: "Dashboard", to: "/" }],
  },
  {
    group: "Management",
    items: [
      { icon: FiBriefcase, label: "Departments", to: "/department/create" },
      { icon: FiMap, label: "Buildings", to: "/building/create" },
      { icon: FiGrid, label: "Rooms", to: "/room/create" },
      { icon: FiUsers, label: "Teachers", to: "/teacher/create" },
      { icon: FiBookOpen, label: "Courses", to: "/course/create" },
      { icon: FiBookOpen, label: "Subjects", to: "/subject/create" },
      { icon: FiGrid, label: "Sections", to: "/section/create" },
      { icon: FiClock, label: "Time Slots", to: "/time-slot/create" },
    ],
  },
  {
    group: "Operations",
    items: [
      { icon: FiUsers, label: "Assign Teachers", to: "/teacher-Subjects" },
      { icon: FiCalendar, label: "Timetable", to: "/timetable" },
      { icon: FiCalendar, label: "Teacher Schedule", to: "/teacher-timetable" },
      { icon: FiUsers, label: "Students", to: "/students" },
      { icon: FiDatabase, label: "Bulk Upload", to: "/bulk-upload" },
      { icon: FiMail, label: "Notify Users", to: "/notify" },
    ],
  },
];

const TEACHER_MENU = [
  { group: "My Schedule", items: [{ icon: FiCalendar, label: "My Timetable", to: "/my-timetable" }] },
];

const STUDENT_MENU = [
  { group: "My Schedule", items: [{ icon: FiCalendar, label: "My Timetable", to: "/my-timetable" }] },
];

const roleInitials = { admin: "AD", teacher: "TC", student: "ST" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems =
    user?.role === "admin" ? ADMIN_MENU :
    user?.role === "teacher" ? TEACHER_MENU :
    user?.role === "student" ? STUDENT_MENU : [];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur lg:hidden"
        aria-label="Toggle navigation"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200/80
        bg-white/90 text-slate-900 shadow-2xl shadow-slate-200/60 backdrop-blur-xl
        transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:translate-x-0
      `}>
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-lg font-black text-white shadow-lg shadow-teal-100">
              TT
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">TimeTable</p>
              <p className="text-xs font-medium capitalize text-slate-500">{user?.role || "Guest"} workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-7">
            {menuItems.map((group) => (
              <section key={group.group}>
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {group.group}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all
                          ${isActive
                            ? "border-teal-200 bg-teal-50 text-teal-800 shadow-sm"
                            : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"}`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                {roleInitials[user?.role] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || "Guest"}</p>
                <p className="truncate text-xs capitalize text-slate-500">{user?.role || ""}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
