import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { teacherSlice, roomSlice, courseSlice, departmentSlice, subjectSlice, sectionSlice } from '../Redux/store';

const statCards = [
  { label: 'Departments', sliceKey: 'department', icon: '🏛', color: 'emerald' },
  { label: 'Teachers',    sliceKey: 'teacher',    icon: '👨‍🏫', color: 'sky' },
  { label: 'Courses',     sliceKey: 'course',     icon: '📚', color: 'violet' },
  { label: 'Rooms',       sliceKey: 'room',       icon: '🚪', color: 'amber' },
  { label: 'Subjects',    sliceKey: 'subject',    icon: '📖', color: 'rose' },
  { label: 'Sections',    sliceKey: 'section',    icon: '🗂', color: 'teal' },
];

const colorMap = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/20' },
};

function StatCard({ label, sliceKey, icon, color }) {
  const count = useSelector((state) => state[sliceKey]?.data?.length ?? 0);
  const c = colorMap[color];

  return (
    <div className={`bg-slate-900 border ${c.border} rounded-xl p-5 flex items-center gap-4 hover:bg-slate-800/60 transition-colors`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{count}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, description, color }) {
  const c = colorMap[color];
  return (
    <a href={to} className={`block p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-${color}-500/30 hover:bg-slate-800/60 transition-all group`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xl ${c.text}`}>{icon}</span>
        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</span>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </a>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();

  // Fetch all data for stat counts
  useEffect(() => {
    dispatch(teacherSlice.actions.getAll());
    dispatch(roomSlice.actions.getAll());
    dispatch(courseSlice.actions.getAll());
    dispatch(departmentSlice.actions.getAll());
    dispatch(subjectSlice.actions.getAll());
    dispatch(sectionSlice.actions.getAll());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Welcome back, Admin — here's your system overview.</p>
        </div>

        {/* Stat Cards */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <StatCard key={card.sliceKey} {...card} />
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink to="/teachers/create"    icon="👨‍🏫" label="Add Teacher"    description="Register a new teacher and assign subjects"  color="sky" />
            <QuickLink to="/courses"     icon="📚"  label="Add Course"     description="Create a new course under a department"       color="violet" />
            <QuickLink to="/sections"    icon="🗂"  label="Add Section"    description="Create sections for a course and semester"    color="teal" />
            <QuickLink to="/rooms"       icon="🚪"  label="Add Room"       description="Register a classroom or lab in a building"    color="amber" />
            <QuickLink to="/subjects"    icon="📖"  label="Add Subject"    description="Add a subject and link it to a course"        color="rose" />
            <QuickLink to="/time-slots"  icon="🕐"  label="Manage Slots"   description="Configure daily time slots and breaks"        color="emerald" />
          </div>
        </div>

        {/* System Info */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">System</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Version</p>
              <p className="text-sm font-medium text-slate-200">v1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-sm font-medium text-emerald-400">Online</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">API</p>
              <p className="text-sm font-medium text-slate-200">localhost:5014</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}