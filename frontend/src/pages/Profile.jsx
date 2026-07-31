import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
            <p className="text-gray-500 mt-1">
              View and manage your account information.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-lg">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-primary-100">{user?.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
                <FiUser className="text-gray-400" size={18} />
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="text-sm font-medium text-secondary-800">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
                <FiMail className="text-gray-400" size={18} />
                <div>
                  <p className="text-xs text-gray-400">Email Address</p>
                  <p className="text-sm font-medium text-secondary-800">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-3">
                <FiCalendar className="text-gray-400" size={18} />
                <div>
                  <p className="text-xs text-gray-400">Member Since</p>
                  <p className="text-sm font-medium text-secondary-800">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
