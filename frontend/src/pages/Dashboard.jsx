import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, salaryAPI, permissionAPI } from '../api';
import { 
  StatCard, EmptyState, PageHeader, StatusBadge, 
  formatTime12h, StatSkeleton, Modal, useServerDate, formatDateDDMMYYYY 
} from '../components/UI';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Users, UserCheck, UserX, SunMedium, Bookmark, CalendarOff, 
  DollarSign, RefreshCw, AlertTriangle, ArrowUpRight, Plus, 
  Clock, Sparkles, Activity, ShieldAlert, Search, Globe, TrendingUp,
  Zap, CheckCircle2, FileText
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-xl text-xs font-semibold space-y-1.5 backdrop-blur-md">
        <p className="font-extrabold text-blue-400 border-b border-slate-800 pb-1 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salarySummary, setSalarySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [chartType, setChartType] = useState('bar');

  // Active permission modal state
  const [activePermModalOpen, setActivePermModalOpen] = useState(false);
  const [activePermList, setActivePermList] = useState([]);
  const [activePermLoading, setActivePermLoading] = useState(false);

  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setApiError(false);
    try {
      const [attRes, salRes] = await Promise.all([
        attendanceAPI.getDashboardStats().catch(err => {
          console.error("Dashboard attendance API error:", err);
          return { data: null };
        }),
        salaryAPI.getSalaryList().catch(err => {
          console.error("Dashboard salary API error:", err);
          return { data: null };
        }),
      ]);

      if (attRes?.data) {
        setStats(attRes.data);
      } else if (showLoading) {
        setStats({});
        setApiError(true);
      }

      setSalarySummary(salRes?.data?.summary || null);
    } catch (error) {
      console.error('Dashboard error:', error);
      if (showLoading) {
        setStats({});
        setApiError(true);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchActivePermissions = async () => {
    setActivePermLoading(true);
    try {
      const res = await permissionAPI.getAll({ status: 'In Progress' });
      if (res.data?.success) {
        setActivePermList(res.data.permissions || []);
      }
    } catch (err) {
      console.error("Error loading active permissions:", err);
    } finally {
      setActivePermLoading(false);
    }
  };

  const openActivePermModal = () => {
    setActivePermModalOpen(true);
    fetchActivePermissions();
  };

  const { serverDate, formattedDate } = useServerDate();

  useEffect(() => {
    fetchDashboard(true);
    // 4-second silent auto-refresh for real-time dashboard accuracy
    const pollInterval = setInterval(() => {
      fetchDashboard(false);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [serverDate]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 skeleton w-64 rounded-2xl" />
      <StatSkeleton count={4} />
      <StatSkeleton count={3} />
    </div>
  );

  const safeStatsObj = stats?.stats || {};
  const totalEmployees = safeStatsObj.totalEmployees || 0;
  const presentToday = safeStatsObj.presentToday || 0;
  const halfDayToday = safeStatsObj.halfDayToday || 0;
  const absentToday = safeStatsObj.absentToday || 0;
  const pendingPermissions = safeStatsObj.pendingPermissions || 0;
  const pendingHalfDay = safeStatsObj.pendingHalfDay || 0;
  const pendingLeave = safeStatsObj.pendingLeave || 0;
  const currentlyOnPermission = safeStatsObj.currentlyOnPermission || 0;

  const attendancePercentage = totalEmployees > 0 
    ? Math.round(((presentToday + (halfDayToday * 0.5)) / totalEmployees) * 100)
    : 0;

  const safeMonthlyData = Array.isArray(stats?.monthlyData) ? stats.monthlyData : [];
  const safeRecentActivity = Array.isArray(stats?.recentActivity) ? stats.recentActivity : [];

  const filteredActivity = safeRecentActivity.filter(r => {
    if (!activitySearch.trim()) return true;
    const query = activitySearch.toLowerCase();
    return (
      (r.employeeId && r.employeeId.toLowerCase().includes(query)) ||
      (r.employeeName && r.employeeName.toLowerCase().includes(query)) ||
      (r.status && r.status.toLowerCase().includes(query))
    );
  });

  const presentVsAbsentData = [
    { name: 'Present', value: presentToday },
    { name: 'Half Day', value: halfDayToday },
    { name: 'Absent', value: absentToday }
  ];
  const pieColors = ['#1D4ED8', '#f59e0b', '#ef4444'];

  const monthlyChartData = safeMonthlyData.slice(-14).map((d) => ({
    date: d?._id?.slice(5) || 'Date',
    Present: d?.present || 0,
    'Half Day': d?.halfDay || 0,
    Absent: d?.absent || 0
  }));

  const hasPendingRequests = pendingPermissions > 0 || pendingHalfDay > 0 || pendingLeave > 0;

  // Build list of conditional request cards (show ONLY if count > 0)
  const conditionalRequestCards = [];

  if (pendingPermissions > 0) {
    conditionalRequestCards.push({
      key: 'pendingPermissions',
      title: 'Pending Permissions',
      value: pendingPermissions,
      icon: Bookmark,
      color: 'blue',
      subtitle: 'Pending admin review',
      onClick: () => navigate('/admin/permissions?status=Pending')
    });
  }

  if (pendingHalfDay > 0) {
    conditionalRequestCards.push({
      key: 'pendingHalfDay',
      title: 'Half Day Requests',
      value: pendingHalfDay,
      icon: SunMedium,
      color: 'amber',
      subtitle: 'Pending admin review',
      onClick: () => navigate('/admin/halfday?status=Pending')
    });
  }

  if (pendingLeave > 0) {
    conditionalRequestCards.push({
      key: 'pendingLeave',
      title: 'Leave Requests',
      value: pendingLeave,
      icon: CalendarOff,
      color: 'amber',
      subtitle: 'Pending admin review',
      onClick: () => navigate('/admin/leave?status=Pending')
    });
  }

  if (currentlyOnPermission > 0) {
    conditionalRequestCards.push({
      key: 'currentlyOnPermission',
      title: 'Permission In Progress',
      value: currentlyOnPermission,
      icon: Clock,
      color: 'blue',
      subtitle: 'Employees out now',
      onClick: openActivePermModal
    });
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in font-sans">
      {/* Page Header */}
      <PageHeader
        title="Commercial Admin Dashboard"
        subtitle="Real-time attendance intelligence, staff statistics, and automated payroll overview"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(true)}
              className="btn-secondary text-xs flex items-center gap-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-200"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Refresh Stats</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-xs flex items-center gap-1.5 rounded-xl shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Employee Portal</span>
            </button>
          </div>
        }
      />

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-bold">Could not fetch complete server analytics. Showing cached data.</p>
          </div>
          <button onClick={() => fetchDashboard(true)} className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm">
            Retry
          </button>
        </div>
      )}

      {/* Commercial Quick Action Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-slate-900 text-white shadow-xl flex items-center justify-between flex-wrap gap-4 border border-blue-800/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 shadow-inner backdrop-blur-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-extrabold tracking-wide">Admin Operations Panel</h3>
              <span className="px-3 py-0.5 rounded-full bg-white/15 text-blue-200 text-xs font-mono font-bold border border-white/20">
                {attendancePercentage}% Turnout Rate
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5 font-medium">Quick controls for check-ins, employee onboarding, pass approvals, and payroll statements</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Mark Punch</span>
          </button>
          <button
            onClick={() => navigate('/admin/permissions')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Bookmark className="w-4 h-4" />
            <span>Permissions</span>
          </button>
          <button
            onClick={() => navigate('/admin/employees')}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs border border-white/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-blue-300" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Primary Statistics Cards Grid (Always 4 Cards Visible) */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Primary Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            color="blue"
            subtitle="Registered staff"
            onClick={() => navigate('/admin/employees')}
          />
          <StatCard
            title="Present Today"
            value={presentToday}
            icon={UserCheck}
            color="emerald"
            subtitle={`${attendancePercentage}% Turnout Rate`}
            onClick={() => navigate('/admin/attendance?status=Present')}
          />
          <StatCard
            title="Absent Today"
            value={absentToday}
            icon={UserX}
            color="red"
            subtitle="Not checked in"
            onClick={() => navigate('/admin/attendance?status=Absent')}
          />
          <StatCard
            title="Monthly Payroll"
            value={salarySummary ? `₹${(salarySummary.totalFinalPayroll || 0).toLocaleString('en-IN')}` : '₹0'}
            icon={DollarSign}
            color="purple"
            subtitle="Estimated net"
            onClick={() => navigate('/admin/salary')}
          />
        </div>
      </div>

      {/* Conditional Request Cards Grid (Renders ONLY if count > 0) */}
      {conditionalRequestCards.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Requests & Live Activity</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              {conditionalRequestCards.length} dynamic card(s) active
            </span>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${conditionalRequestCards.length >= 3 ? 'lg:grid-cols-4' : conditionalRequestCards.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-3.5`}>
            {conditionalRequestCards.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                subtitle={card.subtitle}
                onClick={card.onClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Permission Banner */}
      {currentlyOnPermission > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-extrabold">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-extrabold">Active Permissions In Progress</p>
              <p className="text-xs text-blue-700 font-medium">{currentlyOnPermission} employee(s) are currently out on permission today.</p>
            </div>
          </div>
          <button
            onClick={openActivePermModal}
            className="px-4 py-2 bg-[#1D4ED8] text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-all shadow-md shrink-0 active:scale-95 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>View Active Details ({currentlyOnPermission})</span>
          </button>
        </div>
      )}

      {/* Pending Reviews Banner */}
      {hasPendingRequests && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-950">Pending Approval Requests</p>
              <p className="text-xs text-amber-800 font-medium">Review pending Permission, Half-Day, or Leave applications below.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {pendingPermissions > 0 && (
              <button
                onClick={() => navigate('/admin/permissions?status=Pending')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95"
              >
                Permissions ({pendingPermissions})
              </button>
            )}
            {pendingHalfDay > 0 && (
              <button
                onClick={() => navigate('/admin/halfday?status=Pending')}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95"
              >
                Half Days ({pendingHalfDay})
              </button>
            )}
            {pendingLeave > 0 && (
              <button
                onClick={() => navigate('/admin/leave?status=Pending')}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95"
              >
                Leaves ({pendingLeave})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Today's Distribution */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Today's Attendance Ratio</h3>
              <p className="text-[11px] text-slate-500 font-medium">Live attendance distribution</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] animate-pulse" />
          </div>

          {presentVsAbsentData.every((d) => d.value === 0) ? (
            <EmptyState icon={UserCheck} title="No attendance recorded today" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={presentVsAbsentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {presentVsAbsentData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Present</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{presentToday}</p>
            </div>
            <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Half Day</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{halfDayToday}</p>
            </div>
            <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{absentToday}</p>
            </div>
          </div>
        </div>

        {/* 14-Day Attendance Trend */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">14-Day Attendance Trend Analytics</h3>
              <p className="text-xs text-slate-500 font-medium">Daily attendance performance breakdown</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartType === 'bar' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartType === 'area' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Area Trend
              </button>
            </div>
          </div>

          {monthlyChartData.length === 0 ? (
            <EmptyState icon={Activity} title="No historical trend data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {chartType === 'bar' ? (
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Present" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Half Day" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="Present" stroke="#1D4ED8" fillOpacity={1} fill="url(#colorPresent)" />
                  <Area type="monotone" dataKey="Absent" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Today's Activity Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Employee Activity Log</h3>
            <p className="text-xs text-slate-500 font-medium">Live check-in, check-out, lunch, and working duration feed</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, Name, Status..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="input-field pl-9 py-2 text-xs w-48 sm:w-64 rounded-xl"
              />
            </div>
            <button
              onClick={() => navigate('/admin/attendance')}
              className="text-xs font-bold text-[#1D4ED8] hover:text-blue-800 transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Full Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredActivity.length === 0 ? (
          <EmptyState icon={Clock} title="No activity recorded today matching filter" subtitle="Check-in entries will automatically appear here." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Check In</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Lunch Out</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Lunch In</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Check Out</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Working Hrs</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {filteredActivity.map((r) => (
                  <tr key={r._id || r.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#1D4ED8]">{r.employeeId || '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employeeName || '—'}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">{formatTime12h(r.firstCheckIn || r.checkIn)}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{formatTime12h(r.lunchOut || r.afternoonCheckOut)}</td>
                    <td className="px-4 py-3 text-orange-600 font-medium">{formatTime12h(r.lunchIn || r.afternoonCheckIn)}</td>
                    <td className="px-4 py-3 text-rose-600 font-bold">{formatTime12h(r.finalCheckOut || r.checkOut)}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{r.workingHours ? `${r.workingHours} hrs` : '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status || 'Present'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Permissions Details Modal */}
      {activePermModalOpen && (
        <Modal
          isOpen={activePermModalOpen}
          onClose={() => setActivePermModalOpen(false)}
          title="Employees Currently Out On Permission"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              List of staff members currently on active permission out pass. Status will change to completed once they punch Permission In.
            </p>

            {activePermLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-bold">Loading active permissions...</div>
            ) : activePermList.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No active permissions right now" subtitle="All out passes have been returned or none are active." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                      <th className="px-4 py-3">Emp ID</th>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Out Time</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {activePermList.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-[#1D4ED8]">{p.employeeId}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.employeeName}</td>
                        <td className="px-4 py-3">{p.date}</td>
                        <td className="px-4 py-3 text-blue-600 font-bold">{formatTime12h(p.permissionOutTime || p.fromTime)}</td>
                        <td className="px-4 py-3">{p.reason || 'Permission'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status="In Progress" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setActivePermModalOpen(false);
                  navigate('/admin/permissions?status=In Progress');
                }}
                className="text-xs font-bold text-[#1D4ED8] hover:text-blue-800 flex items-center gap-1"
              >
                <span>Manage Permissions Page →</span>
              </button>
              <button
                onClick={() => setActivePermModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
