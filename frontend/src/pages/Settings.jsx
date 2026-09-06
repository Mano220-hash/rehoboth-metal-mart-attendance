import React, { useState, useEffect } from 'react';
import { settingsAPI, authAPI, cleanupAPI, employeeAPI } from '../api';
import { PageHeader, useToast, Modal, TableSkeleton } from '../components/UI';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Key, 
  Building2, 
  Trash2, 
  ShieldAlert, 
  RotateCcw, 
  Download, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Lock,
  Calendar,
  Filter
} from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DataCleanupSection = ({ showToast }) => {
  const [deleteType, setDeleteType] = useState('today');
  const [employeeId, setEmployeeId] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchAuditLogs();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll({ limit: 1000 });
      setEmployeesList(res.data.employees || []);
    } catch {}
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await cleanupAPI.getAuditLogs();
      setAuditLogs(res.data.logs || []);
    } catch {}
    finally { setLogsLoading(false); }
  };

  const handleClearAuditLogs = async () => {
    if (auditLogs.length === 0) {
      showToast('Audit logs history is already empty!', 'info');
      return;
    }
    if (!window.confirm('Are you sure you want to clear all deletion & security audit history logs?')) return;
    setClearLoading(true);
    try {
      await cleanupAPI.clearAuditLogs();
      setAuditLogs([]);
      showToast('Audit history logs cleared successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to clear audit logs', 'error');
    } finally {
      setClearLoading(false);
    }
  };

  const getPayload = () => {
    const p = { deleteType };
    if (deleteType === 'by_employee' || deleteType === 'delete_employee_completely') {
      p.employeeId = employeeId;
    } else if (deleteType === 'by_date_range' || deleteType === 'by_week') {
      p.startDate = startDate;
      p.endDate = endDate;
    } else if (deleteType === 'by_month') {
      p.month = month;
      p.year = year;
    }
    return p;
  };

  const handleFetchPreview = async () => {
    if ((deleteType === 'by_employee' || deleteType === 'delete_employee_completely') && !employeeId) {
      setPreviewData(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await cleanupAPI.preview(getPayload());
      setPreviewData(res.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to calculate affected records', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    handleFetchPreview();
  }, [deleteType, employeeId, startDate, endDate, month, year]);

  const handleDownloadBackup = async () => {
    setExportLoading(true);
    try {
      const res = await cleanupAPI.exportBackup(getPayload());
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_before_delete_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Pre-deletion backup Excel downloaded successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Backup export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExecuteDelete = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      showToast('Admin password is required', 'error');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await cleanupAPI.execute({
        ...getPayload(),
        adminPassword,
      });
      showToast(res.data.message || 'Records deleted successfully!', 'success');
      setShowModal(false);
      setAdminPassword('');
      handleFetchPreview();
      fetchAuditLogs();
    } catch (error) {
      showToast(error.response?.data?.message || 'Deletion failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filterOptions = [
    { id: 'today', l: 'Today' },
    { id: 'yesterday', l: 'Yesterday' },
    { id: 'this_week', l: 'This Week' },
    { id: 'this_month', l: 'This Month' },
    { id: 'by_date_range', l: 'Date Range' },
    { id: 'by_month', l: 'Specific Month' },
    { id: 'by_employee', l: 'By Employee' },
    { id: 'delete_employee_completely', l: 'Delete Employee Completely' },
    { id: 'delete_all', l: 'Delete All Records' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 border-l-4 border-l-rose-500 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl shadow-sm">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Data Cleanup & Database Management</h3>
            <p className="text-xs text-slate-500 font-medium">Securely clean up historical attendance, salary, permission, leave, and employee records with password authorization.</p>
          </div>
        </div>

        {/* Filter Selector */}
        <div>
          <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select Deletion Scope / Filter</label>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDeleteType(o.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  deleteType === o.id
                    ? o.id === 'delete_all' || o.id === 'delete_employee_completely'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[#1D4ED8] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs */}
        {(deleteType === 'by_employee' || deleteType === 'delete_employee_completely') && (
          <div className="max-w-md">
            <label className="label text-xs">Select Employee</label>
            <select
              className="input-field text-xs font-bold rounded-xl"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map(emp => (
                <option key={emp._id} value={emp.employeeId}>
                  {emp.employeeId} - {emp.name} ({emp.jobRole || 'Staff'})
                </option>
              ))}
            </select>
          </div>
        )}

        {(deleteType === 'by_date_range' || deleteType === 'by_week') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="label text-xs">Start Date</label>
              <input
                type="date"
                className="input-field text-xs font-bold rounded-xl"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-xs">End Date</label>
              <input
                type="date"
                className="input-field text-xs font-bold rounded-xl"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {deleteType === 'by_month' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="label text-xs">Month</label>
              <select className="input-field text-xs font-bold rounded-xl" value={month} onChange={e => setMonth(e.target.value)}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Year</label>
              <input
                type="number"
                className="input-field text-xs font-bold rounded-xl"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="2020"
                max="2030"
              />
            </div>
          </div>
        )}

        {/* Affected Records Preview Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Records Summary</h4>
            {previewLoading && <span className="text-xs text-[#1D4ED8] font-bold animate-pulse">Calculating...</span>}
          </div>

          {previewData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Target Scope: <strong className="text-slate-900">{previewData.targetSummary}</strong></span>
                <span className="text-sm font-black text-rose-600">{previewData.totalRecords} records found</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ['Attendance Logs', previewData.breakdown?.attendance, 'bg-blue-50 text-blue-800 border-blue-200'],
                  ['Permission Passes', previewData.breakdown?.permissions, 'bg-amber-50 text-amber-800 border-amber-200'],
                  ['Half-Day Leaves', previewData.breakdown?.halfDays, 'bg-purple-50 text-purple-800 border-purple-200'],
                  ['Leave Requests', previewData.breakdown?.leaves, 'bg-orange-50 text-orange-800 border-orange-200'],
                  ['Employee Profiles', previewData.breakdown?.employees, 'bg-rose-50 text-rose-800 border-rose-200'],
                ].map(([lbl, cnt, cls]) => (
                  <div key={lbl} className={`p-3 rounded-xl border text-xs font-bold ${cls}`}>
                    <span className="block font-black text-sm">{cnt || 0}</span>
                    <span className="opacity-90 text-[11px]">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select filter criteria above to preview affected database records.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={exportLoading || !previewData || previewData.totalRecords === 0}
            className="btn-secondary text-xs rounded-xl flex items-center gap-2 border border-slate-200"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Exporting Backup...' : 'Download Pre-Deletion Backup'}
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={!previewData || previewData.totalRecords === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
              deleteType === 'delete_all' || deleteType === 'delete_employee_completely'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {deleteType === 'delete_employee_completely' ? 'Permanently Delete Employee' : 'Delete Selected Records'}
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-[#1D4ED8]" />
              Deletion & Security Audit History
            </h3>
            <p className="text-xs text-slate-500 font-medium">Security log of database cleanups and admin actions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAuditLogs} className="btn-secondary text-xs rounded-xl p-2">
              <RotateCcw className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={handleClearAuditLogs}
              disabled={clearLoading || auditLogs.length === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                auditLogs.length > 0
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearLoading ? 'Clearing...' : 'Clear Audit Log'}
            </button>
          </div>
        </div>

        {logsLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center bg-slate-50/50 rounded-2xl border border-slate-100 font-medium">No deletion or security events logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3">Admin</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Target Scope</th>
                  <th className="p-3 text-right">Records Affected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {auditLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{log.adminName} (@{log.adminUsername})</td>
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-[#1D4ED8] font-bold">{log.deleteType}</td>
                    <td className="p-3">{log.targetSummary}</td>
                    <td className="p-3 text-right font-black text-rose-600">{log.recordsDeleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setAdminPassword(''); }}
        title="Confirm Permanent Record Deletion"
        size="sm"
      >
        <form onSubmit={handleExecuteDelete} className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Warning: Action Cannot Be Undone!
            </div>
            <p>You are about to permanently delete <strong>{previewData?.totalRecords || 0} database records</strong> for <strong>{previewData?.targetSummary}</strong>.</p>
          </div>

          <div>
            <label className="label text-xs font-bold text-slate-900">Enter Admin Password to Confirm *</label>
            <input
              type="password"
              className="input-field text-xs border-rose-300 focus:ring-rose-500 rounded-xl"
              placeholder="Your Admin Account Password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowModal(false); setAdminPassword(''); }}
              className="btn-secondary text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteLoading || !adminPassword}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Deleting...' : 'Confirm & Delete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const AdminCredentialsSection = ({ showToast, admin }) => {
  const [loading, setLoading] = useState(false);

  const credForm = useForm({
    defaultValues: {
      currentPassword: '',
      newUsername: admin?.username || 'Rehoboth',
      newPassword: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    if (admin?.username) {
      credForm.setValue('newUsername', admin.username);
    }
  }, [admin, credForm]);

  const handleUpdateCredentials = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changeCredentials(data);
      showToast('Admin credentials updated successfully. Please log in again.', 'success');
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
      }, 1500);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-xl shadow-sm">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Admin Credential Security</h3>
            <p className="text-xs text-slate-500 font-medium">Update your Admin login username and password. Changing credentials requires re-login.</p>
          </div>
        </div>

        <form onSubmit={credForm.handleSubmit(handleUpdateCredentials)} className="space-y-4">
          <div>
            <label className="label text-xs">Current Username</label>
            <input
              type="text"
              value={admin?.username || 'Rehoboth'}
              disabled
              className="input-field text-xs bg-slate-50 text-slate-500 font-bold rounded-xl cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label text-xs">Current Password *</label>
            <input
              type="password"
              {...credForm.register('currentPassword', { required: true })}
              className="input-field text-xs rounded-xl"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="label text-xs">New Username *</label>
            <input
              type="text"
              {...credForm.register('newUsername', { required: true, minLength: 3 })}
              className="input-field text-xs rounded-xl"
              placeholder="Enter new username"
            />
          </div>

          <div>
            <label className="label text-xs">New Password *</label>
            <input
              type="password"
              {...credForm.register('newPassword', { required: true, minLength: 4 })}
              className="input-field text-xs rounded-xl"
              placeholder="Enter new password (min 4 chars)"
            />
          </div>

          <div>
            <label className="label text-xs">Confirm New Password *</label>
            <input
              type="password"
              {...credForm.register('confirmPassword', { required: true })}
              className="input-field text-xs rounded-xl"
              placeholder="Confirm new password"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary text-xs rounded-xl flex items-center gap-1.5 shadow-md">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Settings = () => {
  const { admin, updateAdmin } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [workingDays, setWorkingDays] = useState(ALL_DAYS);

  const profileForm = useForm({ defaultValues: { name: admin?.name || '' } });
  const passwordForm = useForm();
  const settingsForm = useForm();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const s = res.data.settings;
      setSettings(s);
      setWorkingDays(s.workingDays || ALL_DAYS);
      settingsForm.reset({ companyName: s.companyName, workingHoursPerDay: s.workingHoursPerDay });
    } catch {}
  };

  const handleProfileUpdate = async (data) => {
    setLoading(true);
    try { 
      const res = await authAPI.updateProfile(data); 
      updateAdmin(res.data.admin); 
      showToast('Profile updated successfully!', 'success'); 
    }
    catch (error) { showToast(error.response?.data?.message || 'Update failed', 'error'); }
    finally { setLoading(false); }
  };

  const toggleWorkingDay = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSettingsUpdate = async (data) => {
    setLoading(true);
    try {
      await settingsAPI.update({ ...data, workingDays });
      showToast('Company settings updated!', 'success');
      fetchSettings();
    }
    catch { showToast('Update failed', 'error'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'credentials', label: 'Admin Credentials', icon: Key },
    { id: 'company', label: 'Company Config', icon: Building2 },
    { id: 'cleanup', label: 'Data Cleanup', icon: Trash2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      <PageHeader title="System Settings & Admin Configuration" subtitle="Manage account credentials, company parameters, and database cleanup history" />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-60 flex-shrink-0">
          <div className="bg-white rounded-3xl p-3 shadow-lg border border-slate-200/80">
            <nav className="space-y-1.5">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id)} 
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === t.id 
                        ? 'bg-[#1D4ED8] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
              <h3 className="text-base font-bold text-slate-900 mb-6">Admin Profile Information</h3>
              <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50/80 rounded-2xl border border-blue-200">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#1D4ED8] to-blue-500 rounded-2xl flex items-center justify-center shadow-md text-white text-2xl font-black border-2 border-white">
                  {admin?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-base">{admin?.name || 'Administrator'}</p>
                  <p className="text-[#1D4ED8] font-bold text-xs">@{admin?.username}</p>
                </div>
              </div>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs">Full Name</label>
                    <input type="text" {...profileForm.register('name', { required: true })} className="input-field text-xs font-bold rounded-xl" />
                  </div>
                  <div>
                    <label className="label text-xs">Username (Read-only)</label>
                    <input type="text" value={admin?.username} disabled className="input-field text-xs bg-slate-50 text-slate-400 font-bold rounded-xl cursor-not-allowed" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" disabled={loading} className="btn-primary text-xs rounded-xl flex items-center gap-1.5 shadow-md">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'credentials' && (
            <AdminCredentialsSection showToast={showToast} admin={admin} />
          )}

          {activeTab === 'company' && (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
              <h3 className="text-base font-bold text-slate-900 mb-6">Company Configuration</h3>
              <form onSubmit={settingsForm.handleSubmit(handleSettingsUpdate)} className="space-y-5 max-w-md">
                <div>
                  <label className="label text-xs">Company Name</label>
                  <input type="text" {...settingsForm.register('companyName', { required: true })} className="input-field text-xs font-bold rounded-xl" />
                </div>
                <div>
                  <label className="label text-xs">Working Hours Per Day</label>
                  <input type="number" {...settingsForm.register('workingHoursPerDay', { required: true, min: 1, max: 24 })} className="input-field text-xs font-bold rounded-xl" min="1" max="24" />
                </div>
                <div>
                  <label className="label text-xs mb-2 block">Working Days Schedule</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_DAYS.map(day => (
                      <label key={day} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${workingDays.includes(day) ? 'bg-blue-50 border-blue-200 text-[#1D4ED8]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <input
                          type="checkbox"
                          checked={workingDays.includes(day)}
                          onChange={() => toggleWorkingDay(day)}
                          className="rounded text-[#1D4ED8] focus:ring-blue-500 w-4 h-4"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" disabled={loading} className="btn-primary text-xs rounded-xl flex items-center gap-1.5 shadow-md">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'cleanup' && (
            <DataCleanupSection showToast={showToast} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
