// ============================================================================
// CYNAPSE ENTERPRISE — CONFIGURATION & CONSTANTS
// ============================================================================

export const BACKEND_URL = 'http://127.0.0.1:8000';

export const FALLBACK_COMPLIANCE_DOCS = `DOCUMENT: General Fallback. Connect backend for full RAG support.`;

export const INDUSTRY_REGULATIONS = {
  'FinTech & Banking': ['RBI Master Directions (India)', 'SEBI Guidelines', 'PCI-DSS', 'SOX', 'PSD2 (EU)', 'DORA', 'Basel III', 'FCA (UK)'],
  'Hardware & Mechanical': ['ASME Boiler & Pressure Vessel Code', 'ISO 9001 (Quality)', 'CE Marking (EU)', 'RoHS / REACH', 'FCC Part 15', 'UL Certification', 'WEEE Directive'],
  'HealthTech & MedDev': ['HIPAA (US)', 'FDA 21 CFR Part 11', 'FDA SaMD', 'EU MDR', 'ISO 13485', 'GDPR (Health)'],
  'Automotive & Aerospace': ['ISO 26262 (Functional Safety)', 'AS9100', 'IATF 16949', 'NHTSA', 'TISAX'],
  'EdTech': ['FERPA (US)', 'COPPA', 'GDPR-K', 'SOPIPA'],
  'E-Commerce & Retail': ['PCI-DSS', 'GDPR', 'CCPA', 'Consumer Rights Directive', 'CPSC (US)'],
  'General SaaS / AI': ['GDPR', 'CCPA', 'EU AI Act', 'ISO 27001', 'SOC 2 Type II']
};

export const REGIONS = ['Global', 'India (South Asia)', 'EU (Europe)', 'US (North America)', 'APAC (Asia Pacific)', 'MENA (Middle East)'];
export const COLUMNS = ['Discovery', 'Validation', 'Ready', 'Delivery'];
export const ENTERPRISE_ROLES = ['Product Manager', 'Compliance Officer', 'Engineer', 'Chief Product Officer (CPO)', 'Stakeholder'];

// --- Epics ---
export const INITIAL_EPICS = [
  { id: 'epic-payments', name: 'Payments & FinOps', color: '#6366f1' },
  { id: 'epic-compliance', name: 'Regulatory Compliance', color: '#f43f5e' },
  { id: 'epic-platform', name: 'Platform Infrastructure', color: '#0ea5e9' },
  { id: 'epic-growth', name: 'Growth & Expansion', color: '#10b981' },
];

// --- Hard-Gate: columns that require compliance clearance ---
export const GATED_COLUMNS = ['Ready', 'Delivery'];

// --- Helper to generate default dates ---
const today = () => new Date().toISOString().split('T')[0];
const futureDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const INITIAL_FEATURES = [
  {
    id: 'CYN-101', title: 'UPI Payment Gateway', description: 'Direct bank transfers using UPI protocols.',
    region: 'India (South Asia)', industry: 'FinTech & Banking', status: 'Discovery', reach: 850, impact: 3, confidence: 1, effort: 3,
    riceScore: 850, complianceStatus: 'Blocked', votes: 112, assignee: 'CPO', priority: 'High',
    comments: [], epicId: 'epic-payments', dependencies: [],
    startDate: today(), endDate: futureDate(45),
  },
  {
    id: 'CYN-102', title: 'GDPR Data Module', description: 'Ensure all EU user data is stored within EU borders per GDPR Art.44.',
    region: 'EU (Europe)', industry: 'General SaaS / AI', status: 'Validation', reach: 420, impact: 2, confidence: 1, effort: 2,
    riceScore: 420, complianceStatus: 'Approved', votes: 67, assignee: 'Engineering Lead', priority: 'High',
    comments: [], epicId: 'epic-compliance', dependencies: [],
    startDate: today(), endDate: futureDate(60),
    attestation: { signed: false, name: '', timestamp: '', ip: '' } // Needs attestation state prep
  },
  {
    id: 'CYN-103', title: 'SMS Notification Gateway', description: 'Third-party SMS OTP routing integration.',
    region: 'Global', industry: 'General SaaS / AI', status: 'Discovery', reach: 600, impact: 2, confidence: 1, effort: 2,
    riceScore: 600, complianceStatus: 'Blocked', votes: 34, assignee: 'CPO', priority: 'High',
    comments: [], epicId: 'epic-platform', dependencies: [],
    startDate: futureDate(10), endDate: futureDate(40),
  },
  {
    id: 'CYN-104', title: 'AI Scoring Engine', description: 'ML model to auto-classify feature risk.',
    region: 'Global', industry: 'General SaaS / AI', status: 'Discovery', reach: 950, impact: 3, confidence: 1, effort: 3,
    riceScore: 950, complianceStatus: 'Pending', votes: 89, assignee: 'Data Science', priority: 'Medium',
    comments: [], epicId: 'epic-platform', dependencies: [],
    startDate: futureDate(30), endDate: futureDate(90),
  }
];

export const DEFAULT_USERS = [
  { id: 'u1', name: 'Admin Cynapse', email: 'admin@cynapse.com', password: 'password', role: 'Chief Product Officer (CPO)', joined: '2023-11-01' }
];
