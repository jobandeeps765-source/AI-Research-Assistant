import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiSearch, FiUsers, FiFileText, FiZap } from 'react-icons/fi';

export default function Landing() {
  const features = [
    {
      icon: FiUsers,
      title: 'AI Agent Collaboration',
      description: 'Multiple AI agents work together - planner, researcher, and writer collaborate seamlessly.',
    },
    {
      icon: FiSearch,
      title: 'Deep Research',
      description: 'Comprehensive information gathering and analysis on any topic you choose.',
    },
    {
      icon: FiFileText,
      title: 'Professional Reports',
      description: 'Receive beautifully formatted, structured research reports with executive summaries.',
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Get detailed research reports in minutes, not hours or days.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <FiZap className="mr-2" size={14} />
              Powered by CrewAI & Google Gemini
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 leading-tight">
              AI-Powered
              <span className="text-primary-600"> Research </span>
              Assistant
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Enter any topic and watch as our team of AI agents collaborates to
              produce a comprehensive, professional research report — powered by
              CrewAI multi-agent orchestration.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-xl text-base font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-xl text-base font-semibold border-2 border-gray-200 text-secondary-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900">
              How It Works
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Our AI research pipeline uses three specialized agents working in sequence
              to deliver high-quality research reports.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="text-primary-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent Pipeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900">
              The Agent Pipeline
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Three specialized AI agents work in sequence, each building on the previous agent's output.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Planner Agent',
                description: 'Analyzes your topic and creates a structured research plan with key questions and subtopics.',
                color: 'bg-blue-50 border-blue-200 text-blue-700',
              },
              {
                step: '02',
                title: 'Research Agent',
                description: 'Follows the plan to gather comprehensive information, facts, statistics, and expert insights.',
                color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
              },
              {
                step: '03',
                title: 'Writer Agent',
                description: 'Transforms all research findings into a beautifully formatted professional report.',
                color: 'bg-purple-50 border-purple-200 text-purple-700',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`rounded-xl border-2 p-6 ${item.color}`}
              >
                <span className="text-4xl font-bold opacity-20">{item.step}</span>
                <h3 className="text-xl font-semibold mt-2">{item.title}</h3>
                <p className="mt-3 text-sm opacity-80">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            AI Research Assistant — Built with CrewAI, FastAPI, React & Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
