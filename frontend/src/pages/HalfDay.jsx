import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { halfDayAPI } from '../api';
import { TableSkeleton, EmptyState, Modal, PageHeader, StatusBadge, useToast } from '../components/UI';
import { useForm } from 'react-hook-form';
import { 
  Clock, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  RotateCcw, 
  Sun, 
  Sunset,
  MessageSquare,
  Check,
  X
} from 'lucide-react';

const HalfDay = () => {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const { showToast, ToastContainer } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try { 
      const res = await halfDayAPI.getAll({ status: statusFilter }); 
      const rawList = res?.data?.halfDays || (Array.isArray(res?.data) ? res.data : []);
      setRequests(Array.isArray(rawList) ? rawList : []); 
    } catch (err) { 
      console.error('Fetch half-day error:', err);
      showToast('Failed to load half day requests', 'error'); 
      setRequests([]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchRequests(); 
  }, [statusFilter]);

  const handleReview = async (data) => {
    if (!reviewModal?._id) return;
    setReviewLoading(true);
    try { 
      await halfDayAPI.review(reviewModal._id, data); 
      showToast(`Half day request ${(data?.status || '').toLowerCase()} successfully`, 'success'); 
      setReviewModal(null); 
      reset(); 
      await fetchRequests(); 
    } catch (err) { 
      console.error('Review half-day error:', err);
      showToast(err?.response?.data?.message || 'Review failed', 'error'); 
    } finally { 
      setReviewLoading(false); 
    }
  };

  const handleAdminCancel = async (request) => {
    if (!request?._id) return;
    if (!window.confirm('Cancel this half day request as admin?')) return;
    try { 
      await halfDayAPI.adminCancel(request._id); 
      showToast('Half day request cancelled by admin', 'success'); 
      await fetchRequests(); 
    } catch (error) { 
      showToast(error?.response?.data?.message || 'Cancellation failed', 'error'); 
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];
  const pendingCount = safeRequests.filter(r => r && r.status === 'Pending').length;
  const approvedCount = safeRequests.filter(r => r && r.status === 'Approved').length;
  const rejectedCount = safeRequests.filter(r => r && r.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      
      <PageHeader 
        title="Half Day Leave Requests" 
        subtitle={`${pendingCount} pending review • ${approvedCount} approved`}
        actions={
          <button 
            onClick={fetchRequests} 
            className="btn-secondary text-xs rounded-xl p-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </button>
        } 
      />

      {/* Filter Tabs */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          {[
            { id: '', label: 'All Requests', count: safeRequests.length },
            { id: 'Pending', label: 'Pending', count: pendingCount, badgeColor: 'bg-amber-500 text-white' },
            { id: 'Approved', label: 'Approved', count: approvedCount, badgeColor: 'bg-emerald-600 text-white' },
            { id: 'Rejected', label: 'Rejected', count: rejectedCount, badgeColor: 'bg-rose-500 text-white' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === tab.id
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor || (statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700')}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : safeRequests.length === 0 ? (
          <EmptyState 
            icon={Clock} 
            title="No Half Day Requests Found" 
            subtitle="No half day requests match your selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Employee Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {safeRequests.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{r.employeeId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#1D4ED8] font-bold text-xs flex items-center justify-center">
                          {r.employeeName?.charAt(0)}
                        </div>
                        {r.employeeName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-600">{r.date}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        r.session === 'Morning' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : 'bg-orange-50 text-orange-800 border border-orange-200'
                      }`}>
                        {r.session === 'Morning' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Sunset className="w-3.5 h-3.5 text-orange-500" />}
                        {r.session} Session
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === 'Pending' ? (
                        <button 
                          onClick={() => { setReviewModal(r); reset(); }}
                          className="btn-primary text-xs py-1.5 px-3 rounded-xl shadow-xs"
                        >
                          Review
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {r.status === 'Cancelled' ? 'Cancelled' : (r.adminRemarks || 'Reviewed')}
                          </span>
                          {r.status !== 'Cancelled' && (
                            <button 
                              onClick={() => handleAdminCancel(r)} 
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

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Half Day Request" size="sm">
        {reviewModal && (
          <div className="space-y-4">
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="font-extrabold text-slate-900 text-sm">{reviewModal.employeeName}</span>
                <span className="font-mono text-[#1D4ED8] font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">{reviewModal.employeeId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div><span className="font-medium text-slate-400">Date:</span> <span className="font-bold text-slate-800">{reviewModal.date}</span></div>
                <div><span className="font-medium text-slate-400">Session:</span> <span className="font-bold text-amber-700">{reviewModal.session}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                <span className="font-medium text-slate-400 block mb-1">Reason:</span>
                <p className="text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs leading-relaxed">{reviewModal.reason}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleReview)} className="space-y-4">
              <div>
                <label className="label text-xs">Admin Decision *</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-emerald-300 bg-emerald-50/60 cursor-pointer hover:bg-emerald-50 transition-colors font-bold text-emerald-800 text-xs shadow-2xs">
                    <input type="radio" value="Approved" {...register('status', { required: true })} className="text-emerald-600 focus:ring-emerald-500" />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approve
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-rose-300 bg-rose-50/60 cursor-pointer hover:bg-rose-50 transition-colors font-bold text-rose-800 text-xs shadow-2xs">
                    <input type="radio" value="Rejected" {...register('status', { required: true })} className="text-rose-600 focus:ring-rose-500" />
                    <XCircle className="w-4 h-4 text-rose-600" /> Reject
                  </label>
                </div>
              </div>

              <div>
                <label className="label text-xs">Admin Remarks</label>
                <textarea 
                  {...register('adminRemarks')} 
                  rows={2} 
                  className="input-field resize-none text-xs rounded-xl border-slate-300 focus:border-[#1D4ED8]" 
                  placeholder="Enter remarks for the employee..." 
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
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

export default HalfDay;
