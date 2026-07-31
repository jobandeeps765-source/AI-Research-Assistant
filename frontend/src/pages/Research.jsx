import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportViewer from '../components/ReportViewer';
import FollowUpChat from '../components/FollowUpChat';
import { useResearch } from '../hooks/useResearch';
import { FiSearch, FiSend, FiCheck } from 'react-icons/fi';

const PIPELINE_STEPS = [
  { label: 'Planning', description: 'Planner Agent is analyzing your topic...' },
  { label: 'Researching', description: 'Research Agent is gathering information...' },
  { label: 'Writing', description: 'Writer Agent is composing the report...' },
];

export default function Research() {
  const [topic, setTopic] = useState('');
  const { report, loading, createResearch } = useResearch();
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startPipelineAnimation = () => {
    setActiveStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step < PIPELINE_STEPS.length) {
        setActiveStep(step);
      } else {
        clearInterval(intervalRef.current);
      }
    }, 15000);
  };

  const stopPipelineAnimation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (topic.trim().length < 5) return;
    startPipelineAnimation();
    await createResearch(topic);
    stopPipelineAnimation();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              New Research
            </h1>
            <p className="text-gray-500 mt-1">
              Enter a topic and our AI agents will collaborate to produce a comprehensive report.
            </p>
          </div>

          {/* Research Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Research Topic
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The impact of AI on modern healthcare"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  The AI agents will research, analyze, and write a professional report for you.
                </p>
                <button
                  type="submit"
                  disabled={loading || topic.trim().length < 5}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FiSend className="mr-2" size={16} />
                  {loading ? 'Researching...' : 'Start Research'}
                </button>
              </div>
            </form>
          </div>

          {/* Agent Pipeline Status */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-secondary-800 mb-4">
                AI Agent Pipeline
              </h3>

              <div className="flex items-center justify-between mb-6">
                {PIPELINE_STEPS.map((step, i) => {
                  const isCompleted = i < activeStep;
                  const isActive = i === activeStep;

                  return (
                    <div key={step.label} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                            isCompleted
                              ? 'bg-accent-500 text-white'
                              : isActive
                              ? 'bg-primary-600 text-white animate-pulse'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <FiCheck size={18} /> : i + 1}
                        </div>
                        <p
                          className={`mt-2 text-xs font-medium transition-colors duration-500 ${
                            isCompleted || isActive ? 'text-secondary-800' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 w-12 mx-2 rounded transition-colors duration-500 ${
                            isCompleted ? 'bg-accent-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {PIPELINE_STEPS[activeStep]?.description}
                </p>
              </div>
            </div>
          )}

          {/* Report Display */}
          {!loading && report && (
            <div className="mt-6 space-y-4">
              <ReportViewer report={report.report} topic={report.topic} />
              <FollowUpChat topic={report.topic} report={report.report} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
