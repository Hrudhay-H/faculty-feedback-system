import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from 'recharts';
import FacultyLayout from '../../components/layout/FacultyLayout';
import facultyService from '../../services/facultyService';
import { PageSpinner, ErrorAlert } from '../../components/ui';


const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const COURSE_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626'];

function SectionCard({ title, children, minHeight = 240 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">{title}</h3>
      <div style={{ minHeight }}>{children}</div>
    </div>
  );
}

function EmptyChart({ message = 'Insufficient data to display this chart.' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400 py-8">
      <span className="text-3xl">📊</span>
      <p className="text-xs font-semibold">{message}</p>
      <p className="text-[10px]">Charts appear once enough feedback is received.</p>
    </div>
  );
}

function FacultyAnalytics() {
  const [searchParams] = useSearchParams();
  const initialCourseId = React.useMemo(() => searchParams.get('courseId') || null, [searchParams]);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);

  // Sync with searchParams if url updates
  useEffect(() => {
    setSelectedCourseId(initialCourseId);
  }, [initialCourseId]);

  const [distribution, setDistribution] = useState([]);
  const [questionAvgs, setQuestionAvgs] = useState([]);
  const [coursePerf, setCoursePerf] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load courses list once
  useEffect(() => {
    facultyService.getCourses()
      .then((res) => { if (res.data.success) setCourses(res.data.data); })
      .catch(() => {});
  }, []);

  // Load analytics whenever the selected course changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    const cid = selectedCourseId || null;

    Promise.all([
      facultyService.getRatingDistribution(cid),
      facultyService.getQuestionAverages(cid),
      facultyService.getCoursePerformance(),
      facultyService.getSemesterTrends()
    ])
      .then(([distRes, qRes, perfRes, trendRes]) => {
        setDistribution(distRes.data.data);
        setQuestionAvgs(qRes.data.data);
        setCoursePerf(perfRes.data.data);
        setTrends(trendRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const hasDistData = distribution.some((d) => d.count > 0);
  const hasQData = questionAvgs.length > 0;
  const hasPerfData = coursePerf.length > 0;
  const hasTrendData = trends.length > 0;

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Analytics Dashboard</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Filter by course or view across all courses</p>
          </div>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value || null)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white min-w-48"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <PageSpinner label="Computing analytics graphs..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <div className="space-y-6">
            {/* CHART 1: Rating Distribution */}
            <SectionCard title="Chart 1 — Rating Distribution (1★ to 5★)">
              {!hasDistData ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} responses`, 'Count']} labelFormatter={(l) => `Rating ${l}★`} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Responses">
                      {distribution.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* CHART 2: Question-wise performance radar */}
            <SectionCard title="Chart 2 — Question-wise Average Ratings">
              {!hasQData ? <EmptyChart /> : (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={questionAvgs.map((q) => ({
                      subject: q.questionText
                        ? (q.questionText.length > 40 ? q.questionText.slice(0, 40) + '…' : q.questionText)
                        : 'Unknown',
                      avg: q.avgRating
                    }))}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                      <Radar name="Avg Rating" dataKey="avg" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
                      <Tooltip formatter={(v) => [`${v}`, 'Avg Rating']} />
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* Ranked list below the chart */}
                  <div className="divide-y text-[11px]">
                    {[...questionAvgs].sort((a, b) => b.avgRating - a.avgRating).map((q, i) => (
                      <div key={q.questionId} className="py-2 flex justify-between items-center gap-4">
                        <span className="text-slate-700 flex-1 leading-snug">{i + 1}. {q.questionText}</span>
                        <span className={`font-black w-10 text-right ${q.avgRating >= 4 ? 'text-emerald-700' : q.avgRating >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {q.avgRating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* CHART 3: Course comparison */}
            <SectionCard title="Chart 3 — Course Performance Comparison">
              {!hasPerfData ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={coursePerf} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="courseCode" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip formatter={(v) => [`${v}`, 'Avg Rating']} />
                    <Bar dataKey="avgRating" radius={[0, 4, 4, 0]} name="Avg Rating">
                      {coursePerf.map((_, i) => <Cell key={i} fill={COURSE_COLORS[i % COURSE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* CHART 4: Semester trends */}
            <SectionCard title="Chart 4 — Semester Rating Trends">
              {!hasTrendData || trends.length < 2 ? (
                <EmptyChart message="Need at least 2 semesters of data to show a trend." />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}`, 'Avg Rating']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="avgRating" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Avg Rating" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* CHART 5: Overall score card */}
            <SectionCard title="Chart 5 — Consolidated Score Summary" minHeight={80}>
              {!hasDistData ? <EmptyChart message="No ratings received yet." /> : (() => {
                const total = distribution.reduce((s, d) => s + d.count, 0);
                const sum = distribution.reduce((s, d) => s + d.rating * d.count, 0);
                const avg = total > 0 ? (sum / total).toFixed(2) : 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
                      <span className="block text-2xl font-black text-violet-700">{avg}</span>
                      <span className="text-[10px] text-violet-600 font-bold">Overall Avg</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                      <span className="block text-2xl font-black text-emerald-700">{total}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Total Ratings</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <span className="block text-2xl font-black text-blue-700">
                        {distribution.find((d) => d.rating === 5)?.count || 0}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">Excellent (5★)</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                      <span className="block text-2xl font-black text-amber-700">
                        {total > 0 ? `${Math.round(((distribution.filter((d) => d.rating >= 4).reduce((s, d) => s + d.count, 0)) / total) * 100)}%` : '—'}
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold">Rated 4★ or 5★</span>
                    </div>
                  </div>
                );
              })()}
            </SectionCard>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

export default FacultyAnalytics;
