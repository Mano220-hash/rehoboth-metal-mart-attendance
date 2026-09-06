import React, { useState, useEffect } from 'react';
import { salaryAPI, reportAPI } from '../api';
import { TableSkeleton, EmptyState, Modal, PageHeader, StatCard, useToast } from '../components/UI';
import { useForm } from 'react-hook-form';
import { 
  DollarSign, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Download, 
  RotateCcw, 
  Search, 
  Edit3, 
  Save, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Salary = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const { showToast, ToastContainer } = useToast();

  const fetchSalaryList = async () => {
    setLoading(true);
    try {
      const res = await salaryAPI.getSalaryList({ month, year, search });
      setSalaryData(res.data);
    } catch (error) {
      showToast('Failed to load salary data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchSalaryList, 300);
    return () => clearTimeout(timer);
  }, [month, year, search]);

  const handleExportSalary = async () => {
    setExportLoading(true);
    try {
      const res = await reportAPI.exportSalaryReport({ month, year });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salary_Report_${months[month - 1]}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Salary report downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to export salary report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleEditSalary = (emp) => {
    setEditModal(emp);
    reset({
      monthlySalary: emp.monthlySalary || 0,
      salaryType: emp.salaryType || 'Monthly',
      salaryStatus: emp.salaryStatus || 'Active',
    });
  };

  const handleSaveSalary = async (data) => {
    setSaveLoading(true);
    try {
      await salaryAPI.updateSalary(editModal.employeeId, data);
      showToast(`Salary setup updated for ${editModal.name}`, 'success');
      setEditModal(null);
      fetchSalaryList();
    } catch (error) {
      showToast('Failed to update salary', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const summary = salaryData?.summary || { totalEmployees: 0, totalMonthlySalary: 0, totalFinalPayroll: 0, avgAttendance: 0 };
  const list = salaryData?.salaryList || [];

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />

      <PageHeader
        title="Salary & Payroll Management"
        subtitle={`Attendance-calculated payroll statement for ${months[month - 1]} ${year}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExportSalary}
              disabled={exportLoading || list.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportLoading ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>
            <button onClick={fetchSalaryList} className="btn-secondary text-xs rounded-xl p-2">
              <RotateCcw className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={summary.totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Base Monthly Payroll"
          value={`₹${summary.totalMonthlySalary.toLocaleString('en-IN')}`}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          title="Calculated Net Payroll"
          value={`₹${summary.totalFinalPayroll.toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Based on attendance"
        />
        <StatCard
          title="Avg Attendance Rate"
          value={`${summary.avgAttendance}%`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Filter Box */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <label className="label text-xs">Search Employee</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field text-xs pl-10 py-2.5 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs">Select Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field text-xs py-2.5 rounded-xl font-bold"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Select Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field text-xs py-2.5 rounded-xl font-bold"
              min="2020"
              max="2035"
            />
          </div>

          <div className="flex items-end h-full">
            <button
              onClick={() => {
                setMonth(new Date().getMonth() + 1);
                setYear(new Date().getFullYear());
                setSearch('');
              }}
              className="btn-secondary text-xs w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={10} />
        ) : list.length === 0 ? (
          <EmptyState icon={DollarSign} title="No Salary Records Found" subtitle="Try adjusting search or month filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Monthly Salary</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Present Days</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Absent Days</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Turnout %</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Daily Salary</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Net Salary</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {list.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{emp.employeeId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#1D4ED8] font-bold text-xs flex items-center justify-center">
                          {emp.name?.charAt(0)}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-extrabold">
                      ₹{emp.monthlySalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-emerald-600 font-extrabold">
                      {emp.presentDays} / {emp.totalDaysInMonth}
                    </td>
                    <td className="px-4 py-3.5 text-rose-500 font-bold">{emp.absentDays}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        emp.attendancePercentage >= 75
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.attendancePercentage >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {emp.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      ₹{emp.dailySalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-black text-emerald-700 text-sm">
                      ₹{emp.finalSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                        {emp.salaryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleEditSalary(emp)}
                        className="px-3 py-1.5 text-xs font-bold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5 ml-auto active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Salary Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Salary Setup — ${editModal?.name} (${editModal?.employeeId})`}
        size="sm"
      >
        {editModal && (
          <form onSubmit={handleSubmit(handleSaveSalary)} className="space-y-4">
            <div>
              <label className="label text-xs">Monthly Base Salary (₹) *</label>
              <input
                type="number"
                step="500"
                {...register('monthlySalary', { required: true, min: 0 })}
                className="input-field text-xs font-bold rounded-xl"
                placeholder="e.g. 30000"
              />
            </div>

            <div>
              <label className="label text-xs">Salary Type</label>
              <select {...register('salaryType')} className="input-field text-xs rounded-xl font-bold">
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="label text-xs">Salary Status</label>
              <select {...register('salaryStatus')} className="input-field text-xs rounded-xl font-bold">
                <option value="Active">Active</option>
                <option value="Configured">Configured</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-xs space-y-1.5 text-blue-950">
              <p className="font-bold">Formula preview ({months[month - 1]} {year}):</p>
              <p className="text-slate-600">Daily Rate: ₹{editModal.monthlySalary} ÷ {editModal.totalDaysInMonth} days</p>
              <p className="text-slate-600">Present: {editModal.presentDays} days</p>
              <p className="font-black text-[#1D4ED8] text-sm mt-1 pt-1.5 border-t border-blue-200">
                Calculated Net Salary: ₹{((editModal.monthlySalary / editModal.totalDaysInMonth) * editModal.presentDays).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="btn-secondary text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="btn-primary text-xs rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Saving...' : 'Save Salary'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Salary;
