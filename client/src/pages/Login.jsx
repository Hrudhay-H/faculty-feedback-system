import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as z from 'zod';

// Login Validation Schema via Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address format' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
});

function Login() {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // If already authenticated, redirect to appropriate portal dashboard
  if (isAuthenticated && user) {
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setApiError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(data.email, data.password);
      // Route dynamically based on user role
      if (loggedUser.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (loggedUser.role === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">University Portal</h1>
        <p className="text-sm text-slate-600">Faculty Feedback Management System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* API Errors Alert */}
            {apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-sm font-medium flex items-start space-x-2">
                <svg className="h-5 w-5 flex-shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Academic Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled={submitting}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="e.g. john.smith@university.edu"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  disabled={submitting}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>


            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            className="w-full px-5 py-3 flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span>💡 Demo Login Credentials</span>
            <span>{showDemoCredentials ? '▲' : '▼'}</span>
          </button>
          
          {showDemoCredentials && (
            <div className="px-5 py-4 border-t border-slate-200 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100 items-center">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Role</span>
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Email</span>
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Password</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-bold text-slate-800">System Admin</span>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate">admin@university.edu</code>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">adminpassword</code>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-bold text-slate-800">Faculty</span>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate">john.smith@university.edu</code>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">facultypassword</code>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-bold text-slate-800">Student</span>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate">student1@student.university.edu</code>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">studentpassword</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}

export default Login;
