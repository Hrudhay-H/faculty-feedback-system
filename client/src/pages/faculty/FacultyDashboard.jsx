import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import FacultyLayout from '../../components/layout/FacultyLayout';
import facultyService from '../../services/facultyService';
import { PageSpinner, ErrorAlert, EmptyState } from '../../components/ui';


const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function RatingGauge({ value }) {
  const data = [{ name: 'Rating', value: (value / 5) * 100 }];
  return (
    <ResponsiveContainer width="100%" height={140}>
      <RadialBarChart
        cx="50%"
        cy="70%"
        innerRadius="70%"
        outerRadius="100%"
        startAngle={180}
        endAngle={0}
        data={data}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" fill="#7c3aed" background={{ fill: '#ede9fe' }} cornerRadius={8} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

function FacultyDashboard() {
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, distRes, trendRes] = await Promise.all([
          facultyService.getSummary(),
          facultyService.getRatingDistribution(),
          facultyService.getSemesterTrends()
        ]);
        setSummary(sumRes.data.data);
        setDistribution(distRes.data.data);
        setTrends(trendRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <FacultyLayout>
      <PageSpinner label="Fetching dashboard analytics..." />
    </FacultyLayout>
  );

  if (error) return (
    <FacultyLayout>
      <ErrorAlert message={error} />
    </FacultyLayout>
  );

  const hasData = summary?.totalResponses > 0;
  const totalDist = distribution.reduce((s, d) => s + d.count, 0);

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Overall Avg Rating', value: hasData ? `${summary.overallAvgRating} / 5.0` : '—', icon: '⭐', color: 'text-violet-700' },
            { label: 'Total Responses', value: summary?.totalResponses ?? 0, icon: '📬', color: 'text-emerald-700' },
            { label: 'Courses Assigned', value: summary?.totalCoursesAssigned ?? 0, icon: '📚', color: 'text-blue-700' }
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                <span className={`text-2xl font-black block mt-1 ${card.color}`}>{card.value}</span>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          ))}
        </div>

        {summary?.totalCoursesAssigned === 0 ? (
          <EmptyState
            icon="📚"
            title="No courses assigned"
            description="You have not been assigned to instruct any courses for this academic semester. Please contact the administration."
          />
        ) : !hasData ? (
          <EmptyState
            icon="📭"
            title="No feedback received yet"
            description="Charts and metrics will appear once students submit evaluations for your courses."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall rating gauge */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Overall Rating Score</h3>
              <RatingGauge value={summary.overallAvgRating} />
              <p className="text-center text-2xl font-black text-violet-700">{summary.overallAvgRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span></p>
            </div>

            {/* Rating distribution bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Rating Distribution</h3>
              {totalDist === 0 ? (
                <p className="text-xs text-slate-400 pt-8 text-center">No rating data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={distribution} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} responses`, 'Count']} labelFormatter={(l) => `Rating ${l}`} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribution.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Semester trend */}
            {trends.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 lg:col-span-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Semester Rating Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trends} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}`, 'Avg Rating']} />
                    <Bar dataKey="avgRating" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'View All Courses', sub: 'Per-course response breakdown', path: '/faculty/courses', icon: '📚' },
            { label: 'Deep Analytics', sub: 'Question-wise & course comparison', path: '/faculty/analytics', icon: '📈' },
            { label: 'Student Comments', sub: 'Anonymized qualitative feedback', path: '/faculty/comments', icon: '💬' }
          ].map((item) => (
            <Link key={item.label} to={item.path}
              className="bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-xl p-4 flex flex-col space-y-1 transition-colors">
              <span className="text-lg">{item.icon}</span>
              <span className="font-bold text-xs text-slate-800">{item.label}</span>
              <span className="text-[10px] text-slate-400">{item.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </FacultyLayout>
  );
}

export default FacultyDashboard;
