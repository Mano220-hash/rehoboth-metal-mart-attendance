import React from 'react';
import { attendanceAPI } from '../api';
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, Info, X, 
  HelpCircle, ChevronRight, Inbox, Loader2, Sparkles
} from 'lucide-react';

export const SafeIcon = ({ icon: Icon, className = "w-5 h-5" }) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && (Icon.$$typeof || Icon.render))) {
    const IconComp = Icon;
    return <IconComp className={className} />;
  }
  if (typeof Icon === 'string' || typeof Icon === 'number') {
    return <span className="text-[1em]">{Icon}</span>;
  }
  return null;
};

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 animate-fade-in">
      <Loader2 className={`${sizes[size]} text-[#1D4ED8] animate-spin`} />
      {text && <p className="text-xs font-bold text-slate-500">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="w-full space-y-3 animate-fade-in p-4">
    <div className="h-10 skeleton w-full rounded-2xl" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-8 skeleton flex-1 rounded-xl" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-48 skeleton rounded-3xl p-6" />
    ))}
  </div>
);

export const StatSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-28 skeleton rounded-2xl" />
    ))}
  </div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    Present: 'badge-present',
    Approved: 'badge-present',
    Active: 'badge-present',
    Absent: 'badge-absent',
    Rejected: 'badge-absent',
    Inactive: 'badge-absent',
    Cancelled: 'badge-absent',
    'Half Day': 'badge-halfday',
    Permission: 'badge-permission',
    Pending: 'badge-pending',
    'In Progress': 'badge-permission',
    Completed: 'badge-present',
  };

  const icons = {
    Present: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    Approved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    Active: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    Absent: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    Rejected: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    'Half Day': <Clock className="w-3.5 h-3.5 text-amber-600" />,
    Permission: <Info className="w-3.5 h-3.5 text-blue-600" />,
    Pending: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
    'In Progress': <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
  };

  const badgeClass = map[status] || 'badge-pending';
  const icon = icons[status] || null;

  return (
    <span className={badgeClass}>
      {icon}
      <span>{typeof status === 'string' || typeof status === 'number' ? status : String(status || '')}</span>
    </span>
  );
};

export const formatTime12h = (timeStr) => {
  if (!timeStr || timeStr === '—' || timeStr === '-' || timeStr === 'null' || timeStr === 'undefined') return '—';
  if (/am|pm/i.test(timeStr)) return timeStr;
  
  if (timeStr.includes('T') || timeStr.includes('Z')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
  
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle, onClick }) => {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
            {value ?? '—'}
          </h3>
          {subtitle && <p className="text-[11px] font-bold text-slate-500 mt-1.5 truncate">{subtitle}</p>}
        </div>
        
        {Icon && (
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1D4ED8] shadow-xs">
            <SafeIcon icon={Icon} className="w-5 h-5 text-[#1D4ED8]" />
          </div>
        )}
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in" 
        onClick={() => onClose?.()} 
      />
      <div className={`relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full ${sizes[size]} animate-fade-in max-h-[90vh] flex flex-col overflow-hidden my-auto z-10`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">{title}</h3>
          <button 
            type="button"
            onClick={() => onClose?.()} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-xs">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: Icon = Inbox, title = 'No data found', subtitle = '', action = null }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in font-sans">
    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center mb-3 shadow-xs">
      <SafeIcon icon={Icon} className="w-7 h-7" />
    </div>
    <h4 className="text-base font-extrabold text-slate-800 mb-1">{title}</h4>
    {subtitle && <p className="text-xs text-slate-500 max-w-sm mb-4 font-medium">{subtitle}</p>}
    {action}
  </div>
);

export const Toast = ({ message, type = 'success', onClose }) => {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    error: 'bg-rose-50 border-rose-200 text-rose-950',
    info: 'bg-blue-50 border-blue-200 text-blue-950',
  };
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${styles[type]} shadow-xl animate-slide-in min-w-[280px] max-w-md text-xs font-bold`}>
      {icons[type]}
      <p className="flex-1 leading-snug">{message}</p>
      <button onClick={onClose} className="p-1 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);
  const showToast = React.useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-5 right-5 z-50 space-y-2.5 max-w-md">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm Delete', loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-4 font-sans">
      <p className="text-xs text-slate-600 leading-relaxed font-medium">{message}</p>
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
        <button onClick={onClose} disabled={loading} className="btn-secondary text-xs rounded-xl">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="btn-danger text-xs rounded-xl shadow-md">
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </div>
  </Modal>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 font-sans">
    <div>
      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-xs text-slate-500 font-semibold mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
  </div>
);

export const useServerDate = () => {
  const [serverDate, setServerDate] = React.useState(() => {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } catch (e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  });
  const [formattedDate, setFormattedDate] = React.useState(() => {
    try {
      const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const [y, m, day] = dateStr.split('-');
      return `${day}-${m}-${y}`;
    } catch (e) {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    }
  });
  const [lastRefreshed, setLastRefreshed] = React.useState(Date.now());

  const fetchServerDate = React.useCallback(async () => {
    try {
      const res = await attendanceAPI.getServerDate();
      if (res.data?.success && res.data?.serverDate) {
        const sDate = res.data.serverDate;
        const fDate = res.data.formattedDate || formatDateDDMMYYYY(sDate);
        setServerDate(sDate);
        setFormattedDate(fDate);
        setLastRefreshed(Date.now());

        return res.data.msUntilMidnight || null;
      }
    } catch (e) {
      console.error('Error fetching server date:', e);
    }
    return null;
  }, []);

  React.useEffect(() => {
    let midnightTimer = null;
    let isMounted = true;

    const setupMidnightRefresh = async () => {
      const msLeft = await fetchServerDate();
      if (!isMounted) return;

      if (msLeft && msLeft > 0) {
        midnightTimer = setTimeout(async () => {
          console.log('⏰ Midnight 12:00 AM reached! Auto-refreshing server date...');
          await fetchServerDate();
          setupMidnightRefresh();
        }, msLeft + 500);
      }
    };

    setupMidnightRefresh();

    const pollInterval = setInterval(() => {
      fetchServerDate();
    }, 10000);

    return () => {
      isMounted = false;
      if (midnightTimer) clearTimeout(midnightTimer);
      clearInterval(pollInterval);
    };
  }, [fetchServerDate]);

  return { serverDate, formattedDate, refreshServerDate: fetchServerDate, lastRefreshed };
};
