import React, { useState, useEffect } from 'react';
import { reportAPI, attendanceAPI } from '../api';
import { 
  LoadingSpinner, EmptyState, PageHeader, StatusBadge, useToast, 
  formatTime12h, formatDateDDMMYYYY, TableSkeleton, useServerDate 
} from '../components/UI';
import { 
  BarChart3, FileSpreadsheet, Download, Search, Calendar, Percent, 
  Filter, RefreshCw, Layers, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Reports = () => {
  const { serverDate } = useServerDate();
  const [records, setRecords] = useState([]);
  const [permissionRecords, setPermissionRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState('');
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, present: 0, halfDay: 0, absent: 0, datesShown: 0 });
  const [percentageData, setPercentageData] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance');
  
  const [filters, setFilters] = useState({ 
    type: 'daily', 
    date: serverDate || new Date().toISOString().split('T')[0], 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(), 
    employeeId: '', 
    startDate: '', 
    endDate: '' 
  });
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    setFilters(prev => {
      if (prev.type === 'daily' && serverDate) {
        const parts = serverDate.split('-');
        const y = parseInt(parts[0], 10) || new Date().getFullYear();
        const m = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
        return { ...prev, date: serverDate, month: m, year: y };
      }
      return prev;
    });
  }, [serverDate]);

  const buildParams = () => {
    const p = { type: filters.type };
    if (filters.type === 'daily') p.startDate = filters.date;
    else if (filters.type === 'monthly') { p.month = filters.month; p.year = filters.year; p.limit = 10000; }
    else if (filters.type === 'employee') { p.employeeId = filters.employeeId; if (filters.startDate) p.startDate = filters.startDate; if (filters.endDate) p.endDate = filters.endDate; }
    return p;
  };

  const fetchReport = async () => {
    setLoading(true);
    try { 
      const res = await reportAPI.getReport(buildParams()); 
      const rawRecords = res?.data?.records || (Array.isArray(res?.data) ? res.data : []);
      setRecords(Array.isArray(rawRecords) ? rawRecords : []); 
      setTotal(res?.data?.total || (Array.isArray(rawRecords) ? rawRecords.length : 0)); 
      setSummary(res?.data?.summary || { total: res?.data?.total || 0, present: 0, halfDay: 0, absent: 0, datesShown: 0 }); 
    } catch (err) {
      console.error('Fetch report error:', err);
      showToast('Failed to load attendance report', 'error');
      setRecords([]);
      setTotal(0);
      setSummary({ total: 0, present: 0, halfDay: 0, absent: 0, datesShown: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionReport = async () => {
    setLoading(true);
    try {
      const p = buildParams();
      if (filters.type === 'daily') p.date = filters.date;
      const res = await reportAPI.getPermissionReport(p);
      const rawList = res?.data?.permissions || (Array.isArray(res?.data) ? res.data : []);
      setPermissionRecords(Array.isArray(rawList) ? rawList : []);
    } catch (err) {
      console.error('Fetch permission report error:', err);
      showToast('Failed to load permission report', 'error');
      setPermissionRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPercentage = async () => {
    setLoading(true);
    try {
      const p = {};
      if (filters.startDate) p.startDate = filters.startDate;
      if (filters.endDate) p.endDate = filters.endDate;
      const res = await attendanceAPI.getPercentage(p);
      const rawList = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      setPercentageData(Array.isArray(rawList) ? rawList : []);
    } catch (err) {
      console.error('Fetch percentage error:', err);
      showToast('Failed to load attendance percentages', 'error');
      setPercentageData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchReport();
    else if (activeTab === 'permission') fetchPermissionReport();
    else fetchPercentage();
  }, [activeTab, filters.type]);

  const handleExport = async (type) => {
    setExportLoading(type);
    try {
      const p = { type };
      if (type === 'daily') p.startDate = filters.date;
      else if (type === 'monthly') { p.month = filters.month; p.year = filters.year; }
      else if (type === 'employee' && filters.employeeId) p.employeeId = filters.employeeId;
      
      const res = await reportAPI.exportReport(p);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Excel report exported successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Export failed', 'error');
    } finally {
      setExportLoading('');
    }
  };

  const handlePermissionExport = async () => {
    setExportLoading('permission');
    try {
      const p = buildParams();
      if (filters.type === 'daily') p.date = filters.date;
      const res = await reportAPI.exportPermissionReport(p);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `permission_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Permission report exported successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Export failed', 'error');
    } finally {
      setExportLoading('');
    }
  };

  const safeRecords = Array.isArray(records) ? records : [];
  const safePermissionRecords = Array.isArray(permissionRecords) ? permissionRecords : [];
  const safePercentageData = Array.isArray(percentageData) ? percentageData : [];

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      <PageHeader
        title="Reports & System Analytics"
        subtitle="Generate and export attendance, permission, and employee performance statistics"
      />

      {/* Tab Selector Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md w-fit">
        {[
          { id: 'attendance', label: 'Attendance Report', icon: FileSpreadsheet },
          { id: 'permission', label: 'Permission Report', icon: Layers },
          { id: 'percentage', label: 'Attendance Score %', icon: Percent },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === t.id
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { v: 'daily', l: 'Daily View' },
                { v: 'monthly', l: 'Monthly View' },
                { v: 'employee', l: 'Employee Specific' },
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => setFilters(f => ({ ...f, type: o.v }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filters.type === o.v
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {filters.type === 'daily' && (
                <div>
                  <label className="label text-xs">Target Date</label>
                  <input
                    type="date"
                    className="input-field text-xs font-bold rounded-xl"
                    value={filters.date}
                    onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              )}
              {filters.type === 'monthly' && (
                <>
                  <div>
                    <label className="label text-xs">Select Month</label>
                    <select
                      className="input-field text-xs font-bold rounded-xl"
                      value={filters.month}
                      onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
                    >
                      {months.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Year</label>
                    <input
                      type="number"
                      className="input-field text-xs font-bold rounded-xl"
                      value={filters.year}
                      onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                </>
              )}
              {filters.type === 'employee' && (
                <>
                  <div>
                    <label className="label text-xs">Employee ID</label>
                    <input
                      type="text"
                      className="input-field uppercase font-mono font-bold text-xs rounded-xl"
                      placeholder="EMP001"
                      value={filters.employeeId}
                      onChange={e => setFilters(f => ({ ...f, employeeId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Start Date</label>
                    <input
                      type="date"
                      className="input-field text-xs font-bold rounded-xl"
                      value={filters.startDate}
                      onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">End Date</label>
                    <input
                      type="date"
                      className="input-field text-xs font-bold rounded-xl"
                      value={filters.endDate}
                      onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
              <button onClick={fetchReport} className="btn-primary text-xs rounded-xl shadow-md">
                <Search className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
              <button
                onClick={() => handleExport('daily')}
                disabled={!!exportLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{exportLoading === 'daily' ? 'Exporting...' : 'Export Daily (.xlsx)'}</span>
              </button>
              <button
                onClick={() => handleExport('monthly')}
                disabled={!!exportLoading}
                className="btn-secondary text-xs rounded-xl border border-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>{exportLoading === 'monthly' ? 'Exporting...' : 'Export Monthly (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {[
              ['Dates Included', summary.datesShown || (filters.type === 'daily' ? 1 : 0), 'text-slate-900'],
              ['Total Records', summary.total, 'text-[#1D4ED8]'],
              ['Present', summary.present, 'text-emerald-600'],
              ['Half Day', summary.halfDay || 0, 'text-orange-600'],
              ['Absent', summary.absent, 'text-rose-600'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-white rounded-2xl p-4 text-center border border-slate-200/80 shadow-md">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Attendance Report Results ({total} records)</h3>
            </div>
            {loading ? (
              <TableSkeleton rows={8} cols={8} />
            ) : safeRecords.length === 0 ? (
              <EmptyState icon={FileSpreadsheet} title="No records found" subtitle="Select your filter parameters and click Generate Report." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Check In</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Lunch Out</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Lunch In</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Check Out</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Working Hrs</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                    {safeRecords.map(r => (
                      <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{r.employeeId}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{r.employeeName}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-600">{formatDateDDMMYYYY(r.date)}</td>
                        <td className="px-4 py-3.5 text-emerald-600 font-bold">{r.checkIn || r.firstCheckIn || '-'}</td>
                        <td className="px-4 py-3.5 text-amber-600 font-medium">{r.lunchOut || r.afternoonCheckOut || '-'}</td>
                        <td className="px-4 py-3.5 text-orange-600 font-medium">{r.lunchIn || r.afternoonCheckIn || '-'}</td>
                        <td className="px-4 py-3.5 text-rose-600 font-bold">{r.checkOut || r.finalCheckOut || '-'}</td>
                        <td className="px-4 py-3.5 font-black text-slate-900">{r.workingHours > 0 ? `${r.workingHours} hrs` : '0 hrs'}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'permission' && (
        <>
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <button onClick={fetchPermissionReport} className="btn-primary text-xs rounded-xl shadow-md">
                <Search className="w-4 h-4" />
                <span>Generate Permission Report</span>
              </button>
              <button onClick={handlePermissionExport} disabled={exportLoading === 'permission'} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>{exportLoading === 'permission' ? 'Exporting...' : 'Export Permission Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
            {loading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : safePermissionRecords.length === 0 ? (
              <EmptyState icon={Layers} title="No permission records found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Out Time</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Return Time</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                    {safePermissionRecords.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{p.employeeId}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{p.employeeName}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-bold">{p.date}</td>
                        <td className="px-4 py-3.5 max-w-xs truncate">{p.reason}</td>
                        <td className="px-4 py-3.5 text-amber-600 font-bold">{formatTime12h(p.permissionOutTime)}</td>
                        <td className="px-4 py-3.5 text-teal-600 font-bold">{formatTime12h(p.permissionReturnTime)}</td>
                        <td className="px-4 py-3.5 font-extrabold">{p.totalPermissionDuration || '—'}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'percentage' && (
        <>
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="label text-xs">Start Date</label>
                <input
                  type="date"
                  className="input-field text-xs font-bold rounded-xl"
                  value={filters.startDate}
                  onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label text-xs">End Date</label>
                <input
                  type="date"
                  className="input-field text-xs font-bold rounded-xl"
                  value={filters.endDate}
                  onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <button onClick={fetchPercentage} className="btn-primary text-xs rounded-xl shadow-md">
              <Percent className="w-4 h-4" />
              <span>Calculate Percentage</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
            {loading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : safePercentageData.length === 0 ? (
              <EmptyState icon={Percent} title="No percentage data calculated" subtitle="Select date range and click Calculate." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Employee Name</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Present Days</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Total Working Days</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Attendance Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                    {safePercentageData.map(d => (
                      <tr key={d.employeeId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{d.employeeId}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="px-4 py-3.5 font-extrabold text-emerald-600">{d.presentDays}</td>
                        <td className="px-4 py-3.5 font-bold">{d.totalWorkingDays}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-3 max-w-xs overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  d.percentage >= 75
                                    ? 'bg-emerald-500'
                                    : d.percentage >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(d.percentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black ${
                              d.percentage >= 75 ? 'text-emerald-600' : d.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                              {d.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
