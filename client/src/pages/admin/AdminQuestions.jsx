import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import adminService from '../../services/adminService';

function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States
  const [text, setText] = useState('');
  const [formError, setFormError] = useState(null);

  // Edit State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getQuestions();
      if (response.data && response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!text.trim()) {
      setFormError('Question text cannot be empty');
      return;
    }

    try {
      const response = await adminService.createQuestion({ text });
      if (response.data && response.data.success) {
        setText('');
        fetchQuestions();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Create question failed');
    }
  };

  const handleToggleActive = async (q) => {
    try {
      const response = await adminService.updateQuestion(q._id, { isActive: !q.isActive });
      if (response.data && response.data.success) {
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Update failed');
    }
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setIsEditOpen(true);
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      const response = await adminService.updateQuestion(editingQuestion._id, { text: editText });
      if (response.data && response.data.success) {
        setIsEditOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Update failed');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await adminService.deleteQuestion(id);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-lg font-bold text-slate-800">Feedback Questions Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">Define and activate question prompts served in feedback forms.</p>
        </div>

        {/* Add Question Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Register New Question</h3>
          
          {formError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
              {formError}
            </p>
          )}

          <form onSubmit={handleAddQuestion} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. The instructor stimulates class discussion and handles student queries effectively."
              className="flex-1 text-xs border border-slate-350 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg tracking-wide transition-colors"
            >
              Add Question
            </button>
          </form>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="h-48 flex items-center justify-center bg-white rounded-xl border">
            <svg className="animate-spin h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-xs">
            <span>{error}</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No questions configured</p>
            <p className="text-xs mt-1 text-slate-300">Add questions above to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-3.5 w-16">Index</th>
                    <th className="px-6 py-3.5">Question Description</th>
                    <th className="px-6 py-3.5 w-32">Status</th>
                    <th className="px-6 py-3.5 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {questions.map((q, idx) => (
                    <tr key={q._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 leading-relaxed">{q.text}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(q)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                            q.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-650 border-slate-250 hover:bg-slate-200'
                          }`}
                        >
                          {q.isActive ? '🟢 Active' : '⚪ Deactivated'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(q)}
                          className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="font-semibold text-rose-600 hover:text-rose-950 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Edit Question */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Edit Question Prompt</h3>
              </div>
              <form onSubmit={handleEditQuestion} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Question Text</label>
                  <textarea
                    rows="3"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="border px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminQuestions;
