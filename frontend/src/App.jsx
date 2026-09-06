import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AttendancePage from './pages/AttendancePage';
import Permissions from './pages/Permissions';
import HalfDay from './pages/HalfDay';
import Leave from './pages/Leave';
import Salary from './pages/Salary';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PermissionReports from './pages/PermissionReports';
import AdminLayout from './components/AdminLayout';

const ProtectedRoute = ({ children }) => { const { isAuthenticated } = useAuth(); return isAuthenticated ? children : <Navigate to="/admin/login" replace />; };
const PublicAdminRoute = ({ children }) => { const { isAuthenticated } = useAuth(); return !isAuthenticated ? children : <Navigate to="/admin/dashboard" replace />; };

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/admin/login" element={<PublicAdminRoute><AdminLogin /></PublicAdminRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="employees" element={<Employees />} />
      <Route path="salary" element={<Salary />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="permissions" element={<Permissions />} />
      <Route path="permission-reports" element={<PermissionReports />} />
      <Route path="halfday" element={<HalfDay />} />
      <Route path="leave" element={<Leave />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>
);

export default App;
