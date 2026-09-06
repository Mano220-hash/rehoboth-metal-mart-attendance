import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, attendanceAPI, permissionAPI, halfDayAPI, leaveAPI, salaryAPI } from '../api';
import { Modal, useToast, StatusBadge, LoadingSpinner, formatTime12h } from '../components/UI';
import { useForm } from 'react-hook-form';
import { 
  LogIn, 
  LogOut, 
  User, 
  Bookmark, 
  UtensilsCrossed, 
  Clock, 
  Palmtree, 
  Calendar, 
  DollarSign, 
  Lock, 
  Building2, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  X,
  FileText,
  Sparkles,
  RefreshCw,
  LayoutGrid,
  ShieldCheck,
  Briefcase,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EmployeeProfileCard = ({ employee, attendance, permissions = [], halfDays = [], leaves = [], onClose, onCancelRequest }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const statusColor = attendance?.checkIn ? (attendance.checkOut ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-300') : 'bg-rose-500/10 text-rose-700 border border-rose-300';
  const statusText = attendance?.checkIn ? (attendance.checkOut ? 'Checked Out' : '🟢 Checked In') : 'Not Checked In';

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const permissionsUsedThisMonth = permissions.filter((p) => {
    if (!p.date || p.status !== 'Approved') return false;
    const [y, m] = p.date.split('-').map(Number);
    return y === currentYear && m === currentMonth;
  }).length;

  useEffect(() => {
    if (activeTab === 'salary' && employee?.employeeId) {
      fetchSalary();
    }
  }, [activeTab, salaryMonth, salaryYear, employee?.employeeId]);

  const fetchSalary = async () => {
    setSalaryLoading(true);
    try {
      const res = await salaryAPI.getEmployeeSalary(employee.employeeId, { month: salaryMonth, year: salaryYear });
      setSalaryDetails(res.data.salary);
    } catch {
      setSalaryDetails(null);
    } finally {
      setSalaryLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1D4ED8] to-blue-500 flex items-center justify-center text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Employee Details</h3>
            <p className="text-xs text-slate-500">Profile, Salary & Requests</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <User className="w-3.5 h-3.5" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'salary' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Salary
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'requests' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Bookmark className="w-3.5 h-3.5" /> Requests ({permissions.length + halfDays.length + leaves.length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center p-4 bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border border-blue-100/80">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#1D4ED8] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 text-white text-3xl font-extrabold border-2 border-white">
              {employee.name?.charAt(0)}
            </div>
            <h4 className="text-lg font-bold text-slate-900">{employee.name}</h4>
            <span className="text-xs font-mono font-bold text-[#1D4ED8] bg-blue-100/80 px-3 py-1 rounded-full mt-1 border border-blue-200 shadow-2xs">{employee.employeeId}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 shadow-2xs ${statusColor}`}>{statusText}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Job Role', employee.jobRole || '—', Briefcase], 
              ['Age', employee.age, User], 
              ['Gender', employee.gender, User], 
              ['Phone', employee.phone, User], 
              ['Joining Date', new Date(employee.joiningDate).toLocaleDateString('en-IN'), Calendar], 
              ['Monthly Salary', `₹${(employee.monthlySalary || 0).toLocaleString('en-IN')}`, DollarSign], 
              ['Status', employee.status, ShieldCheck]
            ].map(([label, value, Icon]) => (
              <div key={label} className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 hover:border-blue-200 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Icon className="w-3 h-3 text-[#1D4ED8]" />
                  {label}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{value}</p>
              </div>
            ))}
          </div>

          {attendance && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-2xl p-4 border border-blue-200/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1D4ED8]" /> Today's Time Log
                </span>
                <StatusBadge status={attendance.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-bold uppercase">First Check In</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatTime12h(attendance.firstCheckIn || attendance.checkIn)}</p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-bold uppercase">Lunch Out</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatTime12h(attendance.lunchOut || attendance.afternoonCheckOut)}</p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-bold uppercase">Lunch In</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatTime12h(attendance.lunchIn || attendance.afternoonCheckIn)}</p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-bold uppercase">Final Check Out</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatTime12h(attendance.finalCheckOut || attendance.checkOut)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200/60">
                <p className="text-xs font-bold text-blue-900">Total Hours Worked</p>
                <p className="text-xs font-extrabold text-[#1D4ED8] bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                  {attendance.workingHours > 0 ? `${attendance.workingHours} hrs` : '0 hrs'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 rounded-2xl p-3.5 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <p className="text-xs font-bold text-amber-900">Approved Permissions (This Month)</p>
            </div>
            <p className="text-sm font-extrabold text-amber-900 bg-amber-200/80 px-3 py-0.5 rounded-xl border border-amber-300">{permissionsUsedThisMonth}</p>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Select Month</label>
              <select
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl text-xs py-2 px-2.5 font-bold outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Year</label>
              <input
                type="number"
                value={salaryYear}
                onChange={(e) => setSalaryYear(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl text-xs py-2 px-2.5 font-bold outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          </div>

          {salaryLoading ? (
            <LoadingSpinner size="sm" text="Calculating monthly salary..." />
          ) : salaryDetails ? (
            <div className="bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4 border border-blue-800">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-md">Salary Statement</span>
                  <h4 className="text-lg font-extrabold mt-1.5">{salaryDetails.name}</h4>
                  <p className="text-xs text-blue-200 font-mono font-bold">{salaryDetails.employeeId}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl font-bold border border-white/20 shadow-sm">{months[salaryMonth - 1]} {salaryYear}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <p className="text-blue-200 font-bold text-[10px] uppercase">Base Monthly</p>
                  <p className="text-sm font-extrabold mt-0.5">₹{salaryDetails.monthlySalary.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <p className="text-blue-200 font-bold text-[10px] uppercase">Daily Rate</p>
                  <p className="text-sm font-extrabold mt-0.5">₹{salaryDetails.dailySalary.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <p className="text-blue-200 font-bold text-[10px] uppercase">Present Days</p>
                  <p className="text-xs font-extrabold mt-0.5">{salaryDetails.presentDays} / {salaryDetails.totalDaysInMonth}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <p className="text-blue-200 font-bold text-[10px] uppercase">Absent Days</p>
                  <p className="text-xs font-extrabold text-amber-300 mt-0.5">{salaryDetails.absentDays}</p>
                </div>
              </div>

              <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg flex justify-between items-center border border-white/20">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Net Salary</p>
                  <p className="text-2xl font-black text-[#1D4ED8]">₹{salaryDetails.finalSalary.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-extrabold shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">No salary statement found for this period</p>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palmtree className="w-4 h-4 text-emerald-600" /> Leave Requests
            </h4>
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-200">No leave requests recorded</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {leaves.map((l) => (
                  <div key={l._id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Leave Request ({l.noOfDays} day{l.noOfDays > 1 ? 's' : ''})</p>
                      <p className="text-slate-500 text-[11px] font-medium">{l.startDate} → {l.endDate}</p>
                      {l.reason && l.reason !== 'Leave Application' && <p className="text-slate-500 text-[10px] italic truncate max-w-[200px]">"{l.reason}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={l.status} />
                      {l.status === 'Pending' && (
                        <button
                          onClick={() => onCancelRequest('leave', l._id)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> Half Day Requests
            </h4>
            {halfDays.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-200">No half day requests recorded</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {halfDays.map((h) => (
                  <div key={h._id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Half Day ({h.session || 'Session'})</p>
                      <p className="text-slate-500 text-[11px] font-medium">{h.date}</p>
                      <p className="text-slate-500 text-[10px] italic truncate max-w-[200px]">"{h.reason}"</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={h.status} />
                      {h.status === 'Pending' && (
                        <button
                          onClick={() => onCancelRequest('halfday', h._id)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-blue-600" /> Permission Requests
            </h4>
            {permissions.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-200">No permission requests recorded</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {permissions.map((p) => (
                  <div key={p._id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{p.fromTime} → {p.toTime} ({p.permissionHours ? `${p.permissionHours} hrs` : '1 hr'})</p>
                      <p className="text-slate-500 text-[11px] font-medium">{p.date}</p>
                      <p className="text-slate-500 text-[10px] italic truncate max-w-[200px]">"{p.reason}"</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={p.status} />
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => onCancelRequest('permission', p._id)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [myPermissions, setMyPermissions] = useState([]);
  const [myHalfDays, setMyHalfDays] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('punch'); // 'punch' | 'dashboard' | 'profile' | 'requests'

  const [showPermission, setShowPermission] = useState(false);
  const [showHalfDay, setShowHalfDay] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  // Live ticking date & time clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const [permissionSlots, setPermissionSlots] = useState([
    { date: new Date().toISOString().split('T')[0], fromTime: '', toTime: '', reason: '' }
  ]);

  const halfDayForm = useForm();
  const leaveForm = useForm();

  const validateAndFetch = async (showError = true) => {
    if (!employeeId.trim()) {
      if (showError) showToast('Please enter your Employee ID', 'error');
      return false;
    }
    setLoading(true);
    try {
      const empRes = await employeeAPI.getById(employeeId.trim());
      if (!empRes.data?.employee) {
        if (showError) showToast('Employee ID not found', 'error');
        setLoading(false);
        return false;
      }
      setEmployee(empRes.data.employee);

      const [attRes, permRes, halfRes, leaveRes] = await Promise.all([
        attendanceAPI.getByEmployee(employeeId.trim()).catch(() => ({ data: { attendance: null } })),
        permissionAPI.getByEmployee(employeeId.trim()).catch(() => ({ data: { permissions: [] } })),
        halfDayAPI.getByEmployee(employeeId.trim()).catch(() => ({ data: { halfDays: [] } })),
        leaveAPI.getByEmployee(employeeId.trim()).catch(() => ({ data: { leaves: [] } }))
      ]);

      setAttendance(attRes.data?.attendance || null);
      setMyPermissions(permRes.data?.permissions || []);
      setMyHalfDays(halfRes.data?.halfDays || []);
      setMyLeaves(leaveRes.data?.leaves || []);
      setLoading(false);
      return true;
    } catch {
      if (showError) showToast('Failed to verify Employee ID', 'error');
      setLoading(false);
      return false;
    }
  };

  const handleCheckIn = async () => {
    if (!employeeId.trim()) { showToast('Enter Employee ID first', 'error'); return; }
    setActionLoading('checkin');
    try {
      const res = await attendanceAPI.checkIn({ employeeId: employeeId.trim() });
      showToast(res.data.message || 'Checked in successfully!', 'success');
      await validateAndFetch(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Check in failed', 'error');
    } finally { setActionLoading(null); }
  };

  const handleCheckOut = async () => {
    if (!employeeId.trim()) { showToast('Enter Employee ID first', 'error'); return; }
    setActionLoading('checkout');
    try {
      const res = await attendanceAPI.checkOut({ employeeId: employeeId.trim() });
      showToast(res.data.message || 'Checked out successfully!', 'success');
      await validateAndFetch(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Check out failed', 'error');
    } finally { setActionLoading(null); }
  };

  const handleLunchRecord = async (type) => {
    if (!employeeId.trim()) { showToast('Enter Employee ID first', 'error'); return; }
    setActionLoading(`lunch-${type}`);
    try {
      const res = await attendanceAPI.lunchRecord({ employeeId: employeeId.trim(), type });
      showToast(res.data.message || `Lunch ${type} recorded successfully!`, 'success');
      await validateAndFetch(false);
    } catch (error) {
      showToast(error.response?.data?.message || `Lunch ${type} failed`, 'error');
    } finally { setActionLoading(null); }
  };

  const handlePermissionInOut = async (type) => {
    if (!employeeId.trim()) { showToast('Enter Employee ID first', 'error'); return; }
    setActionLoading(`permission-${type}`);
    try {
      const res = await permissionAPI.markInOut({ employeeId: employeeId.trim(), type });
      showToast(res.data.message || `Permission ${type} marked!`, 'success');
      await validateAndFetch(false);
    } catch (error) {
      showToast(error.response?.data?.message || `Permission ${type} failed`, 'error');
    } finally { setActionLoading(null); }
  };

  const handleViewDetails = async () => {
    const valid = await validateAndFetch(true);
    if (valid) setShowProfile(true);
  };

  const handleCancelRequest = async (type, id) => {
    try {
      if (type === 'permission') await permissionAPI.cancel(id);
      else if (type === 'halfday') await halfDayAPI.cancel(id);
      else if (type === 'leave') await leaveAPI.cancel(id);

      showToast('Request canceled successfully', 'success');
      validateAndFetch(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  const handleAddPermissionSlot = () => {
    setPermissionSlots([
      ...permissionSlots,
      { date: new Date().toISOString().split('T')[0], fromTime: '', toTime: '', reason: '' }
    ]);
  };

  const handleRemovePermissionSlot = (index) => {
    if (permissionSlots.length > 1) {
      setPermissionSlots(permissionSlots.filter((_, i) => i !== index));
    }
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...permissionSlots];
    updated[index][field] = value;
    setPermissionSlots(updated);
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) { showToast('Enter your Employee ID first', 'error'); return; }
    try {
      for (const slot of permissionSlots) {
        await permissionAPI.create({ employeeId: employeeId.trim(), ...slot });
      }
      showToast(`${permissionSlots.length} Permission request(s) submitted!`, 'success');
      setShowPermission(false);
      validateAndFetch(false);
    } catch (error) { showToast(error.response?.data?.message || 'Failed to submit', 'error'); }
  };

  const handleHalfDaySubmit = async (data) => {
    if (!employeeId.trim()) { showToast('Enter your Employee ID first', 'error'); return; }
    try {
      await halfDayAPI.create({ employeeId: employeeId.trim(), ...data });
      showToast('Half day request submitted! Status: Pending', 'success');
      setShowHalfDay(false);
      halfDayForm.reset();
      validateAndFetch(false);
    } catch (error) { showToast(error.response?.data?.message || 'Failed to submit', 'error'); }
  };

  const handleLeaveSubmit = async (data) => {
    if (!employeeId.trim()) { showToast('Enter your Employee ID first', 'error'); return; }
    try {
      await leaveAPI.create({ employeeId: employeeId.trim(), leaveType: 'Casual', reason: data.reason || 'Leave Application', ...data });
      showToast('Leave request submitted! Status: Pending', 'success');
      setShowLeave(false);
      leaveForm.reset();
      validateAndFetch(false);
    } catch (error) { showToast(error.response?.data?.message || 'Failed to submit', 'error'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between pb-16 sm:pb-0 font-sans">
      <ToastContainer />

      <div className="flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="bg-gradient-to-r from-[#1D4ED8] via-[#1E3A8A] to-slate-900 text-white shadow-lg sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner backdrop-blur-md">
                R
              </div>
              <div>
                <h1 className="text-white font-extrabold text-base tracking-wide flex items-center gap-1.5">
                  REHOBOTH <span className="text-blue-300 font-medium text-xs hidden sm:inline">Metal Mart</span>
                </h1>
                <p className="text-blue-200 text-[11px] font-semibold">Smart Attendance & Admin Portal</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/login')} 
              className="text-xs font-bold flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-all border border-white/20 shadow-xs active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-blue-300" />
              <span>Admin Portal</span>
            </button>
          </div>
        </header>

        {/* Hero Section with Live Clock & Employee Card Header */}
        <div className="bg-gradient-to-b from-[#1E3A8A] to-slate-100 text-slate-900 pt-6 pb-12 px-4 shadow-sm">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Header Profile Banner */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-white/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-blue-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20 border-2 border-white">
                    {employee ? employee.name?.charAt(0) : <User className="w-8 h-8 text-white" />}
                  </div>
                  {attendance && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${attendance.checkIn && !attendance.checkOut ? 'bg-emerald-500' : 'bg-slate-400'}`} title={attendance.checkIn && !attendance.checkOut ? 'Active Checked In' : 'Checked Out'}>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {getGreeting()} 👋
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {employee ? employee.name : 'Welcome Employee'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                    {employee ? `ID: ${employee.employeeId} • ${employee.jobRole || 'Staff'}` : 'Enter your Employee ID below to begin'}
                  </p>
                </div>
              </div>

              {/* Ticking Clock Widget */}
              <div className="w-full sm:w-auto bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between sm:justify-end gap-3 text-right">
                <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#1D4ED8] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">{formattedDate}</p>
                  <p className="text-base font-black text-slate-900 font-mono tracking-tight">{formattedTime}</p>
                </div>
              </div>
            </div>

            {/* Employee ID Search Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-lg border border-slate-200/80 flex items-center gap-2">
              <div className="relative flex-1">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text" 
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && validateAndFetch(true)}
                  placeholder="ENTER EMPLOYEE ID (e.g. EMP001)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all text-sm font-mono font-extrabold tracking-widest uppercase"
                />
              </div>

              <button
                onClick={() => validateAndFetch(true)}
                disabled={loading}
                className="bg-gradient-to-r from-[#1D4ED8] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Verify ID</span>
              </button>
            </div>

          </div>
        </div>

        {/* Main Content Dashboard */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 -mt-6 mb-8 space-y-6">

          {/* Today's Status Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Status Card 1: Today Status */}
            <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {attendance?.checkIn ? (attendance.checkOut ? 'Checked Out' : 'Present') : 'Not Checked'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {attendance?.status || 'No entry yet'}
                </p>
              </div>
            </div>

            {/* Status Card 2: Check-In Time */}
            <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check In</span>
                <LogIn className="w-4 h-4 text-[#1D4ED8]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {attendance ? formatTime12h(attendance.firstCheckIn || attendance.checkIn) : '--:--'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">First Punch In</p>
              </div>
            </div>

            {/* Status Card 3: Check-Out Time */}
            <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check Out</span>
                <LogOut className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {attendance ? formatTime12h(attendance.finalCheckOut || attendance.checkOut) : '--:--'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Final Punch Out</p>
              </div>
            </div>

            {/* Status Card 4: Working Hours */}
            <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Working Hours</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {attendance?.workingHours > 0 ? `${attendance.workingHours} hrs` : '0 hrs'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Logged today</p>
              </div>
            </div>
          </div>

          {/* Action Grid (Large App-Like Buttons with Modern Gradients & Micro-interactions) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Tap button to log attendance</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

              {/* 1. Check In */}
              <button 
                id="btn-check-in" 
                onClick={handleCheckIn} 
                disabled={loading || actionLoading === 'checkin'}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-emerald-500/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <LogIn className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'checkin' ? 'Saving...' : 'Check In'}</span>
                  <span className="text-[10px] text-emerald-100 opacity-90">Start Work Day</span>
                </div>
              </button>

              {/* 2. Check Out */}
              <button 
                id="btn-check-out" 
                onClick={handleCheckOut} 
                disabled={loading || actionLoading === 'checkout'}
                className="group relative overflow-hidden bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-rose-500/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'checkout' ? 'Saving...' : 'Check Out'}</span>
                  <span className="text-[10px] text-rose-100 opacity-90">End Work Day</span>
                </div>
              </button>

              {/* 3. Lunch Out */}
              <button 
                id="btn-lunch-out" 
                onClick={() => handleLunchRecord('out')} 
                disabled={loading || actionLoading === 'lunch-out'}
                className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-amber-400/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'lunch-out' ? 'Saving...' : 'Lunch Out'}</span>
                  <span className="text-[10px] text-amber-100 opacity-90">Start Lunch Break</span>
                </div>
              </button>

              {/* 4. Lunch In */}
              <button 
                id="btn-lunch-in" 
                onClick={() => handleLunchRecord('in')} 
                disabled={loading || actionLoading === 'lunch-in'}
                className="group relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-blue-400/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'lunch-in' ? 'Saving...' : 'Lunch In'}</span>
                  <span className="text-[10px] text-blue-100 opacity-90">Return From Lunch</span>
                </div>
              </button>

              {/* 5. Permission Out */}
              <button 
                id="btn-permission-out" 
                onClick={() => handlePermissionInOut('out')} 
                disabled={loading || actionLoading === 'permission-out'}
                className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-indigo-400/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'permission-out' ? 'Saving...' : 'Permission Out'}</span>
                  <span className="text-[10px] text-indigo-100 opacity-90">Start Permission</span>
                </div>
              </button>

              {/* 6. Permission In */}
              <button 
                id="btn-permission-in" 
                onClick={() => handlePermissionInOut('in')} 
                disabled={loading || actionLoading === 'permission-in'}
                className="group relative overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 border border-cyan-400/30"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold block">{actionLoading === 'permission-in' ? 'Saving...' : 'Permission In'}</span>
                  <span className="text-[10px] text-cyan-100 opacity-90">Return Permission</span>
                </div>
              </button>

            </div>

            {/* View Profile & Details Bar */}
            <button 
              id="btn-view-details" 
              onClick={handleViewDetails} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-[#1D4ED8] hover:from-black hover:to-blue-900 text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-blue-300" />
                <span>View Full Employee Profile & Salary Statement</span>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-300" />
            </button>

            {/* Request Forms Buttons Grid (Permission, Half Day, Leave) */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button 
                id="btn-permission" 
                onClick={() => { setPermissionSlots([{ date: new Date().toISOString().split('T')[0], fromTime: '', toTime: '', reason: '' }]); setShowPermission(true); }}
                className="bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold p-3 rounded-2xl border border-amber-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs active:scale-95"
              >
                <Bookmark className="w-5 h-5 text-amber-600" />
                <span>Permission</span>
              </button>

              <button 
                id="btn-half-day" 
                onClick={() => setShowHalfDay(true)}
                className="bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-bold p-3 rounded-2xl border border-blue-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs active:scale-95"
              >
                <Clock className="w-5 h-5 text-[#1D4ED8]" />
                <span>Half Day</span>
              </button>

              <button 
                id="btn-leave" 
                onClick={() => setShowLeave(true)}
                className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 font-bold p-3 rounded-2xl border border-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs active:scale-95"
              >
                <Palmtree className="w-5 h-5 text-emerald-600" />
                <span>Leave</span>
              </button>
            </div>
          </div>

        </main>

        <footer className="py-4 text-center border-t border-slate-200 bg-white text-slate-500 text-xs">
          <p>© 2026 REHOBOTH Metal Mart Attendance System • All Rights Reserved</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40 px-3 py-2 flex justify-around items-center">
        <button
          onClick={() => setActiveTab('punch')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'punch' ? 'text-[#1D4ED8]' : 'text-slate-500'}`}
        >
          <LogIn className="w-5 h-5" />
          <span>Punch</span>
        </button>

        <button
          onClick={() => { validateAndFetch(false); setActiveTab('dashboard'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'dashboard' ? 'text-[#1D4ED8]' : 'text-slate-500'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={handleViewDetails}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'profile' ? 'text-[#1D4ED8]' : 'text-slate-500'}`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => { validateAndFetch(false); setShowProfile(true); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'requests' ? 'text-[#1D4ED8]' : 'text-slate-500'}`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Requests</span>
        </button>
      </nav>

      {/* Profile Modal */}
      {showProfile && employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <EmployeeProfileCard
            employee={employee}
            attendance={attendance}
            permissions={myPermissions}
            halfDays={myHalfDays}
            leaves={myLeaves}
            onClose={() => setShowProfile(false)}
            onCancelRequest={handleCancelRequest}
          />
        </div>
      )}

      {/* Permission Modal */}
      <Modal isOpen={showPermission} onClose={() => setShowPermission(false)} title="Permission Request">
        <form onSubmit={handlePermissionSubmit} className="space-y-4">
          <div><label className="label text-xs">Employee ID</label><input type="text" value={employeeId} readOnly className="input-field text-xs bg-slate-50 font-mono font-bold text-slate-800" /></div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {permissionSlots.map((slot, index) => (
              <div key={index} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-[#1D4ED8] uppercase">Slot #{index + 1}</span>
                  {permissionSlots.length > 1 && (
                    <button type="button" onClick={() => handleRemovePermissionSlot(index)} className="text-xs text-rose-600 hover:text-rose-800 font-bold">
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="label text-xs">Date</label>
                  <input type="date" value={slot.date} onChange={(e) => handleSlotChange(index, 'date', e.target.value)} className="input-field text-xs rounded-xl" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">From Time</label>
                    <input type="time" value={slot.fromTime} onChange={(e) => handleSlotChange(index, 'fromTime', e.target.value)} className="input-field text-xs rounded-xl" required />
                  </div>
                  <div>
                    <label className="label text-xs">To Time</label>
                    <input type="time" value={slot.toTime} onChange={(e) => handleSlotChange(index, 'toTime', e.target.value)} className="input-field text-xs rounded-xl" required />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Reason</label>
                  <textarea value={slot.reason} onChange={(e) => handleSlotChange(index, 'reason', e.target.value)} rows={2} className="input-field text-xs rounded-xl resize-none" placeholder="State reason..." required />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={handleAddPermissionSlot} className="text-xs font-bold text-[#1D4ED8] hover:text-blue-800 bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Permission Slot
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPermission(false)} className="btn-secondary text-xs rounded-xl">Cancel</button>
              <button type="submit" className="btn-primary text-xs rounded-xl">Submit Request</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Half Day Modal */}
      <Modal isOpen={showHalfDay} onClose={() => setShowHalfDay(false)} title="Half Day Leave Request">
        <form onSubmit={halfDayForm.handleSubmit(handleHalfDaySubmit)} className="space-y-4">
          <div><label className="label text-xs">Employee ID</label><input type="text" value={employeeId} readOnly className="input-field text-xs bg-slate-50 font-mono font-bold text-slate-800" /></div>
          <div><label className="label text-xs">Date</label><input type="date" {...halfDayForm.register('date', { required: true })} className="input-field text-xs rounded-xl" defaultValue={new Date().toISOString().split('T')[0]} /></div>
          <div><label className="label text-xs">Session</label>
            <select {...halfDayForm.register('session', { required: true })} className="input-field text-xs rounded-xl">
              <option value="">Select session</option>
              <option value="Morning">Morning Session</option>
              <option value="Afternoon">Afternoon Session</option>
            </select>
          </div>
          <div><label className="label text-xs">Reason</label><textarea {...halfDayForm.register('reason', { required: true })} rows={3} className="input-field text-xs rounded-xl resize-none" placeholder="Reason for half day leave..." /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowHalfDay(false)} className="btn-secondary text-xs rounded-xl">Cancel</button>
            <button type="submit" className="btn-primary text-xs rounded-xl">Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal isOpen={showLeave} onClose={() => setShowLeave(false)} title="Leave Request">
        <form onSubmit={leaveForm.handleSubmit(handleLeaveSubmit)} className="space-y-4">
          <div><label className="label text-xs">Employee ID</label><input type="text" value={employeeId} readOnly className="input-field text-xs bg-slate-50 font-mono font-bold text-slate-800" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label text-xs">Start Date</label><input type="date" {...leaveForm.register('startDate', { required: true })} className="input-field text-xs rounded-xl" /></div>
            <div><label className="label text-xs">End Date</label><input type="date" {...leaveForm.register('endDate', { required: true })} className="input-field text-xs rounded-xl" /></div>
          </div>
          <div><label className="label text-xs">Reason</label><textarea {...leaveForm.register('reason', { required: false })} rows={3} className="input-field text-xs rounded-xl resize-none" placeholder="Reason for leave (optional)..." /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowLeave(false)} className="btn-secondary text-xs rounded-xl">Cancel</button>
            <button type="submit" className="btn-primary text-xs rounded-xl">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Landing;
