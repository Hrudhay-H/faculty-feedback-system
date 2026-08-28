import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FacultyLayout from '../../components/Layout/FacultyLayout';
import facultyService from '../../services/facultyService';
import { PageSpinner, ErrorAlert, EmptyState } from '../../components/ui';


function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    facultyService.getCourses()
      .then((res) => { if (res.data.success) setCourses(res.data.data); })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const starBar = (avg) => {
    const pct = Math.round((avg / 5) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
          <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-bold text-violet-700 w-8">{avg || '—'}</span>
      </div>
    );
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-slate-900">My Assigned Courses</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click on a course to view detailed analytics and anonymized comments.</p>
        </div>

        {loading ? (
          <PageSpinner label="Fetching assigned courses..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No courses assigned"
            description="You have not been assigned to instruct any courses for this academic semester. Please contact the administration."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th scope="col" className="px-6 py-3.5">Course</th>
                  <th scope="col" className="px-6 py-3.5">Semester</th>
                  <th scope="col" className="px-6 py-3.5">Credits</th>
                  <th scope="col" className="px-6 py-3.5">Responses</th>
                  <th scope="col" className="px-6 py-3.5 w-48">Avg Rating</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900">{c.courseCode}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{c.courseName}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{c.semester}</td>
                    <td className="px-6 py-4">{c.credits}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${c.responseCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {c.responseCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.responseCount === 0
                        ? <span className="text-[10px] text-slate-400 italic">No data yet</span>
                        : starBar(c.avgRating)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/faculty/analytics?courseId=${c.id}`}
                        className="font-bold text-violet-600 hover:text-violet-900 transition-colors"
                      >
                        View Analytics →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

export default FacultyCourses;
