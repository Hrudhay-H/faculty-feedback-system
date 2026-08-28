import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import adminService from '../../services/adminService';

function AdminWindows() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States
  const [semester, setSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState(null);

  // Modal States
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchWindows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getWindows();
      if (response.data && response.data.success) {
        setWindows(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch windows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWindows();
  }, []);

  const openCreateModal = () => {
    setSemester('');
    setStartDate('');
    setEndDate('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (win) => {
    setSelectedWindow(win);
    setSemester(win.semester);
    // Format Date strings to YYYY-MM-DD for native input
    setStartDate(new Date(win.startDate).toISOString().split('T')[0]);
    setEndDate(new Date(win.endDate).toISOString().split('T')[0]);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateWindow = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!semester || !startDate || !endDate) {
      setFormError('All fields are required');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setFormError('End date must be strictly after start date');
      return;
    }

    try {
      const response = await adminService.createWindow({ semester, startDate, endDate });
      if (response.data && response.data.success) {
        setIsCreateOpen(false);
        fetchWindows();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Create window failed');
    }
  };

  const handleEditWindow = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!semester || !startDate || !endDate) {
      setFormError('All fields are required');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setFormError('End date must be strictly after start date');
      return;
    }

    try {
      const response = await adminService.updateWindow(selectedWindow._id, { semester, startDate, endDate });
      if (response.data && response.data.success) {
        setIsEditOpen(false);
        fetchWindows();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Update window failed');
    }
  };

  const handleDeleteWindow = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback window?')) return;
    try {
      await adminService.deleteWindow(id);
      fetchWindows();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete window failed');
    }
  };

  const isWindowActive = (win) => {
    const now = new Date();
    return now >= new Date(win.startDate) && now <= new Date(win.endDate);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Feedback Windows Configuration</h1>
            <p className="text-xs text-slate-500 mt-0.5">Control survey active periods and timelines for evaluations.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wide transition-colors"
          >
            + Define Window
          </button>
        </div>

        {/* List of Windows */}
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
        ) : windows.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No feedback windows configured</p>
            <p className="text-xs mt-1 text-slate-300">Start by scheduling the active evaluation dates.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-3.5">Semester</th>
                    <th className="px-6 py-3.5">Start Date</th>
                    <th className="px-6 py-3.5">End Date</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {windows.map((win) => {
                    const active = isWindowActive(win);
                    return (
                      <tr key={win._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{win.semester}</td>
                        <td className="px-6 py-4 text-slate-650">{new Date(win.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-650">{new Date(win.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {active ? '🟢 Open (Active)' : '🔴 Closed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditModal(win)}
                            className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteWindow(win._id)}
                            className="font-semibold text-rose-600 hover:text-rose-950 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create Window */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Define Active Feedback Window</h3>
              </div>
              <form onSubmit={handleCreateWindow} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. Fall 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window Starts On</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window Closes On</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="border px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded font-bold"
                  >
                    Schedule Period
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Window */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Reschedule Feedback Dates</h3>
              </div>
              <form onSubmit={handleEditWindow} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-slate-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window Starts On</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window Closes On</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
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
                    Save Dates
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

export default AdminWindows;
