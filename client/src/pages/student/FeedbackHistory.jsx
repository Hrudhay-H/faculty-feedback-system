import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import studentFeedbackService from '../../services/studentFeedbackService';
import { PageSpinner, ErrorAlert, EmptyState } from '../../components/ui';


function FeedbackHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await studentFeedbackService.getHistory();
        if (response.data?.success) {
          setHistory(response.data.data.history || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load feedback history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header Block */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900">Appraisal Completion History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual logs of successfully registered evaluations. To protect evaluations anonymity, actual ratings and qualitative comments are encrypted and are not readable by students.
          </p>
        </div>

        {/* List View */}
        {loading ? (
          <PageSpinner label="Fetching evaluation history..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : history.length === 0 ? (
          <EmptyState icon="📜" title="No feedback submitted" description="No evaluation responses have been submitted yet across any semester." />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-3.5">Course Code</th>
                    <th className="px-6 py-3.5">Course Title</th>
                    <th className="px-6 py-3.5">Semester</th>
                    <th className="px-6 py-3.5">Credits</th>
                    <th className="px-6 py-3.5">Assigned Instructor</th>
                    <th className="px-6 py-3.5 font-bold">Status Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {history.map((h) => (
                    <tr key={h.feedbackId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{h.course?.courseCode || '—'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{h.course?.courseName || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">{h.semester}</td>
                      <td className="px-6 py-4">{h.course?.credits ? `${h.course.credits} Credits` : '—'}</td>
                      <td className="px-6 py-4">{h.faculty?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 flex items-center space-x-1.5 font-bold text-emerald-800">
                        <span>🔒</span>
                        <span>Submitted (Immutable)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default FeedbackHistory;
