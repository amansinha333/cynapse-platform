// ============================================================================
// CYNAPSE ENTERPRISE — API LAYER
// Real CRUD endpoints + AI Audit endpoints
// ============================================================================

// Dev: local FastAPI at localhost:8000.
// Production: set VITE_API_BASE_URL to your hosted backend (e.g. https://cynapse-api.onrender.com).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'cynapse_jwt_token';
const REFRESH_TOKEN_KEY = 'cynapse_refresh_token';

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
    }
    const errBody = await res.text().catch(() => '');
    throw new Error(errBody || `API Error ${res.status} on ${options.method || 'GET'} ${path}`);
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
// AUDIT LOG
// ---------------------------------------------------------------------------
export const fetchAuditLog   = ()     => request('/api/audit-log');
export const createAuditEvent = (data) => request('/api/audit-log', { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------------------------
// AI AUDIT ENDPOINTS — Real Gemini Integration
// ---------------------------------------------------------------------------
export const analyzeRiceCore = async (payload, keys = {}) => {
  return request('/api/v1/analyze-rice', {
    method: 'POST',
    headers: { 'X-Gemini-Key': keys.gemini || '' },
    body: JSON.stringify(payload),
  });
};

export const runNode1 = async (payload, keys = {}) => {
  try {
    return await request('/api/audit/node1', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Backward-compatible fallback if backend still exposes legacy v1 path.
    if (String(error?.message || '').includes('404')) {
      return request('/api/v1/audit/node1', {
        method: 'POST',
        headers: { 'X-Gemini-Key': keys.gemini || '' },
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

export const runNode2 = async (payload, keys = {}) => {
  try {
    return await request('/api/audit/node2', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Backward-compatible fallback if backend still exposes legacy v1 path.
    if (String(error?.message || '').includes('404')) {
      return request('/api/v1/audit/node2', {
        method: 'POST',
        headers: { 'X-Gemini-Key': keys.gemini || '' },
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

export const runMultiNodeAudit = async (payload, keys = {}) => {
  return request('/api/v1/run-audit', {
    method: 'POST',
    headers: {
      'X-Gemini-Key': keys.gemini || '',
    },
    body: JSON.stringify(payload),
  });
};

// ---------------------------------------------------------------------------
// AUTH + USERS
// ---------------------------------------------------------------------------
export const registerUser = (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const loginUser = (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const fetchCurrentUser = () => request('/api/users/me');
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
export const uploadVaultDocument = (formData) =>
  request('/api/vault/upload', { method: 'POST', body: formData });
export const fetchVaultDocuments = () => request('/api/vault/documents');
export const fetchVaultDocumentUrl = (documentId) => request(`/api/vault/documents/${documentId}/url`);
