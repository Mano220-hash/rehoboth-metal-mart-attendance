import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 15000, headers: { 'Content-Type': 'application/json' } });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    const isAuthRoute = error.config?.url?.includes('/auth/login');
    if (!isAuthRoute && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }
  }
  return Promise.reject(error);
});

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  changePassword: (data) => API.put('/auth/change-password', data),
  changeCredentials: (data) => API.put('/auth/credentials', data),
  resetDefaultCredentials: () => API.post('/auth/credentials/reset'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const employeeAPI = {
  getAll: (params) => API.get('/employees', { params }),
  getOne: (id) => API.get(`/employees/${id}`),
  getById: (id) => API.get(`/employees/validate/${id}`).catch(() => API.get(`/employees/${id}`)),
  validate: (id) => API.get(`/employees/validate/${id}`),
  create: (data) => API.post('/employees', data),
  update: (id, data) => API.put(`/employees/${id}`, data),
  delete: (id) => API.delete(`/employees/${id}`),
};

export const attendanceAPI = {
  getServerDate: () => API.get('/attendance/server-date'),
  checkIn: (data) => API.post('/attendance/checkin', data),
  checkOut: (data) => API.post('/attendance/checkout', data),
  recordLunch: (data) => API.post('/attendance/lunch', data),
  lunchRecord: (data) => API.post('/attendance/lunch', data),
  getTodayStatus: (id) => API.get(`/attendance/today/${id}`),
  getByEmployee: (id) => API.get(`/attendance/today/${id}`),
  getAll: (params) => API.get('/attendance', { params }),
  getDashboardStats: () => API.get('/attendance/stats/dashboard'),
  getPercentage: (params) => API.get('/attendance/percentage', { params }),
};

export const permissionAPI = {
  create: (data) => API.post('/permissions', data),
  getAll: (params) => API.get('/permissions', { params }),
  getForEmployee: (id) => API.get(`/permissions/employee/${id}`),
  getByEmployee: (id) => API.get(`/permissions/employee/${id}`),
  review: (id, data) => API.put(`/permissions/${id}/review`, data),
  getStats: (params) => API.get('/permissions/stats', { params }),
  recordOut: (data) => API.post('/permissions/out', data),
  recordReturn: (data) => API.post('/permissions/in', data),
  recordIn: (data) => API.post('/permissions/in', data),
  markInOut: (data) => data.type === 'out' ? API.post('/permissions/out', data) : API.post('/permissions/in', data),
  cancel: (id, data) => API.put(`/permissions/${id}/cancel`, data),
  adminCancel: (id) => API.put(`/permissions/${id}/admin-cancel`),
};

export const halfDayAPI = {
  create: (data) => API.post('/halfday', data),
  getAll: (params) => API.get('/halfday', { params }),
  getForEmployee: (id) => API.get(`/halfday/employee/${id}`),
  getByEmployee: (id) => API.get(`/halfday/employee/${id}`),
  review: (id, data) => API.put(`/halfday/${id}/review`, data),
  cancel: (id, data) => API.put(`/halfday/${id}/cancel`, data),
  adminCancel: (id) => API.put(`/halfday/${id}/admin-cancel`),
};

export const leaveAPI = {
  create: (data) => API.post('/leaves', data),
  getAll: (params) => API.get('/leaves', { params }),
  getForEmployee: (id) => API.get(`/leaves/employee/${id}`),
  getByEmployee: (id) => API.get(`/leaves/employee/${id}`),
  review: (id, data) => API.put(`/leaves/${id}/review`, data),
  update: (id, data) => API.put(`/leaves/${id}`, data),
  delete: (id) => API.delete(`/leaves/${id}`),
  cancel: (id, data) => API.put(`/leaves/${id}/cancel`, data),
  adminCancel: (id) => API.put(`/leaves/${id}/admin-cancel`),
};

export const salaryAPI = {
  getSalaryList: (params) => API.get('/salary', { params }),
  getEmployeeSalary: (id, params) => API.get(`/salary/employee/${id}`, { params }),
  updateSalary: (id, data) => API.put(`/salary/${id}`, data),
};

export const reportAPI = {
  getReport: (params) => API.get('/reports', { params }),
  exportReport: (params) => API.get('/reports/export', { params, responseType: 'blob' }),
  exportSalaryReport: (params) => API.get('/reports/export-salary', { params, responseType: 'blob' }),
  getPermissionReport: (params) => API.get('/reports/permissions', { params }),
  exportPermissionReport: (params) => API.get('/reports/permissions/export', { params, responseType: 'blob' }),
};

export const settingsAPI = {
  get: () => API.get('/settings'),
  update: (data) => API.put('/settings', data),
};

export const cleanupAPI = {
  preview: (data) => API.post('/cleanup/preview', data),
  exportBackup: (data) => API.post('/cleanup/backup-export', data, { responseType: 'blob' }),
  execute: (data) => API.post('/cleanup/execute', data),
  getAuditLogs: () => API.get('/cleanup/audit-logs'),
  clearAuditLogs: () => API.delete('/cleanup/audit-logs'),
};

export default API;
