import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import { 
  LayoutDashboard, Users, DollarSign, CalendarCheck, Bookmark, 
  SunMedium, CalendarOff, BarChart3, Settings, LogOut, Menu, X, 
  ChevronLeft, ChevronRight, ShieldCheck, Clock, Bell, Search, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/employees', label: 'Employees', icon: Users },
  { path: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/admin/permissions', label: 'Permissions', icon: Bookmark },
  { path: '/admin/halfday', label: 'Half Day', icon: SunMedium },
  { path: '/admin/leave', label: 'Leaves', icon: CalendarOff },
  { path: '/admin/salary', label: 'Salaries', icon: DollarSign },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const currentPageLabel = navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Admin Portal';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Premium Collapsible Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#0F172A] text-white flex flex-col shadow-2xl transition-all duration-300 ${
          mobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-amber-500/40 flex items-center justify-center shadow-md shrink-0 overflow-hidden p-0.5 backdrop-blur-md">
              <img src="/logo.jpg" alt="Rehoboth Metal Mart Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            {!desktopCollapsed && (
              <div className="min-w-0">
                <h2 className="font-extrabold text-white text-sm tracking-wide truncate flex items-center gap-1.5">
                  REHOBOTH <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                </h2>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Metal Mart Admin System</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl hover:bg-white/10 text-blue-200 hover:text-white transition-all active:scale-95"
              title={desktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {desktopCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto pr-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                title={desktopCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold transition-all text-xs cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#1D4ED8] shadow-lg shadow-black/10' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  } ${desktopCollapsed ? 'lg:justify-center lg:px-2' : ''}`
                }
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1D4ED8]' : 'text-blue-200'}`} />
                {!desktopCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer & Admin User Card */}
        <div className="p-3.5 border-t border-white/10 bg-black/20 backdrop-blur-md">
          {!desktopCollapsed ? (
            <div className="flex items-center gap-3 mb-2.5 p-2.5 bg-white/10 rounded-2xl border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white to-blue-100 flex items-center justify-center text-[#1D4ED8] font-black text-sm shrink-0 shadow-md">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
                <p className="text-[10px] text-blue-200 font-semibold truncate">@{admin?.username || 'admin'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center font-black text-sm shadow-md">
                {admin?.name?.charAt(0) || 'A'}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={desktopCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white rounded-xl transition-all active:scale-95 ${
              desktopCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!desktopCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{currentPageLabel}</span>
                <span className="text-xs font-semibold text-slate-400 font-mono hidden sm:inline">/ Admin Portal</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Rehoboth Metal Mart ERP & Admin System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock Header Widget */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              <Clock className="w-4 h-4 text-[#1D4ED8]" />
              <span className="font-mono font-bold text-slate-800">{formattedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-black text-[#1D4ED8]">{formattedTime}</span>
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-950 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
              <div className="text-left">
                <p className="text-xs font-bold leading-none">{admin?.username || 'Admin'}</p>
                <p className="text-[9px] text-blue-700 font-semibold uppercase leading-tight">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Desktop Footer */}
        <footer className="hidden lg:block bg-white border-t border-slate-200/80 py-3 px-8 text-center text-xs text-slate-500 font-semibold">
          © 2026 REHOBOTH Metal Mart Admin System · Powered by Modern Commercial ERP Core
        </footer>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-2xl">
          {[
            { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/admin/employees', label: 'Employees', icon: Users },
            { path: '/admin/attendance', label: 'Logs', icon: CalendarCheck },
            { path: '/admin/permissions', label: 'Pass', icon: Bookmark },
            { path: '/admin/settings', label: 'Settings', icon: Settings },
          ].map((m) => {
            const Icon = m.icon;
            const active = location.pathname.startsWith(m.path);
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  active ? 'text-[#1D4ED8] font-black' : 'text-slate-500 font-bold'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{m.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
