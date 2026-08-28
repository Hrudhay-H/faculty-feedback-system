import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/Layout/StudentLayout';
import studentFeedbackService from '../../services/studentFeedbackService';
import { Link } from 'react-router-dom';
import { PageSpinner, ErrorAlert, EmptyState } from '../../components/ui';


function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [windowActive, setWindowActive] = useState(true);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await studentFeedbackService.getCourses();
        if (response.data && response.data.success) {
          const payload = response.data.data;
          setWindowActive(payload.windowActive);
          setSemester(payload.semester);
          setCourses(payload.courses);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch courses list');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const pendingCourses = courses.filter((c) => c.status === 'Pending');
  const submittedCourses = courses.filter((c) => c.status === 'Submitted');

  return (
    <StudentLayout>
      {loading ? (
        <PageSpinner label="Fetching courses list..." />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : !windowActive ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center max-w-lg mx-auto space-y-4">
          <span className="text-4xl">🔒</span>
          <h2 className="text-lg font-black text-slate-800">Evaluations Closed</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            There is currently no active feedback window configured for this academic semester.
            Please contact the administration office if you believe this is an error.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Dashboard Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Active Academic Window: {semester}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Please complete evaluations for your enrolled courses below.</p>
            </div>
            {courses.length > 0 && (
              <div className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-800 rounded px-3 py-1.5 font-bold">
                Progress: {submittedCourses.length} of {courses.length} Completed
              </div>
            )}
          </div>

          {/* Quick Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Appraisals</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{submittedCourses.length}</span>
              </div>
              <div className="w-10 h-10 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                ✅
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Actions</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{pendingCourses.length}</span>
              </div>
              <div className="w-10 h-10 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                ⏳
              </div>
            </div>
          </div>

          {/* Course Card Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">My Course Registries</h3>
            
            {courses.length === 0 ? (
              <EmptyState icon="📚" title="No enrolled courses" description="You are not enrolled in any courses for the current semester." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const isSubmitted = course.status === 'Submitted';
                  return (
                    <div key={course.courseId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:shadow transition-shadow">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {course.courseCode}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            isSubmitted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isSubmitted ? 'Submitted' : 'Pending feedback'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{course.courseName}</h4>
                        <div className="text-xs text-slate-500">
                          Instructor: <span className="font-bold text-slate-800">{course.faculty?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-[10px] text-slate-400 font-semibold">{course.credits} Credits</span>
                        {isSubmitted ? (
                          <button
                            disabled
                            className="bg-slate-100 border border-slate-200 text-slate-400 font-bold px-4 py-2 rounded-lg cursor-not-allowed"
                          >
                            Completed
                          </button>
                        ) : (
                          <Link
                            to={`/student/feedback/${course.courseId}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-center"
                            aria-label={`Evaluate feedback for ${course.courseName}`}
                          >
                            Evaluate
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

export default StudentDashboard;
