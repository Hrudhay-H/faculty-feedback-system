import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/layout/FacultyLayout';
import facultyService from '../../services/facultyService';
import { PageSpinner, ErrorAlert, EmptyState } from '../../components/ui';


function FacultyComments() {
  const [comments, setComments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    facultyService.getCourses()
      .then((res) => { if (res.data.success) setCourses(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    facultyService.getComments(selectedCourseId || null)
      .then((res) => { if (res.data.success) setComments(res.data.data); })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            Student Comments
            {!loading && (
              <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full text-xs font-bold">
                {comments.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qualitative feedback from students, fully anonymized. Comments are displayed in randomized order 
            to prevent any correlation with submission timing. No student identity information is available.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[10px] text-amber-800 font-semibold mt-3 inline-flex items-center gap-1.5">
            🔒 Student identities are protected — only comment text and course/semester context is shown
          </div>
        </div>

        {/* Course filter */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter by Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName} ({c.semester})</option>
            ))}
          </select>
        </div>

        {/* Comments list */}
        {loading ? (
          <PageSpinner label="Fetching qualitative comments..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : comments.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No comments available"
            description="Students can optionally leave qualitative comments when submitting evaluations. None have been submitted yet for your courses."
          />
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
              {comments.length} anonymous comment{comments.length !== 1 ? 's' : ''} — order randomized
            </p>
            {comments.map((c, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-violet-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <blockquote className="text-sm text-slate-700 leading-relaxed italic flex-1">
                    &ldquo;{c.comment}&rdquo;
                  </blockquote>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {c.courseCode && (
                      <span className="font-mono text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded font-bold block">
                        {c.courseCode}
                      </span>
                    )}
                    {c.semester && (
                      <span className="text-[10px] text-slate-400 font-semibold block">{c.semester}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

export default FacultyComments;
