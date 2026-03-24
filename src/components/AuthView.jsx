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
