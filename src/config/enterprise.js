/** Public enterprise / trust URLs — set in `.env` for production. */
export const STATUS_PAGE_URL = (import.meta.env.VITE_STATUS_PAGE_URL || '').trim();
export const SECURITY_EMAIL = (import.meta.env.VITE_SECURITY_EMAIL || 'security@cynapse.example').trim();
export const LEGAL_EMAIL = (import.meta.env.VITE_LEGAL_EMAIL || 'legal@cynapse.example').trim();
