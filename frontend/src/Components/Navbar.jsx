import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  {
    group: 'Overview',
    items: [
      { icon: '⬡', label: 'Dashboard',   to: '/' },
    ]
  },
  {
    group: 'Management',
    items: [
      { icon: '🏛', label: 'Departments', to: '/department/create' },
      { icon: '🏢', label: 'Buildings',   to: '/building/create' },
      { icon: '🚪', label: 'Rooms',        to: '/room/create' },
      { icon: '👨‍🏫', label: 'Teachers',    to: '/teacher/create' },
      { icon: '📚', label: 'Courses',      to: '/course/create' },
      { icon: '📖', label: 'Subjects',     to: '/subject/create' },
      { icon: '🗂', label: 'Sections',     to: '/section/create' },
      { icon: '🕐', label: 'Time Slots',   to: '/time-slot/create' },
      { icon: '🕐', label: 'Teacher Suject',   to: '/teacher-Subjects' },
      { icon: '🕐', label: 'Teacher timbetable',   to: '/teacher-timetable' },
      { icon: '🕐', label: 'Timetable',   to: '/timetable' },
    ]
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-emerald-500 text-slate-950 lg:hidden hover:bg-emerald-400 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 text-white z-40 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-slate-950 font-black text-sm">TT</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">TimeTable</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuItems.map((group) => (
            <div key={group.group}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                      ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
                      }`
                    }
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@timetable.com</p>
            </div>
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}