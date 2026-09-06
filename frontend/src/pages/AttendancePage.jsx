import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceAPI, reportAPI } from '../api';
import { 
  LoadingSpinner, EmptyState, PageHeader, StatusBadge, useToast, 
  formatTime12h, formatDateDDMMYYYY, TableSkeleton, useServerDate 
} from '../components/UI';
import { 
  CalendarCheck, Calendar, Filter, RefreshCw, Download, Search, 
  Clock, CheckCircle2, XCircle, AlertCircle, Users
} from 'lucide-react';

const AttendancePage = () => {
  const [searchParams] = useSearchParams();
  const { serverDate, formattedDate } = useServerDate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    date: searchParams.get('date') || serverDate,
    employeeId: searchParams.get('employeeId') || '',
    status: searchParams.get('status') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    filterType: searchParams.get('filterType') || 'daily',
  });
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (!searchParams.get('date') && serverDate) {
      setFilters(prev => ({ ...prev, date: serverDate }));
    }
  }, [serverDate, searchParams]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      const targetDate = (filters.filterType === 'daily' ? (filters.date || serverDate) : filters.date);
      if (filters.filterType === 'daily' && targetDate) params.date = targetDate;
      else if (filters.filterType === 'range') {
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        params.limit = 10000;
      }
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.status) params.status = filters.status;

      const res = await attendanceAPI.getAll(params);
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
      setSummary(res.data.summary || null);
    } catch {
      showToast('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters.date, filters.status, filters.filterType, filters.startDate, filters.endDate, filters.employeeId, serverDate]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await reportAPI.exportReport({
        type: filters.filterType === 'range' ? 'range' : 'daily',
        startDate: filters.filterType === 'range' ? filters.startDate : filters.date,
        endDate: filters.filterType === 'range' ? filters.endDate : filters.date,
        employeeId: filters.employeeId,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${filters.date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Excel report downloaded!', 'success');
    } catch {
      showToast('Failed to download Excel report', 'error');
    } finally {
      setExporting(false);
    }
  };

  const presentCount = summary?.present ?? records.filter(r => r.status === 'Present').length;
  const halfDayCount = summary?.halfDay ?? records.filter(r => r.status === 'Half Day').length;
  const absentCount = summary?.absent ?? records.filter(r => r.status === 'Absent').length;
  const totalCount = summary?.total ?? total;

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      <PageHeader
        title="Attendance Records & Time Logs"
        subtitle="Real-time log of check-ins, lunch duration, check-outs, and working hours"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting || records.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>
            <button onClick={fetchAttendance} className="btn-secondary text-xs rounded-xl p-2">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        }
      />

      {/* Filter Control Box */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Scope & Criteria</h3>
          </div>

          <div className="flex items-center gap-2">
            {[
              { v: 'daily', l: 'Daily View' },
              { v: 'range', l: 'Date Range' },
              { v: 'all', l: 'All Records' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setFilters(f => ({ ...f, filterType: o.v }))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filters.filterType === o.v
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {filters.filterType === 'daily' && (
            <div>
              <label className="label text-xs flex items-center justify-between mb-1">
                <span>Target Date</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#1D4ED8] font-extrabold">{formatDateDDMMYYYY(filters.date || serverDate)}</span>
                  {filters.date !== serverDate && (
                    <button
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, date: serverDate }))}
                      className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-0.5 rounded-md font-bold transition-all shadow-2xs"
                    >
                      Set Today
                    </button>
                  )}
                </div>
              </label>
              <input
                type="date"
                className="input-field text-xs font-bold rounded-xl"
                value={filters.date || serverDate}
                onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          )}
          {filters.filterType === 'range' && (
            <>
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
          <div>
            <label className="label text-xs">Employee ID</label>
            <input
              type="text"
              className="input-field uppercase font-mono font-bold text-xs rounded-xl"
              placeholder="e.g. EMP001"
              value={filters.employeeId}
              onChange={e => setFilters(f => ({ ...f, employeeId: e.target.value }))}
            />
          </div>
          <div>
            <label className="label text-xs">Status Filter</label>
            <select
              className="input-field text-xs font-bold rounded-xl"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Permission">Permission</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filtered</p>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present</p>
            <p className="text-xl font-black text-emerald-900">{presentCount}</p>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Half Day</p>
            <p className="text-xl font-black text-amber-900">{halfDayCount}</p>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent</p>
            <p className="text-xl font-black text-rose-900">{absentCount}</p>
          </div>
        </div>
      </div>

      {/* Advanced Data Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records found"
            subtitle="Adjust date filters or employee selection above."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Employee Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Check In</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Lunch Out</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Lunch In</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Check Out</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Working Hrs</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-600">{formatDateDDMMYYYY(r.date)}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{r.employeeId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{r.employeeName}</td>
                    <td className="px-4 py-3.5 text-emerald-600 font-bold">{formatTime12h(r.checkIn || r.firstCheckIn)}</td>
                    <td className="px-4 py-3.5 text-amber-600 font-medium">{formatTime12h(r.lunchOut || r.afternoonCheckOut)}</td>
                    <td className="px-4 py-3.5 text-orange-600 font-medium">{formatTime12h(r.lunchIn || r.afternoonCheckIn)}</td>
                    <td className="px-4 py-3.5 text-rose-600 font-bold">{formatTime12h(r.checkOut || r.finalCheckOut)}</td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900">{r.workingHours > 0 ? `${r.workingHours} hrs` : '—'}</td>
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
    </div>
  );
};

export default AttendancePage;
