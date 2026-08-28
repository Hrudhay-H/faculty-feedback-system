import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import adminService from '../../services/adminService';

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]); // Loaded for assignment selectors
  const [studentsList, setStudentsList] = useState([]); // Loaded for enrollment selectors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals Toggle States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  // Form Field States (Courses)
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState('Fall 2026');
  const [formError, setFormError] = useState(null);

  // Enrollment Manager States
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollmentError, setEnrollmentError] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getCourses({ search, page, limit: 10 });
      if (response.data && response.data.success) {
        setCourses(response.data.data.records);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  // Pre-load faculties and students lists for selects
  const loadSelectorsData = async () => {
    try {
      const [facRes, studRes] = await Promise.all([
        adminService.getFaculties({ limit: 100 }),
        adminService.getStudents({ limit: 100 })
      ]);
      if (facRes.data?.success) setFaculties(facRes.data.data.records);
      if (studRes.data?.success) setStudentsList(studRes.data.data.records);
    } catch (err) {
      console.error('Failed to load selectors data:', err.message);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, page]);

  useEffect(() => {
    loadSelectorsData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openCreateModal = () => {
    setCourseName('');
    setCourseCode('');
    setCredits(3);
    setFacultyId(faculties[0]?._id || '');
    setSemester('Fall 2026');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setCourseName(course.courseName);
    setCourseCode(course.courseCode);
    setCredits(course.credits);
    setFacultyId(course.facultyId?._id || '');
    setSemester(course.semester);
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDeleteModal = (course) => {
    setSelectedCourse(course);
    setIsDeleteOpen(true);
  };

  const openEnrollmentModal = async (course) => {
    setSelectedCourse(course);
    setIsEnrollmentOpen(true);
    setSelectedStudentId('');
    setEnrollmentError(null);
    fetchEnrollments(course._id);
  };

  const fetchEnrollments = async (courseId) => {
    setEnrollmentLoading(true);
    setEnrollmentError(null);
    try {
      const response = await adminService.getEnrollments({ courseId });
      if (response.data?.success) {
        setEnrollments(response.data.data.records);
      }
    } catch (err) {
      setEnrollmentError(err.response?.data?.message || err.message || 'Failed to fetch enrollments');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!courseName || !courseCode || !credits || !facultyId || !semester) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await adminService.createCourse({
        courseName,
        courseCode,
        credits: parseInt(credits),
        facultyId,
        semester
      });
      if (response.data && response.data.success) {
        setIsCreateOpen(false);
        fetchCourses();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Create course failed');
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!courseName || !courseCode || !credits || !facultyId || !semester) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await adminService.updateCourse(selectedCourse._id, {
        courseName,
        courseCode,
        credits: parseInt(credits),
        facultyId,
        semester
      });
      if (response.data && response.data.success) {
        setIsEditOpen(false);
        fetchCourses();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Update course failed');
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await adminService.deleteCourse(selectedCourse._id);
      setIsDeleteOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const handleAddEnrollment = async (e) => {
    e.preventDefault();
    setEnrollmentError(null);
    if (!selectedStudentId) {
      setEnrollmentError('Please select a student');
      return;
    }

    try {
      const response = await adminService.createEnrollment({
        studentId: selectedStudentId,
        courseId: selectedCourse._id
      });
      if (response.data?.success) {
        setSelectedStudentId('');
        fetchEnrollments(selectedCourse._id);
      }
    } catch (err) {
      setEnrollmentError(err.response?.data?.message || err.message || 'Enrollment failed');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId) => {
    if (!confirm('Are you sure you want to remove this student from this course?')) return;
    try {
      await adminService.deleteEnrollment(enrollmentId);
      fetchEnrollments(selectedCourse._id);
    } catch (err) {
      setEnrollmentError(err.response?.data?.message || err.message || 'Failed to remove enrollment');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Course Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage academic courses and enroll students.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg tracking-wide transition-colors"
          >
            + Create Course
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course code or title..."
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

        {/* Course Grid / Table List */}
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
        ) : courses.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No courses configured</p>
            <p className="text-xs mt-1 text-slate-300">Start by creating a new course entry.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Course Title</th>
                    <th className="px-6 py-3.5">Credits</th>
                    <th className="px-6 py-3.5">Instructor</th>
                    <th className="px-6 py-3.5">Semester</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{course.courseCode}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{course.courseName}</td>
                      <td className="px-6 py-4">{course.credits} Credits</td>
                      <td className="px-6 py-4 text-slate-650">{course.facultyId?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{course.semester}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEnrollmentModal(course)}
                          className="font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          Enrollments
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(course)}
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

        {/* Modal: Create Course */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Create New Course</h3>
              </div>
              <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. Computer Networks"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                      placeholder="e.g. CS302"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                    <input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                      min="1"
                      max="6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Instructor</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white"
                  >
                    {faculties.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
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
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Course */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white">
                <h3 className="font-bold text-sm">Update Course Details</h3>
              </div>
              <form onSubmit={handleEditCourse} className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                    <input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                      min="1"
                      max="6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Instructor</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white"
                  >
                    {faculties.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
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
                <h3 className="font-bold text-sm">Delete Course Configuration</h3>
              </div>
              <div className="p-6 space-y-4 text-xs text-slate-600">
                <p>
                  Are you sure you want to delete course <span className="font-bold text-slate-950">{selectedCourse?.courseCode}</span>?
                </p>
                <p className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-100 font-medium">
                  ⚠️ WARNING: This operation is permanent. All active student enrollments inside this course will be deleted instantly!
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="border px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-bold"
                  >
                    Delete Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Enrollment Manager */}
        {isEnrollmentOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border max-w-xl w-full overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">Course Enrollment Manager</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Course: {selectedCourse?.courseCode} - {selectedCourse?.courseName}</p>
                </div>
                <button
                  onClick={() => setIsEnrollmentOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add Enrollment Form */}
                <form onSubmit={handleAddEnrollment} className="bg-slate-50 border rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enroll Student</h4>
                  {enrollmentError && (
                    <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2">
                      {enrollmentError}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="flex-1 text-xs border rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      <option value="">-- Select Student to Enroll --</option>
                      {studentsList.map((stud) => (
                        <option key={stud._id} value={stud._id}>
                          {stud.name} ({stud.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors"
                    >
                      Enroll
                    </button>
                  </div>
                </form>

                {/* Enrolled Students Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Currently Enrolled Students</h4>
                  
                  {enrollmentLoading ? (
                    <div className="h-32 flex items-center justify-center border border-dashed rounded text-xs text-slate-400">
                      Loading enrollments...
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed rounded text-xs text-slate-400 bg-slate-50">
                      <span className="font-bold">No students enrolled</span>
                      <span className="text-[10px] mt-0.5 text-slate-300">Use the form above to enroll students.</span>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b text-[10px] uppercase font-bold text-slate-500">
                            <th className="px-4 py-2">Student Name</th>
                            <th className="px-4 py-2">Academic Email</th>
                            <th className="px-4 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs text-slate-700">
                          {enrollments.map((en) => (
                            <tr key={en._id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-900">{en.studentId?.name || 'Deleted Student'}</td>
                              <td className="px-4 py-2.5">{en.studentId?.email || 'N/A'}</td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEnrollment(en._id)}
                                  className="font-bold text-rose-600 hover:text-rose-950"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminCourses;
