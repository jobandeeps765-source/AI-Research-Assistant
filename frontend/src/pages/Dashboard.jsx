import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatusCard from '../components/StatusCard';
import { researchAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FiSearch, FiClock, FiFileText, FiArrowRight } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentResearch, setRecentResearch] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await researchAPI.getHistory();
      const data = response.data;
      setTotalCount(data.length);
      setRecentResearch(data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 mt-1">
              Here's an overview of your research activity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatusCard icon={FiFileText} label="Total Reports" value={totalCount} color="primary" />
            <StatusCard icon={FiClock} label="This Week" value={recentResearch.length} color="accent" />
            <StatusCard icon={FiSearch} label="Status" value="Ready" color="secondary" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-secondary-800">
                Recent Research
              </h2>
              <Link
                to="/research"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                New Research <FiArrowRight className="ml-1" size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : recentResearch.length === 0 ? (
              <div className="p-12 text-center">
                <FiFileText className="mx-auto text-gray-300" size={48} />
                <p className="mt-4 text-gray-500">No research reports yet</p>
                <Link
                  to="/research"
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700"
                >
                  Start Your First Research
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentResearch.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-secondary-800 truncate">
                          {item.topic}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Link
                        to="/history"
                        className="ml-4 text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
