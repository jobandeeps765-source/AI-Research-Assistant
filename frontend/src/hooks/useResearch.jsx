import { useState } from 'react';
import { researchAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useResearch() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const createResearch = async (topic) => {
    if (topic.trim().length < 5) {
      toast.error('Topic must be at least 5 characters');
      return null;
    }

    setLoading(true);
    setReport(null);

    try {
      const response = await researchAPI.create(topic);
      setReport(response.data);
      toast.success('Research report generated!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Research failed. Please try again.';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (search = '') => {
    setHistoryLoading(true);
    try {
      const response = await researchAPI.getHistory(search);
      setHistory(response.data);
      return response.data;
    } catch (err) {
      toast.error('Failed to load history');
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteResearch = async (id) => {
    try {
      await researchAPI.delete(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success('Report deleted');
      if (report?.id === id) setReport(null);
      return true;
    } catch (err) {
      toast.error('Failed to delete');
      return false;
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await researchAPI.toggleFavorite(id);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, favorited: response.data.favorited } : item
        )
      );
      toast.success(response.data.favorited ? 'Added to favorites' : 'Removed from favorites');
      return response.data.favorited;
    } catch (err) {
      toast.error('Failed to update favorite');
      return false;
    }
  };

  const askFollowUp = async (topic, reportText, question) => {
    if (question.trim().length < 5) {
      toast.error('Question must be at least 5 characters');
      return null;
    }

    setFollowUpLoading(true);
    setFollowUpAnswer(null);

    try {
      const response = await researchAPI.followUp(topic, reportText, question);
      setFollowUpAnswer(response.data.answer);
      return response.data.answer;
    } catch (err) {
      const message = err.response?.data?.detail || 'Follow-up failed. Please try again.';
      toast.error(message);
      return null;
    } finally {
      setFollowUpLoading(false);
    }
  };

  const clearFollowUp = () => setFollowUpAnswer(null);
  const clearReport = () => setReport(null);

  return {
    report,
    loading,
    history,
    historyLoading,
    followUpAnswer,
    followUpLoading,
    createResearch,
    fetchHistory,
    deleteResearch,
    toggleFavorite,
    askFollowUp,
    clearFollowUp,
    clearReport,
  };
}
