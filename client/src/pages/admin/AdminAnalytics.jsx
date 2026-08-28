import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import AdminLayout from '../../components/Layout/AdminLayout';
import adminService from '../../services/adminService';

// ─── Design tokens ───────────────────────────────────────────────────────────
const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const PALETTE = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#be185d'];

// ─── Reusable sub-components ─────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, minH = 220 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ minHeight: minH }}>{children}</div>
    </div>
  );
}

function EmptyState({ message = 'No data available for the selected filters.', minHeight = '200px' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400 w-full animate-fade-in" style={{ minHeight }}>
      <span className="text-4xl">📊</span>
      <p className="text-xs font-semibold text-center max-w-xs">{message}</p>
    </div>
  );
}


function Spinner() {
  return (
    <div className="h-56 flex items-center justify-center">
      <svg className="animate-spin h-7 w-7 text-slate-700" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}

function RatingBadge({ value }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  const color = value >= 4 ? 'text-emerald-700' : value >= 3 ? 'text-amber-600' : 'text-rose-600';
  return <span className={`font-black text-sm ${color}`}>{value}</span>;
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ options, filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value || null });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filters:</span>

        <select value={filters.semester || ''} onChange={set('semester')}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white">
          <option value="">All Semesters</option>
          {options.semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filters.department || ''} onChange={set('department')}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white">
          <option value="">All Departments</option>
          {options.departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filters.facultyId || ''} onChange={set('facultyId')}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white min-w-48">
          <option value="">All Faculty</option>
          {options.faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <select value={filters.courseId || ''} onChange={set('courseId')}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white min-w-48">
          <option value="">All Courses</option>
          {options.courses.map((c) => (
            <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
          ))}
        </select>

        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => onChange({ semester: null, department: null, facultyId: null, courseId: null })}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 border border-rose-200 rounded-lg px-3 py-2 transition-colors"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminAnalytics() {
  const [filterOptions, setFilterOptions] = useState({ semesters: [], departments: [], faculty: [], courses: [] });
  const [filters, setFilters] = useState({ semester: null, department: null, facultyId: null, courseId: null });

  const [headline, setHeadline] = useState(null);
  const [trends, setTrends] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyPerf, setFacultyPerf] = useState([]);
  const [coursePerf, setCoursePerf] = useState([]);
  const [distribution, setDistribution] = useState([]);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Load filter options once
  useEffect(() => {
    adminService.getAnalyticsFilterOptions()
      .then((res) => { if (res.data.success) setFilterOptions(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingFilters(false));
  }, []);

  // Load all analytics data whenever filters change
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    // Build clean params (remove nulls)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

    try {
      const [headRes, trendRes, deptRes, facRes, crsRes, distRes] = await Promise.all([
        adminService.getAnalyticsHeadline(),
        adminService.getAnalyticsTrends(params),
        adminService.getAnalyticsDepartments(params),
        adminService.getAnalyticsFaculty(params),
        adminService.getAnalyticsCourses(params),
        adminService.getAnalyticsDistribution(params)
      ]);
      setHeadline(headRes.data.data);
      setTrends(trendRes.data.data);
      setDepartments(deptRes.data.data);
      setFacultyPerf(facRes.data.data);
      setCoursePerf(crsRes.data.data);
      setDistribution(distRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analytics');
    } finally {
      setLoadingData(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasDistData = distribution.some((d) => d.count > 0);
  const hasTrendData = trends.length > 0;
  const hasDeptData = departments.length > 0;
  const hasFacData = facultyPerf.length > 0;
  const hasCrsData = coursePerf.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-base font-extrabold text-slate-900">System-wide Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated feedback intelligence across all departments, faculty, and courses.</p>
        </div>

        {/* Filter bar */}
        {!loadingFilters && (
          <FilterBar options={filterOptions} filters={filters} onChange={setFilters} />
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs">{error}</div>
        )}

        {/* ── KPI Strip ── */}
        {headline && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Students', value: headline.totalStudents, icon: '🎓', color: 'text-blue-700 bg-blue-50' },
              { label: 'Faculty', value: headline.totalFaculty, icon: '👨‍🏫', color: 'text-violet-700 bg-violet-50' },
              { label: 'Courses', value: headline.totalCourses, icon: '📚', color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Submissions', value: headline.totalFeedback, icon: '📬', color: 'text-cyan-700 bg-cyan-50' },
              { label: 'Enrollments', value: headline.totalEnrollments, icon: '📋', color: 'text-orange-700 bg-orange-50' },
              { label: 'Completion', value: `${headline.completionRate}%`, icon: '📈', color: 'text-rose-700 bg-rose-50' }
            ].map((kpi) => (
              <div key={kpi.label} className={`rounded-xl border p-4 text-center ${kpi.color.split(' ')[1]} border-opacity-50`} style={{ borderColor: 'currentColor', borderWidth: 1 }}>
                <span className="text-base block">{kpi.icon}</span>
                <span className={`block text-xl font-black mt-1 ${kpi.color.split(' ')[0]}`}>{kpi.value}</span>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{kpi.label}</span>
              </div>
            ))}
          </div>
        )}

        {loadingData ? <Spinner /> : (
          <div className="space-y-6">
            {/* ── CHART 1: Rating Distribution ── */}
            <SectionCard
              title="Rating Distribution (System-wide)"
              subtitle="Count of all individual ratings from 1★ to 5★"
            >
              {!hasDistData ? <EmptyState minHeight="220px" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} ratings`, 'Count']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribution.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* ── CHART 2: Semester Trend ── */}
            <SectionCard
              title="Semester Rating Trend"
              subtitle="Average rating and submission count across semesters"
            >
              {!hasTrendData ? <EmptyState message="No semester data for selected filters." minHeight="220px" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trends} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 11 }} label={{ value: 'Avg', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 9 } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Submissions', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: 9 } }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="left" type="monotone" dataKey="avgRating" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} name="Avg Rating" />
                    <Line yAxisId="right" type="monotone" dataKey="submissions" stroke="#0891b2" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* ── CHART 3: Department Averages ── */}
            <SectionCard
              title="Department Performance"
              subtitle="Average rating grouped by academic department"
            >
              {!hasDeptData ? <EmptyState message="No department data for selected filters." minHeight="220px" /> : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={Math.max(180, departments.length * 48)}>
                    <BarChart data={departments} layout="vertical" margin={{ top: 4, right: 48, left: 120, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} />
                      <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={115} />
                      <Tooltip formatter={(v) => [`${v}`, 'Avg Rating']} />
                      <Bar dataKey="avgRating" radius={[0, 4, 4, 0]}>
                        {departments.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Summary table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="px-4 py-2.5 text-left">Department</th>
                          <th className="px-4 py-2.5 text-right">Avg Rating</th>
                          <th className="px-4 py-2.5 text-right">Submissions</th>
                          <th className="px-4 py-2.5 text-right">Faculty Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {departments.map((d, i) => (
                          <tr key={d.department || i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-semibold text-slate-800">{d.department}</td>
                            <td className="px-4 py-2.5 text-right"><RatingBadge value={d.avgRating} /></td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{d.submissions}</td>
                            <td className="px-4 py-2.5 text-right text-slate-500">{d.facultyCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── CHART 4: Faculty Performance ── */}
            <SectionCard
              title="Faculty Performance Leaderboard"
              subtitle="Ranked by average rating. Only name and department shown — no email or contact info."
            >
              {!hasFacData ? <EmptyState message="No faculty performance data for selected filters." minHeight="220px" /> : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={Math.max(160, facultyPerf.length * 44)}>
                    <BarChart data={facultyPerf} layout="vertical" margin={{ top: 4, right: 48, left: 140, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={135} />
                      <Tooltip
                        formatter={(v, n, p) => [`${v} ★`, 'Avg Rating']}
                        labelFormatter={(l) => `${l}`}
                      />
                      <Bar dataKey="avgRating" radius={[0, 4, 4, 0]}>
                        {facultyPerf.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="px-4 py-2.5 text-left">Rank</th>
                          <th className="px-4 py-2.5 text-left">Faculty Name</th>
                          <th className="px-4 py-2.5 text-left">Department</th>
                          <th className="px-4 py-2.5 text-right">Avg Rating</th>
                          <th className="px-4 py-2.5 text-right">Submissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facultyPerf.map((f, i) => (
                          <tr key={f.facultyId || i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-black text-slate-400">#{i + 1}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-900">{f.name}</td>
                            <td className="px-4 py-2.5 text-slate-500">{f.department || '—'}</td>
                            <td className="px-4 py-2.5 text-right"><RatingBadge value={f.avgRating} /></td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{f.submissions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── CHART 5: Course Performance ── */}
            <SectionCard
              title="Course Performance & Completion Rates"
              subtitle="Average rating and completion rate per course"
            >
              {!hasCrsData ? <EmptyState message="No course data for selected filters." minHeight="220px" /> : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={Math.max(160, coursePerf.length * 44)}>
                    <BarChart data={coursePerf} layout="vertical" margin={{ top: 4, right: 80, left: 70, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} />
                      <YAxis type="category" dataKey="courseCode" tick={{ fontSize: 11 }} width={65} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const d = coursePerf.find((c) => c.courseCode === label);
                          return (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg space-y-1">
                              <p className="font-bold text-slate-900">{d?.courseName}</p>
                              <p className="text-slate-500">{d?.semester} · {d?.facultyName}</p>
                              <p>Avg Rating: <span className="font-bold text-violet-700">{payload[0]?.value} ★</span></p>
                              <p>Completion: <span className="font-bold text-emerald-700">{d?.completionRate}%</span></p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="avgRating" radius={[0, 4, 4, 0]}>
                        {coursePerf.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="px-4 py-2.5 text-left">Course</th>
                          <th className="px-4 py-2.5 text-left">Semester</th>
                          <th className="px-4 py-2.5 text-left">Faculty</th>
                          <th className="px-4 py-2.5 text-left">Department</th>
                          <th className="px-4 py-2.5 text-right">Avg Rating</th>
                          <th className="px-4 py-2.5 text-right">Enrolled</th>
                          <th className="px-4 py-2.5 text-right">Submissions</th>
                          <th className="px-4 py-2.5 text-right">Completion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coursePerf.map((c, i) => (
                          <tr key={c.courseId || i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5">
                              <span className="font-mono font-bold text-slate-900">{c.courseCode}</span>
                              <span className="block text-[10px] text-slate-400">{c.courseName}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 font-semibold">{c.semester}</td>
                            <td className="px-4 py-2.5 text-slate-600">{c.facultyName || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-400">{c.department || '—'}</td>
                            <td className="px-4 py-2.5 text-right"><RatingBadge value={c.avgRating} /></td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{c.enrollmentCount}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{c.submissions}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`font-bold ${c.completionRate >= 70 ? 'text-emerald-700' : c.completionRate >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {c.completionRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminAnalytics;
