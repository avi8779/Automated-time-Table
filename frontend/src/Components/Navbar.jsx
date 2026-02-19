import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '#dashboard' },
    { icon: '📊', label: 'Analytics', href: '#analytics' },
    { icon: '👥', label: 'Users', href: '#users' },
    { icon: '⚙️', label: 'Settings', href: '#settings' },
    { icon: '📁', label: 'Projects', href: '#projects' },
    { icon: '💬', label: 'Messages', href: '#messages' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white lg:hidden hover:bg-indigo-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-center h-16 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-indigo-400">MyApp</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
              JD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-slate-400">john@example.com</p>
            </div>
          </div>
        </div>
      </aside>
      
    </>
  );
}