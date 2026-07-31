import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportViewer from '../components/ReportViewer';
import FollowUpChat from '../components/FollowUpChat';
import { pdfAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX, FiLoader } from 'react-icons/fi';

export default function PdfUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Only PDF files are accepted');
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setReport(null);

    try {
      const response = await pdfAPI.analyze(file);
      setReport(response.data);
      toast.success('PDF analyzed successfully!');
    } catch (err) {
      const message = err.response?.data?.detail || 'PDF analysis failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">PDF Analysis</h1>
            <p className="text-gray-500 mt-1">
              Upload a PDF document and let the AI agents generate a comprehensive research report.
            </p>
          </div>

          {/* Upload Area */}
          {!report && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-primary-500 bg-primary-50'
                      : file
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => document.getElementById('pdf-input').click()}
                >
                  <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex flex-col items-center">
                      <FiFile className="text-green-500 mb-3" size={40} />
                      <p className="text-sm font-medium text-secondary-800">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <FiX className="mr-1" size={12} />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FiUploadCloud className="text-gray-300 mb-3" size={40} />
                      <p className="text-sm font-medium text-secondary-800">
                        Drag & drop a PDF here, or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <p className="text-xs text-gray-400">
                    The AI agents will analyze the document and produce a structured research report.
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !file}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="mr-2 animate-spin" size={16} />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze PDF'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-sm font-medium text-secondary-800">Extracting text from PDF...</p>
              <p className="text-xs text-gray-400 mt-1">
                AI agents are analyzing the document. This may take a few minutes.
              </p>
            </div>
          )}

          {/* Report Display */}
          {!loading && report && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-800">
                  Analysis of: {file?.name}
                </h2>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Analyze Another PDF
                </button>
              </div>
              <ReportViewer report={report.report} topic={report.topic} />
              <FollowUpChat topic={report.topic} report={report.report} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
