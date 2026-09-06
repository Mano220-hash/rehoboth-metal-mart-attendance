import React, { useEffect, useState } from 'react';
import { reportAPI } from '../api';
import { TableSkeleton, EmptyState, PageHeader, StatusBadge, useToast } from '../components/UI';
import { 
  Bookmark, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Filter,
  RotateCcw
} from 'lucide-react';

const PermissionReports = () => {
  const now = new Date();
  const [filters, setFilters] = useState({ 
    type: 'daily', 
    date: now.toISOString().split('T')[0], 
    month: now.getMonth() + 1, 
    year: now.getFullYear(), 
    employeeId: '', 
    startDate: '', 
    endDate: '', 
    status: '' 
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const params = () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
  
  const fetchReport = async () => {
    setLoading(true);
    try { 
      const response = await reportAPI.getPermissionReport(params()); 
      setRecords(response.data.permissions || []); 
    } catch { 
      showToast('Failed to load permission report', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchReport(); 
  }, []);

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await reportAPI.exportPermissionReport(params());
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); 
      link.href = url; 
      link.download = `permission_report_${new Date().toISOString().split('T')[0]}.xlsx`; 
      link.click(); 
      window.URL.revokeObjectURL(url);
      showToast('Permission report downloaded', 'success');
    } catch (error) { 
      showToast(error.response?.data?.message || 'Export failed', 'error'); 
    } finally { 
      setExporting(false); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <ToastContainer />
      <PageHeader 
        title="Permission Reports" 
        subtitle="Filter, review, and export permission history" 
        actions={
          <button 
            onClick={exportReport} 
            disabled={exporting} 
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        } 
      />

      <div className="card p-4 space-y-4">
        <div className="flex gap-2 flex-wrap pb-2 border-b border-slate-100">
          {[
            ['daily', 'Daily'], 
            ['weekly', 'Weekly'], 
            ['monthly', 'Monthly'], 
            ['employee', 'Employee-wise'], 
            ['range', 'Date Range']
          ].map(([value, label]) => (
            <button 
              key={value} 
              onClick={() => setFilters((current) => ({ ...current, type: value }))} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filters.type === value 
                  ? 'bg-[#1D4ED8] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          {(filters.type === 'daily' || filters.type === 'weekly') && (
            <div>
              <label className="label text-xs">Date</label>
              <input type="date" className="input-field text-xs" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
            </div>
          )}

          {filters.type === 'monthly' && (
            <>
              <div>
                <label className="label text-xs">Month</label>
                <input type="number" min="1" max="12" className="input-field text-xs" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">Year</label>
                <input type="number" className="input-field text-xs" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
              </div>
            </>
          )}

          {filters.type === 'employee' && (
            <div>
              <label className="label text-xs">Employee ID</label>
              <input className="input-field text-xs font-mono uppercase" placeholder="EMP001" value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} />
            </div>
          )}

          {filters.type === 'range' && (
            <>
              <div>
                <label className="label text-xs">Start Date</label>
                <input type="date" className="input-field text-xs" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">End Date</label>
                <input type="date" className="input-field text-xs" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
              </div>
            </>
          )}

          <div>
            <label className="label text-xs">Status</label>
            <select className="input-field text-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          <div>
            <button onClick={fetchReport} className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5">
              <Search className="w-4 h-4" /> Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm">Results ({records.length})</h3>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : records.length === 0 ? (
          <EmptyState icon={<Bookmark className="w-12 h-12 text-slate-400" />} title="No Permission Records Found" subtitle="Try adjusting your filter selection." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="table-header">Emp ID</th>
                  <th className="table-header">Employee Name</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Reason</th>
                  <th className="table-header">Permission Out</th>
                  <th className="table-header">Permission In</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg text-xs border border-primary-200">
                        {record.employeeId}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-900">{record.employeeName}</td>
                    <td className="table-cell text-slate-600 text-xs">{record.date}</td>
                    <td className="table-cell max-w-xs text-xs text-slate-600 truncate">{record.reason}</td>
                    <td className="table-cell text-amber-700 font-bold text-xs">{record.permissionOutTime || '—'}</td>
                    <td className="table-cell text-teal-700 font-bold text-xs">{record.permissionReturnTime || '—'}</td>
                    <td className="table-cell text-xs font-semibold">{record.totalPermissionDuration}</td>
                    <td className="table-cell"><StatusBadge status={record.status} /></td>
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

export default PermissionReports;