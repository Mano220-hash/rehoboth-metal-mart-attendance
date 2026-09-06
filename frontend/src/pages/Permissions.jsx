import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { permissionAPI } from '../api';
import { 
  LoadingSpinner, EmptyState, Modal, PageHeader, StatusBadge, 
  useToast, formatTime12h, TableSkeleton 
} from '../components/UI';
import { useForm } from 'react-hook-form';
import { 
  Bookmark, Search, Calendar, RefreshCw, CheckCircle2, XCircle, 
  Clock, AlertTriangle, Filter, Check, X, ShieldAlert 
} from 'lucide-react';

const Permissions = () => {
  const [searchParams] = useSearchParams();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState(() => searchParams.get('date') === 'today' ? new Date().toISOString().split('T')[0] : searchParams.get('date') || '');
  const [search, setSearch] = useState('');
  const [inProgressCount, setInProgressCount] = useState(0);
  const activeFilter = searchParams.get('active') === 'true';
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const { showToast, ToastContainer } = useToast();

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await permissionAPI.getAll({ status: statusFilter, date: dateFilter, search, active: activeFilter || undefined });
      const rawList = res?.data?.permissions || (Array.isArray(res?.data) ? res.data : []);
      setPermissions(Array.isArray(rawList) ? rawList : []);
      if (res?.data?.currentlyInProgress !== undefined) {
        setInProgressCount(res.data.currentlyInProgress || 0);
      }
    } catch (err) {
      console.error('Fetch permissions error:', err);
      showToast('Failed to load permission requests', 'error');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [statusFilter, dateFilter, activeFilter]);

  const handleReview = async (data) => {
    if (!reviewModal?._id) return;
    setReviewLoading(true);
    try {
      await permissionAPI.review(reviewModal._id, data);
      showToast(`Permission request ${(data?.status || '').toLowerCase()} successfully!`, 'success');
      setReviewModal(null);
      reset();
      await fetchPermissions();
    } catch (err) {
      console.error('Review permission error:', err);
      showToast(err?.response?.data?.message || 'Review update failed', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAdminCancel = async (permission) => {
    if (!permission?._id) return;
    if (!window.confirm('Cancel this permission request as admin?')) return;
    try {
      await permissionAPI.adminCancel(permission._id);
      showToast('Permission cancelled by admin', 'success');
      await fetchPermissions();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Cancellation failed', 'error');
    }
  };

  const safePermissions = Array.isArray(permissions) ? permissions : [];
  const pendingCount = safePermissions.filter(p => p && p.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      <PageHeader 
        title="Permission Management & Pass Approvals" 
        subtitle={`${pendingCount} pending review(s) · ${inProgressCount} currently active in progress`}
        actions={
          <button onClick={fetchPermissions} className="btn-secondary text-xs rounded-xl p-2">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        } 
      />

      {/* Filter and Tab Box */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-10 py-2.5 text-xs rounded-xl"
              placeholder="Search employee name, ID, or reason..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="input-field text-xs font-bold rounded-xl py-2.5"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <button onClick={fetchPermissions} className="btn-primary text-xs rounded-xl shadow-md">
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>

        {/* Counter Tab Selector */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
          {[
            { id: '', label: 'All Requests' },
            { id: 'In Progress', label: 'In Progress', count: inProgressCount, color: 'bg-[#1D4ED8]' },
            { id: 'Pending', label: 'Pending Review', count: pendingCount, color: 'bg-amber-500' },
            { id: 'Approved', label: 'Approved' },
            { id: 'Completed', label: 'Completed' },
            { id: 'Rejected', label: 'Rejected' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === t.id
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${t.color || 'bg-slate-800'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : safePermissions.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No permission requests found"
            subtitle="No matching permission logs for the selected status or date."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Schedule Window</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Out Time</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Return Time</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {safePermissions.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{p.employeeId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.employeeName}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-bold">{p.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-emerald-600 font-bold">{formatTime12h(p.fromTime)}</span> → <span className="text-rose-600 font-bold">{formatTime12h(p.toTime)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-amber-600 font-bold">{formatTime12h(p.permissionOutTime)}</td>
                    <td className="px-4 py-3.5 text-teal-600 font-bold">{formatTime12h(p.permissionReturnTime)}</td>
                    <td className="px-4 py-3.5 max-w-xs truncate" title={p.reason}>{p.reason}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.status === 'Pending' ? (
                        <button
                          onClick={() => { setReviewModal(p); reset(); }}
                          className="btn-primary text-xs py-1.5 px-3 rounded-xl shadow-xs"
                        >
                          Review
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {p.status === 'Cancelled' ? 'Cancelled' : (p.adminRemarks || 'Reviewed')}
                          </span>
                          {p.status !== 'Cancelled' && p.status !== 'In Progress' && (
                            <button
                              onClick={() => handleAdminCancel(p)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      <Modal 
        isOpen={!!reviewModal} 
        onClose={() => setReviewModal(null)} 
        title="Review Permission Pass Request" 
        size="sm"
      >
        {reviewModal && (
          <div className="space-y-4">
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="font-extrabold text-slate-900 text-sm">{reviewModal.employeeName}</span>
                <span className="font-mono text-[#1D4ED8] font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">{reviewModal.employeeId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div><span className="font-medium text-slate-400">Date:</span> <span className="font-bold text-slate-800">{reviewModal.date}</span></div>
                <div><span className="font-medium text-slate-400">Window:</span> <span className="font-bold text-blue-700">{formatTime12h(reviewModal.fromTime)} → {formatTime12h(reviewModal.toTime)}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                <span className="font-medium text-slate-400 block mb-1">Reason:</span>
                <p className="text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs leading-relaxed">{reviewModal.reason}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleReview)} className="space-y-4">
              <div>
                <label className="label text-xs">Admin Decision *</label>
                <select {...register('status', { required: true })} className="input-field text-xs font-bold rounded-xl border-slate-300 focus:border-[#1D4ED8]">
                  <option value="">Select decision</option>
                  <option value="Approved">Approve Request</option>
                  <option value="Rejected">Reject Request</option>
                </select>
              </div>

              <div>
                <label className="label text-xs">Admin Remarks</label>
                <textarea
                  {...register('adminRemarks')}
                  rows={2}
                  className="input-field text-xs rounded-xl resize-none border-slate-300 focus:border-[#1D4ED8]"
                  placeholder="Optional note for employee..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setReviewModal(null)} className="btn-secondary text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={reviewLoading} className="btn-primary text-xs rounded-xl">
                  {reviewLoading ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Permissions;
