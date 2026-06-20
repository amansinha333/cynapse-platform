import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo, { LOGO_CLASS } from './components/ui/Logo';
import { useProject } from './context/ProjectContext';
import {
  acceptInvite,
  fetchInvitePreview,
  setAuthToken,
  setRefreshToken,
} from './utils/api';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentUser } = useProject();
  const token = searchParams.get('token') || '';

  const [preview, setPreview] = useState(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing invite token.');
      return;
    }
    fetchInvitePreview(token)
      .then((data) => {
        setPreview(data);
        setFullName('');
      })
      .catch((err) => setError(String(err.message || 'Invalid invite link.')));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await acceptInvite({ token, full_name: fullName.trim(), password });
      setAuthToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setCurrentUser({
        id: response.user.id,
        name: response.user.full_name,
        email: response.user.email,
        role: response.user.role,
        status: response.user.status,
        avatarUrl: response.user.avatar_url,
        workspaceId: response.user.workspace_id,
        planTier: 'Seed',
        subscriptionStatus: 'active',
      });
      navigate('/dashboard/list');
    } catch (err) {
      setError(String(err.message || 'Could not accept invite.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <Logo className={LOGO_CLASS} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center mb-2">Accept your invite</h1>
        {preview ? (
          <p className="text-sm text-slate-600 text-center mb-6">
            Join <span className="font-semibold">{preview.workspace_name || 'workspace'}</span> as{' '}
            <span className="font-semibold">{preview.role}</span>
            <br />
            <span className="font-mono text-slate-500">{preview.email}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500 text-center mb-6">Validating invite…</p>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {preview && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Join workspace'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/dashboard" className="text-emerald-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
