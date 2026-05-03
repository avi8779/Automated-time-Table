import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiBookOpen, FiBriefcase, FiCalendar, FiClock, FiGrid, FiMap, FiUsers } from "react-icons/fi";
import { teacherSlice, roomSlice, courseSlice, departmentSlice, subjectSlice, sectionSlice } from "../Redux/store";

const statCards = [
  { label: "Departments", sliceKey: "department", icon: FiBriefcase, tone: "emerald" },
  { label: "Teachers", sliceKey: "teacher", icon: FiUsers, tone: "sky" },
  { label: "Courses", sliceKey: "course", icon: FiBookOpen, tone: "violet" },
  { label: "Rooms", sliceKey: "room", icon: FiMap, tone: "amber" },
  { label: "Subjects", sliceKey: "subject", icon: FiBookOpen, tone: "rose" },
  { label: "Sections", sliceKey: "section", icon: FiGrid, tone: "teal" },
];

const toneMap = {
  emerald: "from-emerald-400/20 to-emerald-400/5 text-emerald-200 border-emerald-300/20",
  sky: "from-sky-400/20 to-sky-400/5 text-sky-200 border-sky-300/20",
  violet: "from-violet-400/20 to-violet-400/5 text-violet-200 border-violet-300/20",
  amber: "from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-300/20",
  rose: "from-rose-400/20 to-rose-400/5 text-rose-200 border-rose-300/20",
  teal: "from-teal-400/20 to-teal-400/5 text-teal-200 border-teal-300/20",
};

const quickLinks = [
  { to: "/teacher/create", icon: FiUsers, label: "Add Teacher", description: "Register faculty and teaching limits" },
  { to: "/course/create", icon: FiBookOpen, label: "Add Course", description: "Create courses under departments" },
  { to: "/section/create", icon: FiGrid, label: "Add Section", description: "Manage batches, semesters, and strength" },
  { to: "/room/create", icon: FiMap, label: "Add Room", description: "Create classrooms and labs" },
  { to: "/subject/create", icon: FiBookOpen, label: "Add Subject", description: "Define theory and lab subjects" },
  { to: "/timetable", icon: FiCalendar, label: "Generate Timetable", description: "Build schedules by section or department" },
];

function StatCard({ label, sliceKey, icon: Icon, tone }) {
  const count = useSelector((state) => state[sliceKey]?.data?.length ?? 0);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneMap[tone]} p-5 shadow-sm`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">{count}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className="app-card group rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-teal-300/30 hover:bg-white/[0.06]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-200">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-slate-100">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </Link>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(teacherSlice.actions.getAll());
    dispatch(roomSlice.actions.getAll());
    dispatch(courseSlice.actions.getAll());
    dispatch(departmentSlice.actions.getAll());
    dispatch(subjectSlice.actions.getAll());
    dispatch(sectionSlice.actions.getAll());
  }, [dispatch]);

  return (
    <div className="app-page">
      <div className="app-container space-y-8">
        <section className="app-panel overflow-hidden rounded-3xl p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Academic operations</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Automated Timetable Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Manage departments, rooms, courses, sections, staff, and schedule generation from one focused workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-300/20 bg-teal-400/10 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400 text-slate-950">
                  <FiClock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-teal-100">System online</p>
                  <p className="text-xs text-teal-200/70">Ready for timetable generation</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Overview</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => <StatCard key={card.sliceKey} {...card} />)}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Quick access</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((link) => <QuickLink key={link.to} {...link} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
