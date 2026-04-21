// ============================================================================
// CYNAPSE ENTERPRISE — API LAYER
// Real CRUD endpoints + AI Audit endpoints
// ============================================================================

// Dev: local FastAPI at localhost:8000.
// Production: set VITE_API_BASE_URL to your hosted backend (e.g. https://cynapse-api.onrender.com).
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'cynapse_jwt_token';
const REFRESH_TOKEN_KEY = 'cynapse_refresh_token';

/** Dispatched when refresh fails after 401 so ProjectProvider can clear session (avoid infinite API loops). */
export const AUTH_LOGOUT_EVENT = 'cynapse-auth-logout';

function messageFromFastApiDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d != null && d.msg ? d.msg : String(d)))
      .join(' ')
      .trim();
  }
  if (typeof detail === 'object') {
    if (typeof detail.error === 'string') {
      const extra = detail.reason ?? detail.message;
      if (extra != null && extra !== '') {
        return typeof extra === 'string' ? `${detail.error}: ${extra}` : `${detail.error}: ${JSON.stringify(extra)}`;
      }
      return detail.error;
    }
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const url = `${API_BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
  });
  if (!res.ok) {
    if (res.status === 401 && !options.__isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request(path, { ...options, __isRetry: true });
      }
      setAuthToken(null);
      setRefreshToken(null);
      try {
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      } catch {
        /* no-op */
      }
    }
    const errBody = await res.text().catch(() => '');
    const fallback = errBody || `API Error ${res.status} on ${options.method || 'GET'} ${path}`;
    let message = fallback;
    if (errBody) {
      try {
        const parsed = JSON.parse(errBody);
        if (parsed != null && Object.prototype.hasOwnProperty.call(parsed, 'detail')) {
          const extracted = messageFromFastApiDetail(parsed.detail);
          if (extracted) message = extracted;
        }
      } catch {
        /* keep raw errBody as message */
      }
    }
    throw new Error(message);
  }
  return res.json();
}

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const setRefreshToken = (token) => {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
};

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAuthToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// HEALTH
// ---------------------------------------------------------------------------
export const checkHealth = () => request('/api/health');
export const fetchSystemHealth = () => request('/api/system/health');

// ---------------------------------------------------------------------------
// FEATURE CRUD
// ---------------------------------------------------------------------------
export const fetchFeatures   = ()           => request('/api/features');
export const fetchFeature    = (id)         => request(`/api/features/${id}`);
export const createFeature   = (data)       => request('/api/features', { method: 'POST', body: JSON.stringify(data) });
export const updateFeature   = (id, data)   => request(`/api/features/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFeatureApi = (id)        => request(`/api/features/${id}`, { method: 'DELETE' });

// ---------------------------------------------------------------------------
// EPIC CRUD
// ---------------------------------------------------------------------------
export const fetchEpics  = ()     => request('/api/epics');
export const createEpic  = (data) => request('/api/epics', { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------------------------
// VENDOR CRUD
// ---------------------------------------------------------------------------
export const fetchVendors  = ()     => request('/api/vendors');
export const createVendor  = (data) => request('/api/vendors', { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------------------------
// CRM hub (maps vendors → clients, epics → projects, audit → inbox)
// ---------------------------------------------------------------------------
export const fetchCRMStats = () => request('/api/crm/stats');
export const fetchClients = () => request('/api/crm/clients');
export const createClient = (payload) =>
  request('/api/crm/clients', { method: 'POST', body: JSON.stringify(payload) });
export const fetchProjects = () => request('/api/crm/projects');
export const fetchInbox = () => request('/api/crm/inbox');
export const markNotificationRead = (id) =>
  request(`/api/crm/inbox/${encodeURIComponent(id)}/read`, { method: 'PATCH' });

// Workspace teammates & DM
export const fetchWorkspaceMembers = () => request('/api/workspace/members');
export const fetchConversations = () => request('/api/conversations');
export const openOrCreateDM = (recipientId) =>
  request('/api/conversations/dm', { method: 'POST', body: JSON.stringify({ recipient_id: recipientId }) });
export const fetchConversationMessages = (conversationId) =>
  request(`/api/conversations/${encodeURIComponent(conversationId)}/messages`);
export const postChatMessage = (conversationId, body) =>
  request(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

// ---------------------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------------------
export const fetchAuditLog   = ()     => request('/api/audit-log');
export const createAuditEvent = (data) => request('/api/audit-log', { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------------------------
// AI AUDIT ENDPOINTS — Real Gemini Integration
// ---------------------------------------------------------------------------
/** Gemini keys are resolved server-side (GEMINI_API_KEY or encrypted user key). Do not send client keys. */
export const analyzeRiceCore = async (payload, _keys = {}) => {
  return request('/api/v1/analyze-rice', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const runNode1 = async (payload, _keys = {}) => {
  try {
    return await request('/api/audit/node1', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (String(error?.message || '').includes('404')) {
      return request('/api/v1/audit/node1', {
        method: 'POST',
        body: JSON.stringify({
          title: payload?.project_description || '',
          description: payload?.project_description || '',
          prdText: payload?.project_description || '',
        }),
      });
    }
    throw error;
  }
};

export const runNode2 = async (payload, _keys = {}) => {
  try {
    return await request('/api/audit/node2', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (String(error?.message || '').includes('404')) {
      return request('/api/v1/audit/node2', {
        method: 'POST',
        body: JSON.stringify({
          title: payload?.project_description || '',
          description: payload?.project_description || '',
          prdText: payload?.project_description || '',
        }),
      });
    }
    throw error;
  }
};

// ---------------------------------------------------------------------------
// AUTH + USERS
// ---------------------------------------------------------------------------
export const registerUser = (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const loginUser = (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const fetchCurrentUser = () => request('/api/users/me');
export const fetchMyDataExport = () => request('/api/users/me/data-export');
export const fetchPrivacySettings = () => request('/api/users/me/privacy-settings');
export const deleteMyAccount = (password) =>
  request('/api/users/me/delete-account', { method: 'POST', body: JSON.stringify({ password }) });
export const fetchUsers = () => request('/api/users');
export const updateMyProfile = (formData) => request('/api/users/me', { method: 'PUT', body: formData });
export const updateUserRole = (userId, role) => request(`/api/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });

// ---------------------------------------------------------------------------
// SECURE SETTINGS (encrypted per-user keys)
// ---------------------------------------------------------------------------
export const getSecureKey = (keyName) => request(`/api/settings/keys/${encodeURIComponent(keyName)}`);
export const setSecureKey = (keyName, value) =>
  request(`/api/settings/keys/${encodeURIComponent(keyName)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });

// ---------------------------------------------------------------------------
// BILLING
// ---------------------------------------------------------------------------
export const createCheckoutSession = (planTier) =>
  request('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan_tier: planTier })
  });

// ---------------------------------------------------------------------------
// VAULT
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll Celery ingest task until SUCCESS or FAILURE (used when API returns 202 + task_id). */
export const fetchVaultIngestTaskStatus = async (taskId) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}/api/vault/tasks/${encodeURIComponent(taskId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Task status failed');
  }
  return res.json();
};

export const importVaultLocalFolder = (sourceDir) =>
  request('/api/vault/import-local', {
    method: 'POST',
    body: (() => {
      const f = new FormData();
      f.append('source_dir', sourceDir);
      return f;
    })(),
  });

export const updateVaultDocumentTags = (documentId, tags) =>
  request(`/api/vault/documents/${encodeURIComponent(documentId)}/tags`, {
    method: 'PUT',
    body: JSON.stringify(tags || {}),
  });

/**
 * Upload a vault PDF. If the server returns `task_id` (Celery / REDIS_URL), polls until processing finishes.
 * @param {FormData} formData
 * @param {{
 *   poll?: boolean,
 *   pollIntervalMs?: number,
 *   pollTimeoutMs?: number,
 *   onPhase?: (phase: 'uploading' | 'analyzing' | 'idle') => void
 * }} [options]
 */
export const uploadVaultDocument = async (formData, options = {}) => {
  const {
    poll = true,
    pollIntervalMs = 3000,
    pollTimeoutMs = 45 * 60 * 1000,
    onPhase
  } = options;

  const run = async () => {
    onPhase?.('uploading');
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE}/api/vault/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Upload failed');
    }
    const data = await res.json();
    if (!poll || !data.task_id) {
      return data;
    }

    onPhase?.('analyzing');
    const start = Date.now();
    while (Date.now() - start < pollTimeoutMs) {
      const status = await fetchVaultIngestTaskStatus(data.task_id);
      const state = status.state || '';
      if (state === 'SUCCESS') {
        return { ...data, ingest_task: status };
      }
      if (state === 'FAILURE' || state === 'REVOKED') {
        const msg = status.error || `Ingest failed (${state})`;
        throw new Error(msg);
      }
      await sleep(pollIntervalMs);
    }
    throw new Error('Document processing timed out — check the Knowledge Vault or try again.');
  };

  try {
    return await run();
  } finally {
    onPhase?.('idle');
  }
};

export const fetchVaultDocuments = () => request('/api/vault/documents');
export const fetchVaultDocumentUrl = (documentId) => request(`/api/vault/documents/${documentId}/url`);
export const deleteVaultDocument = (documentId) => request(`/api/vault/${documentId}`, { method: 'DELETE' });
