import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import adminService from '../../services/adminService';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination States
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals Toggle States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Field States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getStudents({ search, page, limit: 10 });
      if (response.data && response.data.success) {
        setStudents(response.data.data.records);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to page 1 on search
  };

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setName(student.name);
    setEmail(student.email);
    setPassword(''); // Leave empty unless modifying
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name || !email || !password) {
      setFormError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await adminService.createStudent({ name, email, password });
      if (response.data && response.data.success) {
        setIsCreateOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Create student failed');
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name || !email) {
      setFormError('Name and Email are required');
      return;
    }
    if (password && password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      const payload = { name, email };
      if (password) payload.password = password;

      const response = await adminService.updateStudent(selectedStudent._id, payload);
      if (response.data && response.data.success) {
        setIsEditOpen(false);
        fetchStudents();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Update student failed');
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await adminService.deleteStudent(selectedStudent._id);
      setIsDeleteOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Registry Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Student Directory Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage students and their system accounts.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wide transition-colors"
          >
            + Register Student
          </button>
        </div>

        {/* Search & Filter Options */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by student name or academic email..."
              className="flex-1 text-xs border border-slate-350 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
            <button
              type="submit"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-4 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table List View */}
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
        ) : students.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No students found</p>
            <p className="text-xs mt-1 text-slate-300">Try adjusting your search criteria or register a new student.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Academic Email</th>
                    <th className="px-6 py-3.5">Enrollment Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                      <td className="px-6 py-4">{student.email}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2.5">
                        <button
                          onClick={() => openEditModal(student)}
                          className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(student)}
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

            {/* Pagination controls */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <span className="text-xs text-slate-500">
                  Page {page} of {pagination.pages} (Total: {pagination.total} records)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="border bg-white rounded px-2.5 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                    className="border bg-white rounded px-2.5 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Create Student */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Register New Student</h3>
              </div>
              <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. Emily Watson"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. emily@student.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="Min 6 characters"
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
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Student */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Update Student Profile</h3>
              </div>
              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="Leave blank to keep current"
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

        {/* Modal: Confirm Delete */}
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-rose-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Confirm Account Removal</h3>
              </div>
              <div className="p-6 space-y-4 text-xs text-slate-600">
                <p>
                  Are you sure you want to delete <span className="font-bold text-slate-950">{selectedStudent?.name}</span>?
                </p>
                <p className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-100 font-medium">
                  ⚠️ WARNING: This operation is permanent. All active student-course enrollments associated with this account will also be deleted.
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="border px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-bold"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminStudents;
