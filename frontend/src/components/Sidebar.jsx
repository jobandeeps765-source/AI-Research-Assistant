import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiClock, FiUpload, FiUser } from 'react-icons/fi';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/research', icon: FiSearch, label: 'New Research' },
    { to: '/pdf-upload', icon: FiUpload, label: 'PDF Analysis' },
    { to: '/history', icon: FiClock, label: 'History' },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-4">
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
