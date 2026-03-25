import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { setAuthToken, setRefreshToken, fetchCurrentUser } from '../utils/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useProject();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');

    if (token) {
      setAuthToken(token);
      if (refresh) setRefreshToken(refresh);
      
      fetchCurrentUser()
        .then((me) => {
          setCurrentUser({
            id: me.id,
            name: me.full_name,
            email: me.email,
            role: me.role,
            status: me.status,
            avatarUrl: me.avatar_url,
            planTier: me.plan_tier,
            subscriptionStatus: me.subscription_status || 'active'
          });
          navigate('/dashboard');
        })
        .catch(() => {
          setAuthToken(null);
          setRefreshToken(null);
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [location, navigate, setCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-indigo-600 dark:text-indigo-400">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Authenticating with Google...</p>
      </div>
    </div>
  );
}
