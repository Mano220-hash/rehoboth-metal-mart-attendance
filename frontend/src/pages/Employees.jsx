import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../api';
import { 
  LoadingSpinner, EmptyState, Modal, PageHeader, StatusBadge, 
  useToast, ConfirmDialog, TableSkeleton, CardSkeleton 
} from '../components/UI';
import { useForm } from 'react-hook-form';
import { 
  Users, Search, Plus, LayoutGrid, List, Edit3, Trash2, 
  Phone, Briefcase, Calendar, DollarSign, RefreshCw, UserCheck, ShieldCheck, User
} from 'lucide-react';

const EmployeeForm = ({ defaultValues, onSubmit, loading, isEdit }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ defaultValues });
  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label text-xs">Employee ID *</label>
          <input 
            type="text" 
            {...register('employeeId', { required: true })} 
            className="input-field uppercase font-mono font-bold text-xs rounded-xl" 
            placeholder="e.g., EMP001" 
            disabled={isEdit} 
          />
          {errors.employeeId && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label text-xs">Full Name *</label>
          <input 
            type="text" 
            {...register('name', { required: true })} 
            className="input-field text-xs rounded-xl" 
            placeholder="Full name" 
          />
          {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label text-xs">Age *</label>
          <input 
            type="number" 
            {...register('age', { required: true, min: 16, max: 100 })} 
            className="input-field text-xs rounded-xl" 
            placeholder="Age" 
          />
          {errors.age && <p className="text-rose-500 text-xs mt-1">Valid age required</p>}
        </div>
        <div>
          <label className="label text-xs">Gender *</label>
          <select {...register('gender', { required: true })} className="input-field text-xs rounded-xl">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label text-xs">Phone *</label>
          <input 
            type="tel" 
            {...register('phone', { required: true })} 
            className="input-field text-xs rounded-xl" 
            placeholder="+91 XXXXX XXXXX" 
          />
          {errors.phone && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label text-xs">Job Role *</label>
          <input 
            type="text" 
            {...register('jobRole', { required: true })} 
            className="input-field text-xs rounded-xl" 
            placeholder="e.g., Welder, Staff, Manager" 
          />
          {errors.jobRole && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label text-xs">Monthly Salary (₹)</label>
          <input 
            type="number" 
            step="500" 
            {...register('monthlySalary')} 
            className="input-field text-xs rounded-xl font-bold" 
            placeholder="e.g. 30000" 
          />
        </div>
        <div>
          <label className="label text-xs">Joining Date *</label>
          <input 
            type="date" 
            {...register('joiningDate', { required: true })} 
            className="input-field text-xs rounded-xl" 
          />
          {errors.joiningDate && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label text-xs">Status</label>
          <select {...register('status')} className="input-field text-xs rounded-xl">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
        <button type="submit" disabled={loading} className="btn-primary text-xs rounded-xl">
          {loading ? 'Saving...' : isEdit ? 'Update Staff Profile' : 'Add Staff Member'}
        </button>
      </div>
    </form>
  );
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { showToast, ToastContainer } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getAll({ search, status: statusFilter });
      setEmployees(res.data.employees || []);
    } catch {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editEmployee) {
        await employeeAPI.update(editEmployee.employeeId, data);
        showToast('Employee profile updated successfully', 'success');
      } else {
        await employeeAPI.create(data);
        showToast('Employee added successfully', 'success');
      }
      setShowModal(false);
      setEditEmployee(null);
      fetchEmployees();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await employeeAPI.delete(deleteId);
      showToast('Employee deleted successfully', 'success');
      setDeleteId(null);
      fetchEmployees();
    } catch {
      showToast('Failed to delete employee', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-sans">
      <ToastContainer />
      <PageHeader
        title="Employee Directory & Admin Management"
        subtitle="Manage employee records, job roles, monthly salaries, and status badges"
        actions={
          <button
            onClick={() => { setEditEmployee(null); setShowModal(true); }}
            className="btn-primary text-xs flex items-center gap-1.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field sm:w-40 text-xs font-bold rounded-xl py-2.5"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button onClick={fetchEmployees} className="btn-secondary text-xs px-3 py-2.5 rounded-xl border border-slate-200">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Employee Grid or Table View */}
      {loading ? (
        viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} cols={6} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members found"
          subtitle="Try adjusting your search criteria or add a new employee."
          action={
            <button
              onClick={() => { setEditEmployee(null); setShowModal(true); }}
              className="btn-primary text-xs mt-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp._id}
              className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/80 hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white shrink-0">
                      {emp.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-slate-900 truncate">{emp.name}</h3>
                      <p className="text-xs font-mono font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded-md inline-block mt-0.5 border border-blue-100">{emp.employeeId}</p>
                    </div>
                  </div>
                  <StatusBadge status={emp.status} />
                </div>

                <div className="space-y-2.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Briefcase className="w-3.5 h-3.5 text-[#1D4ED8]" /> Job Role:
                    </span>
                    <span className="font-bold text-slate-800">{emp.jobRole || 'Staff'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-[#1D4ED8]" /> Phone:
                    </span>
                    <span className="font-semibold text-slate-700">{emp.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-[#1D4ED8]" /> Monthly Salary:
                    </span>
                    <span className="font-extrabold text-emerald-700">₹{(emp.monthlySalary || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" /> Joined:
                    </span>
                    <span className="font-medium text-slate-600">{new Date(emp.joiningDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                  className="px-3.5 py-2 text-xs font-bold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteId(emp.employeeId)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Monthly Salary</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Joining Date</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1D4ED8]">{emp.employeeId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-xs">
                          {emp.name?.charAt(0)}
                        </div>
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{emp.jobRole || 'Staff'}</td>
                    <td className="px-4 py-3.5">{emp.phone}</td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-700">
                      ₹{(emp.monthlySalary || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">{new Date(emp.joiningDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                          className="p-2 text-[#1D4ED8] hover:bg-blue-50 rounded-xl transition-colors"
                          title="Edit Staff Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(emp.employeeId)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditEmployee(null); }}
        title={editEmployee ? `Edit Staff Profile — ${editEmployee.employeeId}` : 'Add New Staff Member'}
        size="lg"
      >
        <EmployeeForm
          defaultValues={
            editEmployee
              ? {
                  ...editEmployee,
                  joiningDate: editEmployee.joiningDate
                    ? new Date(editEmployee.joiningDate).toISOString().split('T')[0]
                    : '',
                }
              : {
                  employeeId: '',
                  name: '',
                  age: '',
                  gender: '',
                  phone: '',
                  jobRole: '',
                  joiningDate: '',
                  status: 'Active',
                  monthlySalary: 0,
                }
          }
          onSubmit={handleSubmit}
          loading={formLoading}
          isEdit={!!editEmployee}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Confirm Employee Deletion"
        message={`Are you sure you want to permanently delete employee ${deleteId}? All associated attendance records will be removed.`}
      />
    </div>
  );
};

export default Employees;
