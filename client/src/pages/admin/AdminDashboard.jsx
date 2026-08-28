import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import adminService from '../../services/adminService';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, ResponsiveContainer
} from 'recharts';

const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function KpiCard({ title, value, icon, color, link, sub }) {
  const Tag = link ? Link : 'div';
  return (
    <Tag
      to={link}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow block ${
        link ? 'cursor-pointer hover:border-slate-350' : ''
      }`}
    >
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{title}</span>
        <span className="text-2xl font-black text-slate-900 block">{value !== undefined ? value : '—'}</span>
        {sub && <span className="text-[10px] text-slate-400 block">{sub}</span>}
        {link && (
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 block pt-1">
            View details →
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white ${color}`}>
        {icon}
      </div>
    </Tag>
  );
}

function AdminDashboard() {
  const [headline, setHeadline] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [headRes, distRes] = await Promise.all([
          adminService.getAnalyticsHeadline(),
          adminService.getAnalyticsDistribution()
        ]);
        if (headRes.data.success) setHeadline(headRes.data.data);
        if (distRes.data.success) setDistribution(distRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasDistData = distribution.some((d) => d.count > 0);

  return (
    <AdminLayout>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-slate-800" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-sm">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
              <p className="text-xs text-slate-500 mt-1">
                Active Semester:{' '}
                <span className="font-bold text-slate-900">
                  {headline?.activeSemester || 'No active window'}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              {headline?.activeSemester && (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                  ✅ Feedback Window Open
                </span>
              )}
              <Link
                to="/admin/analytics"
                className="bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                📊 Analytics →
              </Link>
            </div>
          </div>

          {/* KPI Grid — Row 1: entities */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard title="Registered Students" value={headline?.totalStudents} icon="🎓" color="bg-blue-500" link="/admin/students" />
            <KpiCard title="Instructors" value={headline?.totalFaculty} icon="👨‍🏫" color="bg-violet-500" link="/admin/faculty" />
            <KpiCard title="Courses Configured" value={headline?.totalCourses} icon="📚" color="bg-emerald-500" link="/admin/courses" />
            <KpiCard title="Active Questions" value={headline?.activeQuestions} icon="📝" color="bg-orange-500" link="/admin/questions" />
          </div>

          {/* KPI Grid — Row 2: feedback metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <KpiCard
              title="Total Submissions"
              value={headline?.totalFeedback}
              icon="📬"
              color="bg-cyan-500"
              sub={`out of ${headline?.totalEnrollments ?? 0} enrollments`}
            />
            <KpiCard
              title="Completion Rate"
              value={`${headline?.completionRate ?? 0}%`}
              icon="📈"
              color="bg-rose-500"
              sub="Submissions ÷ Enrollments"
            />
            <KpiCard
              title="Full Analytics"
              value="View Report →"
              icon="🔍"
              color="bg-slate-700"
              link="/admin/analytics"
              sub="Drill down by dept, semester, faculty"
            />
          </div>

          {/* Mini distribution chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">System-wide Rating Distribution</h3>
              <Link to="/admin/analytics" className="text-[10px] font-bold text-slate-500 hover:text-slate-900">
                Full Analytics →
              </Link>
            </div>
            {!hasDistData ? (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">
                No feedback data yet — charts will appear once students submit evaluations.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} ratings`, 'Count']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Quick Administration Tasks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { to: '/admin/students', icon: '🎓', label: 'Register Student', sub: 'Add new student accounts' },
                { to: '/admin/faculty', icon: '👨‍🏫', label: 'Register Faculty', sub: 'Map departments & IDs' },
                { to: '/admin/courses', icon: '📚', label: 'Link Enrollments', sub: 'Associate students to courses' }
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className="border border-slate-200 hover:bg-slate-50 p-4 rounded-lg flex flex-col justify-between text-left transition-colors">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-bold text-xs text-slate-800 block mt-2">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{item.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
