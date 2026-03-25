import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Eye, EyeOff, KeyRound, Loader2, Settings, Users, Workflow } from 'lucide-react';
import { createCheckoutSession, fetchCurrentUser, getSecureKey, setSecureKey, updateMyProfile } from '../utils/api';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

const NAV_ITEMS = [
  { id: 'general', label: 'General settings', group: 'Personal Settings' },
  { id: 'notifications', label: 'Notification settings', group: 'Personal Settings' },
  { id: 'apikeys', label: 'API keys', group: 'Personal Settings' },
  { id: 'system', label: 'System', group: 'Admin Settings' },
  { id: 'apps', label: 'Apps', group: 'Admin Settings' },
  { id: 'spaces', label: 'Spaces', group: 'Admin Settings' },
  { id: 'workitems', label: 'Work items', group: 'Admin Settings' },
  { id: 'marketplace', label: 'Marketplace apps', group: 'Admin Settings' },
  { id: 'users', label: 'User management', group: 'Atlassian admin settings' },
  { id: 'billing', label: 'Billing', group: 'Atlassian admin settings' }
];

export default function EnterpriseSettings() {
  const { setGlobalApiKey, setPineconeKey, setSerpapiKey } = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentContext = searchParams.get('context') || 'personal';
  const currentTab = searchParams.get('tab') || 'general';
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysSaving, setKeysSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({ gemini: false, pinecone: false, serpapi: false });
  const [apiKeysForm, setApiKeysForm] = useState({ gemini: '', pinecone: '', serpapi: '', pineconeIndex: 'cynapse-compliance' });
  const [billingLoading, setBillingLoading] = useState('');
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', avatar: null });
  const [generalPrefs, setGeneralPrefs] = useState({
    language: 'English - US',
    timezone: 'GMT+5:30',
    weekStart: 'Monday',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailDigests: true,
    slackMentions: true,
    criticalAlerts: true,
  });

  const contextTabs = useMemo(() => {
    if (currentContext === 'personal') {
      return NAV_ITEMS.filter((i) => ['general', 'notifications', 'apikeys'].includes(i.id));
    }
    if (currentContext === 'admin') {
      return NAV_ITEMS.filter((i) => ['system', 'apps', 'spaces', 'workitems', 'marketplace'].includes(i.id));
    }
    return NAV_ITEMS.filter((i) => ['users', 'billing'].includes(i.id));
  }, [currentContext]);

  const loadData = async () => {
    try {
      const user = await fetchCurrentUser();
      setMe(user);
      setProfileForm({ fullName: user.full_name || '', email: user.email || '', avatar: null });
    } catch (err) {
      setError(String(err.message || 'Failed to load settings data'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentTab !== 'apikeys') return;
    const loadKeys = async () => {
      try {
        setError('');
        setSuccess('');
        setKeysLoading(true);
        const [gem, pin, serp, idx] = await Promise.all([
          getSecureKey('gemini_api_key'),
          getSecureKey('pinecone_api_key'),
          getSecureKey('search_api_key'),
          getSecureKey('pinecone_index'),
        ]);
        setApiKeysForm({
          gemini: gem?.value || '',
          pinecone: pin?.value || '',
          serpapi: serp?.value || '',
          pineconeIndex: idx?.value || 'cynapse-compliance',
        });
      } catch (err) {
        setError(String(err.message || 'Failed to load API keys'));
      } finally {
        setKeysLoading(false);
      }
    };
    loadKeys();
  }, [currentTab]);

  const onSaveKeys = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setKeysSaving(true);
      await Promise.all([
        setSecureKey('gemini_api_key', apiKeysForm.gemini.trim()),
        setSecureKey('pinecone_api_key', apiKeysForm.pinecone.trim()),
        setSecureKey('search_api_key', apiKeysForm.serpapi.trim()),
        setSecureKey('pinecone_index', apiKeysForm.pineconeIndex.trim() || 'cynapse-compliance'),
      ]);
      setGlobalApiKey(apiKeysForm.gemini.trim());
      setPineconeKey(apiKeysForm.pinecone.trim());
      setSerpapiKey(apiKeysForm.serpapi.trim());
      setSuccess('API keys saved securely.');
    } catch (err) {
      setError(String(err.message || 'Failed to save API keys'));
    } finally {
      setKeysSaving(false);
    }
  };

  useEffect(() => {
    if (!contextTabs.some((t) => t.id === currentTab) && contextTabs.length > 0) {
      setSearchParams({ context: currentContext, tab: contextTabs[0].id });
    }
  }, [currentContext, currentTab, contextTabs, setSearchParams]);

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const body = new FormData();
    body.append('full_name', profileForm.fullName.trim());
    body.append('email', profileForm.email.trim().toLowerCase());
    if (profileForm.avatar) body.append('avatar', profileForm.avatar);
    try {
      await updateMyProfile(body);
      setSuccess('Profile updated successfully.');
      await loadData();
    } catch (err) {
      setError(String(err.message || 'Profile update failed'));
    } finally {
      setSaving(false);
    }
  };

  const renderPanel = () => {
    switch (currentTab) {
      case 'general':
        return (
        <form onSubmit={onSaveProfile} className="space-y-4 max-w-3xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={18} /> General settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block mb-1 text-slate-500">Language</span>
              <select
                value={generalPrefs.language}
                onChange={(e) => setGeneralPrefs((p) => ({ ...p, language: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
              >
                <option>English - US</option>
                <option>English - UK</option>
                <option>Hindi</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-slate-500">Timezone</span>
              <select
                value={generalPrefs.timezone}
                onChange={(e) => setGeneralPrefs((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
              >
                <option>GMT+5:30</option>
                <option>GMT+0</option>
                <option>GMT-8</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block mb-1 text-slate-500">Start week on</span>
              <select
                value={generalPrefs.weekStart}
                onChange={(e) => setGeneralPrefs((p) => ({ ...p, weekStart: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
              >
                <option>Monday</option>
                <option>Sunday</option>
              </select>
            </label>
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </form>
        );
      case 'notifications':
        return (
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><Bell size={18} /> Notification settings</h2>
          <div className="grid gap-4">
            <label className="border rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm">Email Digests</span>
              <input type="checkbox" checked={notificationPrefs.emailDigests} onChange={(e) => setNotificationPrefs((p) => ({ ...p, emailDigests: e.target.checked }))} className="accent-indigo-600" />
            </label>
            <label className="border rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm">Slack Mentions</span>
              <input type="checkbox" checked={notificationPrefs.slackMentions} onChange={(e) => setNotificationPrefs((p) => ({ ...p, slackMentions: e.target.checked }))} className="accent-indigo-600" />
            </label>
            <label className="border rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm">Critical Compliance Alerts</span>
              <input type="checkbox" checked={notificationPrefs.criticalAlerts} onChange={(e) => setNotificationPrefs((p) => ({ ...p, criticalAlerts: e.target.checked }))} className="accent-indigo-600" />
            </label>
          </div>
        </div>
        );
      case 'apikeys':
        return (
          <form onSubmit={onSaveKeys} className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-bold flex items-center gap-2"><KeyRound size={18} /> API keys</h2>
            <p className="text-sm text-slate-500">
              Keys are stored encrypted per-user. This is where you update Gemini/Pinecone/SerpAPI when the AI engine is degraded.
            </p>

            {keysLoading ? (
              <div className="text-sm text-slate-500">Loading keys…</div>
            ) : (
              <div className="grid gap-4">
                <label className="text-sm">
                  <span className="block mb-1 text-slate-500">Gemini API Key</span>
                  <div className="flex items-center gap-2">
                    <input
                      type={showKeys.gemini ? 'text' : 'password'}
                      value={apiKeysForm.gemini}
                      onChange={(e) => setApiKeysForm((p) => ({ ...p, gemini: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
                      placeholder="AIza..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((s) => ({ ...s, gemini: !s.gemini }))}
                      className="p-2 rounded-lg border bg-white dark:bg-slate-800"
                      title={showKeys.gemini ? 'Hide' : 'Show'}
                    >
                      {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="text-sm">
                  <span className="block mb-1 text-slate-500">Pinecone API Key</span>
                  <div className="flex items-center gap-2">
                    <input
                      type={showKeys.pinecone ? 'text' : 'password'}
                      value={apiKeysForm.pinecone}
                      onChange={(e) => setApiKeysForm((p) => ({ ...p, pinecone: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
                      placeholder="pcsk_..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((s) => ({ ...s, pinecone: !s.pinecone }))}
                      className="p-2 rounded-lg border bg-white dark:bg-slate-800"
                      title={showKeys.pinecone ? 'Hide' : 'Show'}
                    >
                      {showKeys.pinecone ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="text-sm">
                  <span className="block mb-1 text-slate-500">SerpAPI Key</span>
                  <div className="flex items-center gap-2">
                    <input
                      type={showKeys.serpapi ? 'text' : 'password'}
                      value={apiKeysForm.serpapi}
                      onChange={(e) => setApiKeysForm((p) => ({ ...p, serpapi: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
                      placeholder="serpapi..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((s) => ({ ...s, serpapi: !s.serpapi }))}
                      className="p-2 rounded-lg border bg-white dark:bg-slate-800"
                      title={showKeys.serpapi ? 'Hide' : 'Show'}
                    >
                      {showKeys.serpapi ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="text-sm">
                  <span className="block mb-1 text-slate-500">Pinecone Index</span>
                  <input
                    type="text"
                    value={apiKeysForm.pineconeIndex}
                    onChange={(e) => setApiKeysForm((p) => ({ ...p, pineconeIndex: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
                    placeholder="cynapse-compliance"
                  />
                </label>

                <button
                  type="submit"
                  disabled={keysSaving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {keysSaving ? (<><Loader2 size={14} className="animate-spin" />Saving…</>) : 'Save keys securely'}
                </button>
              </div>
            )}
          </form>
        );
      case 'system':
        return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Workflow size={18} /> System</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Data Residency</p>
              <p className="font-bold mt-1">AWS ap-south-1 (Mumbai)</p>
            </div>
            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">SSO</p>
              <p className="font-bold mt-1">Enforced (Okta)</p>
            </div>
            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Session Timeout</p>
              <p className="font-bold mt-1">45 minutes</p>
            </div>
          </div>
        </div>
        );
      case 'apps':
      case 'marketplace': {
      const integrations = [
        { name: 'AWS CloudTrail', status: 'Connected' },
        { name: 'GitHub', status: 'Connected' },
        { name: 'Slack', status: 'Connected' },
        { name: 'Google Workspace', status: 'Action Required' },
      ];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Workflow size={18} /> {currentTab === 'apps' ? 'Apps' : 'Marketplace apps'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.map((app) => (
              <div key={app.name} className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/70">
                <p className="font-semibold">{app.name}</p>
                <p className={`text-xs mt-2 ${app.status === 'Connected' ? 'text-emerald-600' : 'text-amber-600'}`}>{app.status}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
      case 'spaces':
      case 'workitems': {
      const rows = currentTab === 'spaces'
        ? [
          { name: 'My discovery space', value: '12 initiatives', status: 'Owner: Aman' },
          { name: 'Security Program', value: '9 initiatives', status: 'Owner: Priya' },
          { name: 'Trust Center', value: '5 initiatives', status: 'Owner: Rahul' },
        ]
        : [
          { name: 'Control Evidence Upload', value: 'In Progress', status: 'Due: Apr 02' },
          { name: 'SOC 2 Gap Closure', value: 'At Risk', status: 'Due: Mar 31' },
          { name: 'Vendor Reassessment', value: 'Completed', status: 'Closed: Mar 21' },
        ];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Workflow size={18} /> {currentTab === 'spaces' ? 'Spaces' : 'Work items'}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {rows.map((row) => (
              <div key={row.name} className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
                <p className="text-xs uppercase tracking-wide text-slate-500">{row.name}</p>
                <p className="font-bold mt-1">{row.value}</p>
                <p className="text-xs mt-2 text-slate-500">{row.status}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
      case 'users': {
      const mockUsers = [
        { name: 'Aman Sinha', email: 'aman@cynapse.com', role: 'Owner', lastActive: 'Today' },
        { name: 'Priya Kapoor', email: 'priya@cynapse.com', role: 'Security Admin', lastActive: 'Yesterday' },
        { name: 'Rahul Iyer', email: 'rahul@cynapse.com', role: 'Auditor', lastActive: 'Mar 22, 2026' },
        { name: 'Nisha Verma', email: 'nisha@cynapse.com', role: 'Viewer', lastActive: 'Mar 20, 2026' },
      ];
      return (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={18} /> User management</h2>
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((u) => (
                  <tr key={u.email} className="border-t border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/70">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
      case 'billing': {
      const tiers = [
        { id: 'Seed', price: '$49/mo', desc: 'Core compliance workspace for early teams.' },
        { id: 'Growth', price: '$199/mo', desc: 'Team workflows, automation, and analytics.' },
        { id: 'Enterprise', price: 'Contact Sales', desc: 'Advanced controls and dedicated support.' }
      ];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Billing & Subscriptions</h2>
          <p className="text-sm text-slate-500">Current plan: <strong>{me?.plan_tier || 'Seed'}</strong> ({me?.subscription_status || 'active'})</p>
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="border rounded-xl p-4 space-y-2">
                <h3 className="font-bold">{tier.id}</h3>
                <p className="text-sm text-slate-500">{tier.desc}</p>
                <p className="text-lg font-semibold">{tier.price}</p>
                <button
                  disabled={billingLoading === tier.id}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={async () => {
                    try {
                      setBillingLoading(tier.id);
                      const data = await createCheckoutSession(tier.id);
                      if (data.checkout_url) window.location.href = data.checkout_url;
                    } catch (err) {
                      setError(String(err.message || 'Checkout session failed'));
                    } finally {
                      setBillingLoading('');
                    }
                  }}
                >
                  {billingLoading === tier.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    `Upgrade to ${tier.id}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
      default:
        return <div className="text-slate-500">Select a settings module from the sidebar.</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      <aside className="border rounded-xl p-3 bg-white dark:bg-slate-900 h-fit sticky top-20">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
          {currentContext === 'personal' ? 'Personal Settings' : currentContext === 'admin' ? 'Admin Settings' : 'Billing Settings'}
        </p>
        {contextTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setSearchParams({ context: currentContext, tab: item.id })}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
              currentTab === item.id
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <section className="border rounded-xl p-5 bg-white dark:bg-slate-900">
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-3 text-sm text-emerald-600">{success}</div>}
        {me ? renderPanel() : <div>Loading...</div>}
      </section>
    </div>
  );
}
