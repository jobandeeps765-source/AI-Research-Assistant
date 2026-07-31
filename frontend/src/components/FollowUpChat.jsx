import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useResearch } from '../hooks/useResearch';
import { FiMessageCircle, FiSend, FiLoader } from 'react-icons/fi';

export default function FollowUpChat({ topic, report }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const { askFollowUp, followUpLoading } = useResearch();

  const handleAsk = async (e) => {
    e.preventDefault();
    if (question.trim().length < 5 || followUpLoading) return;

    const userMsg = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    const answer = await askFollowUp(topic, report, userMsg);
    if (answer) {
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not generate an answer. Please try again.' },
      ]);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
        <FiMessageCircle size={18} className="text-primary-600" />
        <h3 className="text-sm font-semibold text-secondary-800">Ask a Follow-up Question</h3>
      </div>

      {messages.length > 0 && (
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-800 prose prose-sm max-w-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {followUpLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center space-x-2">
                <FiLoader className="animate-spin text-primary-600" size={14} />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAsk} className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Can you elaborate on the findings about AI ethics?"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
            disabled={followUpLoading}
          />
          <button
            type="submit"
            disabled={followUpLoading || question.trim().length < 5}
            className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FiSend size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
