import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';

const AdminLogin = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: 'Rehoboth',
      password: '',
    }
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setError('');
    const result = await login(data);
    if (result.success) navigate('/admin/dashboard');
    else setError(result.message);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-md space-y-4">
        
        {/* Main Commercial Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1D4ED8] via-[#1E3A8A] to-slate-900 text-white p-8 text-center border-b border-white/10 relative overflow-hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3 border border-white/20 shadow-inner backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-blue-200" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">Admin Portal Login</h1>
            <p className="text-blue-200 mt-1 text-xs font-semibold">REHOBOTH Metal Mart Admin System & ERP</p>
          </div>

          {/* Form Container */}
          <div className="p-6 sm:p-8 space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('username', { required: 'Username is required' })}
                    placeholder="Enter admin username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    autoComplete="username"
                  />
                </div>
                {errors.username && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required' })}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                id="admin-login-btn"
                className="w-full bg-gradient-to-r from-[#1D4ED8] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 text-xs mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 text-center">
              <button 
                onClick={() => navigate('/')} 
                className="text-[#1D4ED8] hover:text-blue-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Employee Portal
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs">© 2026 REHOBOTH Metal Mart Attendance System</p>
      </div>
    </div>
  );
};

export default AdminLogin;
