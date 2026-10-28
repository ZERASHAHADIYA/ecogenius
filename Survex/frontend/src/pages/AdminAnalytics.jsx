import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   Chart helpers (pure SVG / CSS – no chart library)
   ───────────────────────────────────────────────────────────────────────── */
function BarChart({ data = [], valueKey, labelKey, color = '#22c55e', height = 140 }) {
  if (!data.length) return <EmptyChart height={height} />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none border border-gray-700">
              {d[labelKey]}: {d[valueKey] || 0}
            </div>
            <div className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${pct}%`, background: color, minHeight: pct > 0 ? 3 : 0 }} />
          </div>
        );
      })}
    </div>
  );
}

function MultiLineChart({ data = [], series = [], height = 160 }) {
  if (!data.length) return <EmptyChart height={height} />;
  const allVals = data.flatMap(d => series.map(s => d[s.key] || 0));
  const max = Math.max(...allVals, 1);
  const w = 100, h = 100;
  const pts = (key) => data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((d[key] || 0) / max) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {series.map((s, si) => (
        <polyline key={si} fill="none" stroke={s.color} strokeWidth="2"
          points={pts(s.key)} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function DonutChart({ segments = [], size = 130, label }) {
  if (!segments.length || segments.every(s => !s.value)) return <EmptyChart height={size} />;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {segments.map((seg, i) => {
        const pct  = (seg.value || 0) / total;
        const dash = pct * circ;
        const gap  = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="20"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${cx} ${cy})`}>
            <title>{seg.label}: {seg.value}</title>
          </circle>
        );
        offset += pct;
        return el;
      })}
      <circle cx={cx} cy={cy} r="26" fill="#111827" />
      {label && (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white" fontSize="12" fontWeight="bold">{label.top}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-500" fontSize="7">{label.bot}</text>
        </>
      )}
    </svg>
  );
}

function HorizontalBar({ label, value, max, color = '#22c55e', icon }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-lg w-6 text-center">{icon}</span>}
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">{label}</span>
          <span className="text-white font-semibold">{value}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ height = 120 }) {
  return <div className="flex items-center justify-center text-gray-600 text-sm" style={{ height }}>No data yet</div>;
}

function StatCard({ icon, label, value, sub, color = 'from-gray-900/80 to-gray-800/60', border = 'border-gray-700/40', trend }) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
          }`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function Section({ title, icon, children, action }) {
  return (
    <div className="bg-gray-900/70 backdrop-blur border border-gray-800/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>{icon}</span>{title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Mock data factories
   ───────────────────────────────────────────────────────────────────────── */
function buildMockOverview() {
  return {
    users:       { total_users: 162, total_students: 158, active_students: 94, new_this_month: 18, user_growth_pct: 12.5, participation_rate: 59.5 },
    challenges:  { total_challenges: 12, active_challenges: 9, total_joins: 287, completed_joins: 183, completion_rate: 63.8 },
    submissions: { total: 214, pending: 23, approved: 178, rejected: 13, approval_rate: 83.2, avg_review_hours: 8.4 },
    posts:       { total: 312, challenge_posts: 198, general_posts: 114 },
    points:      {
      total_awarded: 14250, avg_per_student: 90.2,
      badge_distribution: {
        '🌱 Green Beginner': 158, '🌿 Eco Learner': 72,
        '🌾 Sustainability Hero': 34, '🌳 Eco-Champion': 12, '🏅 Legend': 3
      }
    }
  };
}

function buildMockEngagement() {
  return {
    recent_activity:  { weekly_posts: 42, weekly_submissions: 31, weekly_joins: 19 },
    monthly_growth:   { monthly_posts: 167, monthly_submissions: 98, monthly_joins: 73 },
    most_active_users: [
      { name: 'Priya Sharma',    department: 'Environmental Science', eco_points: 320, submissions: 12 },
      { name: 'Rahul Kumar',     department: 'Computer Science',      eco_points: 285, submissions: 9 },
      { name: 'Anita Patel',     department: 'Business Administration', eco_points: 250, submissions: 7 },
      { name: 'Vikram Nair',     department: 'Mechanical Engineering', eco_points: 210, submissions: 6 },
      { name: 'Meera Krishnan',  department: 'Civil Engineering',      eco_points: 195, submissions: 5 },
    ],
    category_participation: [
      { category: 'Waste Management',        icon: '🗑️', participation_count: 87, completion_count: 61, completion_rate: 70.1 },
      { category: 'Energy Conservation',     icon: '⚡', participation_count: 72, completion_count: 49, completion_rate: 68.1 },
      { category: 'Green Campus Activities', icon: '🌳', participation_count: 65, completion_count: 38, completion_rate: 58.5 },
      { category: 'Water Conservation',      icon: '💧', participation_count: 48, completion_count: 22, completion_rate: 45.8 },
      { category: 'Sustainable Mobility',    icon: '🚲', participation_count: 15, completion_count:  9, completion_rate: 60.0 },
    ]
  };
}

function buildMockTimeline() {
  const days = 30;
  const data = { daily_posts: [], daily_submissions: [], daily_joins: [], daily_new_users: [] };
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    data.daily_posts.push({ _id: d, posts: Math.floor(Math.random() * 15) + 2 });
    data.daily_submissions.push({ _id: d, submissions: Math.floor(Math.random() * 8) + 1 });
    data.daily_joins.push({ _id: d, joins: Math.floor(Math.random() * 6) });
    data.daily_new_users.push({ _id: d, new_users: Math.floor(Math.random() * 3) });
  }
  return data;
}

function buildMockWorkload() {
  return {
    pending_count: 23,
    overdue_count: 4,
    pending_items: [
      { _id: 'w1', student_name: 'Vikram Nair',    challenge_title: 'Plastic-Free Week',    submitted_at: new Date(Date.now()-3*86400000).toISOString(), age_hours: 72.1, overdue: true },
      { _id: 'w2', student_name: 'Meera Krishnan', challenge_title: 'Energy Conservation',  submitted_at: new Date(Date.now()-1*86400000).toISOString(), age_hours: 26.5, overdue: false },
      { _id: 'w3', student_name: 'Arjun Menon',    challenge_title: 'Campus Tree Planting', submitted_at: new Date(Date.now()-2*86400000).toISOString(), age_hours: 49.2, overdue: true },
      { _id: 'w4', student_name: 'Divya Rajan',    challenge_title: 'Water Saver',          submitted_at: new Date(Date.now()-0.5*86400000).toISOString(), age_hours: 12, overdue: false },
    ],
    review_time_stats: { avg_hours: 8.4, median_hours: 6.2, p90_hours: 22.1, total_reviewed: 191 }
  };
}

function buildMockDeptStats() {
  return {
    top_performers: [
      { name: 'Priya Sharma',   department: 'Environmental Science', eco_points: 320, challenges_completed: 8 },
      { name: 'Rahul Kumar',    department: 'Computer Science',      eco_points: 285, challenges_completed: 6 },
      { name: 'Anita Patel',    department: 'Business Administration', eco_points: 250, challenges_completed: 5 },
      { name: 'Vikram Nair',    department: 'Mechanical Engineering', eco_points: 210, challenges_completed: 4 },
      { name: 'Meera Krishnan', department: 'Civil Engineering',      eco_points: 195, challenges_completed: 3 },
    ],
    department_performance: [
      { _id: 'Environmental Science',    student_count: 28, total_points: 4200, avg_points: 150, total_completed: 52 },
      { _id: 'Computer Science',         student_count: 42, total_points: 5040, avg_points: 120, total_completed: 63 },
      { _id: 'Business Administration',  student_count: 34, total_points: 3060, avg_points: 90,  total_completed: 38 },
      { _id: 'Mechanical Engineering',   student_count: 31, total_points: 2480, avg_points: 80,  total_completed: 31 },
      { _id: 'Civil Engineering',        student_count: 23, total_points: 1610, avg_points: 70,  total_completed: 20 },
    ]
  };
}

const DEPT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];
const CAT_COLORS  = ['#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#06b6d4', '#ef4444', '#84cc16'];

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN ANALYTICS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function AdminAnalytics({ user, onNavigate, submissions: propSubs = [] }) {
  const [overview,     setOverview]     = useState(null);
  const [engagement,   setEngagement]   = useState(null);
  const [timeline,     setTimeline]     = useState(null);
  const [workload,     setWorkload]     = useState(null);
  const [deptStats,    setDeptStats]    = useState(null);
  const [aiMetrics,    setAiMetrics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [timeRange,    setTimeRange]    = useState(30);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, eng, tl, wl, ds, ai] = await Promise.allSettled([
        fetch('/api/analytics/overview',          { headers }).then(r => r.json()),
        fetch('/api/analytics/engagement',         { headers }).then(r => r.json()),
        fetch(`/api/analytics/timeline?days=${timeRange}`, { headers }).then(r => r.json()),
        fetch('/api/analytics/submission-workload',{ headers }).then(r => r.json()),
        fetch('/api/analytics/leaderboard-stats',  { headers }).then(r => r.json()),
        fetch('/api/analytics/ai-verification',    { headers }).then(r => r.json()),
      ]);
      setOverview(ov.value?.analytics       || buildMockOverview());
      setEngagement(eng.value?.engagement   || buildMockEngagement());
      setTimeline(tl.value?.timeline_analytics || buildMockTimeline());
      setWorkload(wl.value?.workload         || buildMockWorkload());
      setDeptStats(ds.value?.leaderboard_stats || buildMockDeptStats());
      setAiMetrics(ai.value?.ai_verification || { available: false });
    } catch {
      setOverview(buildMockOverview());
      setEngagement(buildMockEngagement());
      setTimeline(buildMockTimeline());
      setWorkload(buildMockWorkload());
      setDeptStats(buildMockDeptStats());
      setAiMetrics({ available: false });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <LoadingScreen />;

  const o  = overview    || {};
  const e  = engagement  || {};
  const tl = timeline    || {};
  const wl = workload    || {};
  const ds = deptStats   || {};

  /* pending count: prefer backend, fall back to propSubs */
  const pendingCount = o.submissions?.pending ??
    propSubs.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('admin-dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            ←
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Admin Analytics</div>
            <div className="text-gray-500 text-xs">Platform-wide insights</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Pending badge */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/40 border border-amber-700/50 rounded-lg text-amber-300 text-sm">
              <span className="animate-pulse w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {pendingCount} pending
            </div>
          )}
          <button onClick={fetchAll}
            className="text-xs text-gray-400 hover:text-violet-400 flex items-center gap-1 transition-colors">
            🔄 Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-gray-900/60 border border-violet-800/30 p-8">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 60%)'
          }} />
          <div className="relative grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', label: 'Total Students', value: o.users?.total_students, sub: `${o.users?.active_students} active` },
              { icon: '🏆', label: 'Challenges',    value: o.challenges?.total_challenges, sub: `${o.challenges?.active_challenges} active` },
              { icon: '📮', label: 'Submissions',   value: o.submissions?.total, sub: `${o.submissions?.approval_rate}% approved` },
              { icon: '⭐', label: 'Points Awarded', value: (o.points?.total_awarded || 0).toLocaleString(), sub: `avg ${o.points?.avg_per_student}/student` },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-4xl font-black text-white">{s.value ?? '—'}</div>
                <div className="text-gray-400 text-sm mt-1">{s.label}</div>
                <div className="text-gray-600 text-xs">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'overview',     label: '📊 Overview' },
            { id: 'users',        label: '👥 Users & Departments' },
            { id: 'challenges',   label: '🏆 Challenges' },
            { id: 'submissions',  label: '📋 Submissions' },
            { id: 'timeline',     label: '📈 Timeline' },
            { id: 'workload',     label: '⏱️ Review Workload' },
            { id: 'ai',           label: '🤖 AI Verification' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Registered Users"   value={o.users?.total_students}   sub="Students"             color="from-blue-900/40 to-indigo-900/30"   border="border-blue-800/40"   trend={o.users?.user_growth_pct} />
              <StatCard icon="✅" label="Active Users"       value={o.users?.active_students}  sub={`${o.users?.participation_rate}% of total`} />
              <StatCard icon="🆕" label="New This Month"     value={o.users?.new_this_month}   sub="New registrations"    color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
              <StatCard icon="🎯" label="Completion Rate"    value={`${o.challenges?.completion_rate}%`} sub="Challenges completed" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="📮" label="Pending Reviews"   value={o.submissions?.pending}    sub="Needs attention"  color="from-amber-900/40 to-yellow-900/30" border="border-amber-700/40" />
              <StatCard icon="⏱️" label="Avg Review Time"   value={`${o.submissions?.avg_review_hours}h`} sub="Per submission" />
              <StatCard icon="✅" label="Approval Rate"     value={`${o.submissions?.approval_rate}%`} sub="Submissions approved" color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
              <StatCard icon="📝" label="Total Posts"       value={o.posts?.total}            sub={`${o.posts?.challenge_posts} challenge posts`} />
            </div>

            {/* Weekly quick stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📅', label: 'Weekly Posts',       value: e.recent_activity?.weekly_posts,       color: '#3b82f6' },
                { icon: '📮', label: 'Weekly Submissions',  value: e.recent_activity?.weekly_submissions, color: '#22c55e' },
                { icon: '🎯', label: 'Weekly Joins',        value: e.recent_activity?.weekly_joins,       color: '#a855f7' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800/40 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: s.color + '22' }}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{s.value ?? '—'}</div>
                    <div className="text-gray-500 text-sm">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Badge distribution */}
            <Section title="Badge Distribution" icon="🎖️">
              <div className="space-y-3">
                {Object.entries(o.points?.badge_distribution || {}).map(([badge, count], i) => (
                  <HorizontalBar key={i} label={badge} value={count}
                    max={Math.max(...Object.values(o.points?.badge_distribution || {}))}
                    color={DEPT_COLORS[i % DEPT_COLORS.length]} icon="" />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── USERS & DEPARTMENTS TAB ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Top performers */}
            <Section title="Top Performers" icon="🏅">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left pb-3 pr-4">Rank</th>
                      <th className="text-left pb-3 pr-4">Student</th>
                      <th className="text-left pb-3 pr-4">Department</th>
                      <th className="text-right pb-3 pr-4">Eco Points</th>
                      <th className="text-right pb-3">Challenges Done</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {(ds.top_performers || []).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-800/20">
                        <td className="py-3 pr-4">
                          <span className={`font-bold text-lg ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-white">{p.name}</td>
                        <td className="py-3 pr-4 text-gray-400">{p.department}</td>
                        <td className="py-3 pr-4 text-right text-green-400 font-semibold">{p.eco_points}</td>
                        <td className="py-3 text-right text-gray-300">{p.challenges_completed ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Department performance */}
            <Section title="Department-wise Participation" icon="🏫">
              <div className="space-y-4">
                {(ds.department_performance || []).map((dept, i) => {
                  const maxPts = Math.max(...(ds.department_performance || []).map(d => d.avg_points || 0), 1);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-medium">{dept._id || 'Unknown'}</span>
                        <div className="flex gap-4 text-gray-400">
                          <span>{dept.student_count} students</span>
                          <span className="text-green-400 font-semibold">{Math.round(dept.avg_points || 0)} avg pts</span>
                          <span>{dept.total_completed || 0} completed</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${((dept.avg_points || 0) / maxPts) * 100}%`,
                            background: DEPT_COLORS[i % DEPT_COLORS.length]
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Most active users */}
            <Section title="Most Active Users (Last 30 Days)" icon="🔥">
              <div className="space-y-3">
                {(e.most_active_users || []).map((u, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {(u.name || '?')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{u.name}</div>
                      <div className="text-gray-500 text-xs">{u.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">{u.eco_points} pts</div>
                      <div className="text-gray-500 text-xs">{u.submissions} submissions</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── CHALLENGES TAB ── */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category participation donut */}
              <Section title="Category Participation" icon="📂">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <DonutChart size={150}
                    segments={(e.category_participation || []).map((c, i) => ({
                      label: c.category, value: c.participation_count,
                      color: CAT_COLORS[i % CAT_COLORS.length]
                    }))} />
                  <div className="space-y-2 flex-1">
                    {(e.category_participation || []).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="text-gray-300 flex-1">{c.icon} {c.category}</span>
                        <span className="text-white font-semibold">{c.participation_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Completion rates */}
              <Section title="Completion Rate by Category" icon="✅">
                <div className="space-y-3">
                  {(e.category_participation || []).map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{c.icon} {c.category}</span>
                        <span className="text-white font-semibold">{c.completion_rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${c.completion_rate}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                      <div className="text-xs text-gray-600">{c.completion_count}/{c.participation_count} completed</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="🎯" label="Total Challenges"  value={o.challenges?.total_challenges}  sub="All time" />
              <StatCard icon="🟢" label="Active Challenges" value={o.challenges?.active_challenges} sub="Currently live" color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
              <StatCard icon="🤝" label="Total Joins"       value={o.challenges?.total_joins}       sub="Participations" />
              <StatCard icon="🏁" label="Completions"       value={o.challenges?.completed_joins}   sub={`${o.challenges?.completion_rate}% rate`} color="from-blue-900/40 to-indigo-900/30" border="border-blue-800/40" />
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="📮" label="Total"    value={o.submissions?.total}   sub="All submissions" />
              <StatCard icon="✅" label="Approved" value={o.submissions?.approved} sub={`${o.submissions?.approval_rate}%`} color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
              <StatCard icon="❌" label="Rejected" value={o.submissions?.rejected} sub="Rejected"         color="from-red-900/40 to-rose-900/30" border="border-red-800/40" />
              <StatCard icon="⏳" label="Pending"  value={o.submissions?.pending}  sub="Needs review"     color="from-amber-900/40 to-yellow-900/30" border="border-amber-700/40" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Section title="Submission Breakdown" icon="📊">
                <div className="flex items-center gap-8">
                  <DonutChart size={140}
                    segments={[
                      { label: 'Approved', value: o.submissions?.approved, color: '#22c55e' },
                      { label: 'Pending',  value: o.submissions?.pending,  color: '#f59e0b' },
                      { label: 'Rejected', value: o.submissions?.rejected, color: '#ef4444' },
                    ]}
                    label={{ top: `${o.submissions?.approval_rate}%`, bot: 'approved' }} />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"/>Approved: <b className="text-white ml-1">{o.submissions?.approved}</b></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"/>Pending:  <b className="text-white ml-1">{o.submissions?.pending}</b></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"/>Rejected: <b className="text-white ml-1">{o.submissions?.rejected}</b></div>
                  </div>
                </div>
              </Section>

              <Section title="Review Time Metrics" icon="⏱️">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Avg',    value: `${wl.review_time_stats?.avg_hours}h` },
                    { label: 'Median', value: `${wl.review_time_stats?.median_hours}h` },
                    { label: 'P90',    value: `${wl.review_time_stats?.p90_hours}h` },
                  ].map((m, i) => (
                    <div key={i} className="bg-gray-800/40 rounded-xl p-4">
                      <div className="text-2xl font-bold text-violet-400">{m.value}</div>
                      <div className="text-gray-500 text-xs mt-1">{m.label} review time</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-gray-600 text-xs">
                  Based on {wl.review_time_stats?.total_reviewed || 0} reviewed submissions
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Time range selector */}
            <div className="flex gap-2">
              {[7, 14, 30, 60].map(d => (
                <button key={d} onClick={() => setTimeRange(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    timeRange === d
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}>
                  {d}d
                </button>
              ))}
            </div>

            <Section title="Daily Posts" icon="📝">
              <BarChart data={tl.daily_posts || []} valueKey="posts" labelKey="_id" color="#3b82f6" height={130} />
            </Section>

            <Section title="Daily Submissions" icon="📮">
              <BarChart data={tl.daily_submissions || []} valueKey="submissions" labelKey="_id" color="#22c55e" height={130} />
            </Section>

            <div className="grid md:grid-cols-2 gap-6">
              <Section title="Daily Challenge Joins" icon="🎯">
                <BarChart data={tl.daily_joins || []} valueKey="joins" labelKey="_id" color="#a855f7" height={100} />
              </Section>
              <Section title="Daily New Registrations" icon="👤">
                <BarChart data={tl.daily_new_users || []} valueKey="new_users" labelKey="_id" color="#f59e0b" height={100} />
              </Section>
            </div>
          </div>
        )}

        {/* ── WORKLOAD TAB ── */}
        {activeTab === 'workload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="📋" label="Pending Reviews" value={wl.pending_count}         sub="Need attention"     color="from-amber-900/40 to-yellow-900/30" border="border-amber-700/40" />
              <StatCard icon="🚨" label="Overdue (>48h)"  value={wl.overdue_count}         sub="Past deadline"      color="from-red-900/40 to-rose-900/30" border="border-red-800/40" />
              <StatCard icon="⏱️" label="Avg Review Time" value={`${wl.review_time_stats?.avg_hours}h`} sub="Average" />
              <StatCard icon="📊" label="Total Reviewed"  value={wl.review_time_stats?.total_reviewed} sub="All time" color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
            </div>

            <Section title="Pending Submission Queue" icon="📋"
              action={
                <span className="text-xs text-gray-500">Sorted by oldest first</span>
              }>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left pb-3 pr-4">Student</th>
                      <th className="text-left pb-3 pr-4">Challenge</th>
                      <th className="text-left pb-3 pr-4">Submitted</th>
                      <th className="text-left pb-3 pr-4">Age</th>
                      <th className="text-left pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {(wl.pending_items || []).map((item, i) => (
                      <tr key={i} className={`hover:bg-gray-800/20 ${item.overdue ? 'bg-red-900/5' : ''}`}>
                        <td className="py-3 pr-4 text-white font-medium">{item.student_name}</td>
                        <td className="py-3 pr-4 text-gray-300">{item.challenge_title}</td>
                        <td className="py-3 pr-4 text-gray-500">
                          {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 pr-4 font-semibold" style={{ color: item.overdue ? '#f87171' : '#a3e635' }}>
                          {item.age_hours}h
                        </td>
                        <td className="py-3">
                          {item.overdue
                            ? <span className="px-2 py-1 bg-red-900/40 text-red-400 border border-red-700/50 rounded-lg text-xs">Overdue</span>
                            : <span className="px-2 py-1 bg-amber-900/40 text-amber-400 border border-amber-700/50 rounded-lg text-xs">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {(!wl.pending_items || !wl.pending_items.length) && (
                      <tr><td colSpan={5} className="text-center py-8 text-green-400">🎉 No pending reviews!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {/* ── AI VERIFICATION TAB ── */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {aiMetrics?.available ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="🤖" label="Total AI Reviewed"   value={aiMetrics.metrics?.total_reviewed}  sub="All time" />
                  <StatCard icon="✅" label="Auto-Approved"        value={aiMetrics.metrics?.auto_approved}   sub="No human needed" color="from-green-900/40 to-emerald-900/30" border="border-green-800/40" />
                  <StatCard icon="❌" label="Auto-Rejected"        value={aiMetrics.metrics?.auto_rejected}   sub="Declined by AI" color="from-red-900/40 to-rose-900/30" border="border-red-800/40" />
                  <StatCard icon="👁️" label="Escalated to Human" value={aiMetrics.metrics?.escalated_to_human} sub="Manual review" color="from-amber-900/40 to-yellow-900/30" border="border-amber-700/40" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Precision', value: `${aiMetrics.metrics?.precision}%`, desc: 'Of AI approvals that were correct', color: '#22c55e' },
                    { label: 'Recall',    value: `${aiMetrics.metrics?.recall}%`,    desc: 'Of valid submissions correctly approved', color: '#3b82f6' },
                    { label: 'False Approval Rate', value: `${aiMetrics.metrics?.false_approval_rate}%`, desc: 'Incorrectly approved by AI', color: '#ef4444' },
                  ].map((m, i) => (
                    <div key={i} className="bg-gray-900/70 border border-gray-800/60 rounded-2xl p-6 text-center">
                      <div className="text-4xl font-black mb-2" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-white font-semibold text-sm">{m.label}</div>
                      <div className="text-gray-500 text-xs mt-1">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800/40 rounded-2xl p-12 text-center">
                <div className="text-7xl mb-6">🤖</div>
                <h3 className="text-white text-2xl font-bold mb-3">AI Verification Module</h3>
                <p className="text-gray-400 max-w-lg mx-auto mb-6">
                  {aiMetrics?.message ||
                    "AI verification is not yet active. Once enabled, you'll see precision, recall, false approval rates, and cases escalated to human review here."}
                </p>
                <div className="grid md:grid-cols-4 gap-3 max-w-xl mx-auto text-sm text-gray-600">
                  {['Precision', 'Recall', 'False Approvals', 'Escalations'].map((m, i) => (
                    <div key={i} className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-3">
                      <div className="text-2xl text-gray-700 font-bold">—</div>
                      <div className="mt-1">{m}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-xs text-gray-700">
                  Metrics will populate automatically once the AI module is connected.
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full border-4 border-violet-900 border-t-violet-400 animate-spin mx-auto" />
        <p className="text-gray-400">Loading platform analytics…</p>
      </div>
    </div>
  );
}
