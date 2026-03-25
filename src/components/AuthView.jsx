import React, { useState } from 'react';
import { Network } from 'lucide-react';
import { ENTERPRISE_ROLES } from '../config/constants';
import { useProject } from '../context/ProjectContext';
import { loginUser, registerUser, setAuthToken, setRefreshToken } from '../utils/api';

export default function AuthView() {
  const { users, setUsers, setCurrentUser } = useProject();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Product Manager' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    setIsLoading(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      setValidationError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    if (!isLogin && !strongPasswordRegex.test(formData.password)) {
      setValidationError('Password must be 8+ chars with uppercase, lowercase, and a number.');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const response = await loginUser({ email: normalizedEmail, password: formData.password });
        setAuthToken(response.access_token);
        setRefreshToken(response.refresh_token);
        setCurrentUser({
          id: response.user.id,
          name: response.user.full_name,
          email: response.user.email,
          role: response.user.role,
          status: response.user.status,
          avatarUrl: response.user.avatar_url,
          planTier: response.user.plan_tier || 'Seed',
          subscriptionStatus: response.user.subscription_status || 'active'
        });
      } else {
        const response = await registerUser({
          full_name: formData.name.trim(),
          email: normalizedEmail,
          password: formData.password,
          role: formData.role,
          workspace_name: 'Default Space'
        });
        setAuthToken(response.access_token);
        setRefreshToken(response.refresh_token);
        const newUser = {
          id: response.user.id,
          name: response.user.full_name,
          email: response.user.email,
          role: response.user.role,
          status: response.user.status,
          avatarUrl: response.user.avatar_url,
          planTier: response.user.plan_tier || 'Seed',
          subscriptionStatus: response.user.subscription_status || 'active'
        };
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
      }
    } catch (err) {
      setError(String(err.message || 'Authentication failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600 dark:text-indigo-400 mb-4"><Network size={48} /></div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to Cynapse Enterprise</h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">Hybrid Database Architecture</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Enterprise Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {ENTERPRISE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            )}

            {validationError && <div className="text-amber-700 dark:text-amber-300 text-sm font-medium bg-amber-50 dark:bg-amber-900/40 p-3 rounded">{validationError}</div>}
            {error && <div className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/40 p-3 rounded">{String(error)}</div>}

            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all">
              {isLoading ? 'Authenticating...' : (isLogin ? 'Secure Sign in' : 'Register Account')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-slate-600" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Or</span></div>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" onClick={() => window.location.href='/api/auth/google'} className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
              
              <button type="button" onClick={() => window.location.href='/api/auth/apple'} className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.253 3.513 7.59 9.053 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.88 3.5-.83 1.19.04 2.29.54 2.92 1.4-2.52 1.48-2.06 4.93.41 5.92-.72 1.83-1.63 4.14-2.91 5.7zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.01 4.2-3.74 4.25z"/></svg>
                Continue with Apple
              </button>

              <button type="button" onClick={() => window.location.href='/api/auth/sso'} className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                Log in with Organization SSO
              </button>
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium text-sm">
                {isLogin ? 'Create a new account' : 'Sign in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
