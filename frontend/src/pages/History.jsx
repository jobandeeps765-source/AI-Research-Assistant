import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportViewer from '../components/ReportViewer';
import FollowUpChat from '../components/FollowUpChat';
import { useResearch } from '../hooks/useResearch';
import { FiTrash2, FiClock, FiEye, FiX, FiSearch, FiStar, FiMessageCircle } from 'react-icons/fi';

export default function History() {
  const { history, historyLoading, fetchHistory, deleteResearch, toggleFavorite } = useResearch();
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHistory(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const displayedHistory = showFavoritesOnly
    ? history.filter((item) => item.favorited)
    : history;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">Research History</h1>
            <p className="text-gray-500 mt-1">
              View and manage your past research reports.
            </p>
          </div>

          {/* Search + Filter Bar */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showFavoritesOnly
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiStar className={`mr-1.5 ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} size={16} />
              Favorites
            </button>
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : displayedHistory.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FiClock className="mx-auto text-gray-300" size={48} />
              <p className="mt-4 text-gray-500">
                {searchQuery ? 'No results found' : showFavoritesOnly ? 'No favorite reports yet' : 'No research history yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-secondary-800">
                          {item.topic}
                        </h3>
                        {item.favorited && (
                          <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {item.report.substring(0, 150)}...
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-1">
                      <button
                        onClick={() => setSelectedReport(item)}
                        className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                        title="View report"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.favorited
                            ? 'text-yellow-500 hover:bg-yellow-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={item.favorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FiStar size={16} className={item.favorited ? 'fill-yellow-400' : ''} />
                      </button>
                      <button
                        onClick={() => deleteResearch(item.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete report"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4 overflow-y-auto">
              <div className="w-full max-w-4xl mb-16">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 shadow-lg"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <ReportViewer report={selectedReport.report} topic={selectedReport.topic} />
                <FollowUpChat topic={selectedReport.topic} report={selectedReport.report} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
