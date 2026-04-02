import React, { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, Zap } from "lucide-react";
import { useProject } from "../context/ProjectContext";

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function BillingPage() {
  const { backendUrl, currentUser } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const organizationId = useMemo(() => {
    return (currentUser?.workspaceId || "").toString();
  }, [currentUser]);

  const upgrade = async () => {
    setError("");
    setLoading(true);
    try {
      if (!organizationId) {
        throw new Error("Missing organization/workspace id for checkout.");
      }
      const res = await fetch(`${backendUrl}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organizationId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.detail || body?.error || "Failed to create checkout session.");
      }
      const url = body?.url || body?.checkout_url;
      if (!url) throw new Error("Stripe URL missing from response.");
      window.location.assign(url);
    } catch (e) {
      setError(e?.message || "Upgrade failed.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Billing</h1>
          <p className="text-sm text-slate-600 mt-1">
            Upgrade to unlock enterprise governance controls and secure onboarding.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
          Org: <span className="font-mono text-slate-900">{organizationId || "—"}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Free Tier</div>
              <div className="text-xs text-slate-500 mt-1">Current plan</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Active
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <div className="text-4xl font-black text-slate-900">$0</div>
            <div className="text-sm text-slate-500 mb-1">/ month</div>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500" /> Local workflows + sandbox mode
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-500" /> Standard governance gates
            </li>
          </ul>
        </Card>

        <Card className="p-6 border-emerald-200 shadow-[0_12px_40px_rgba(34,197,94,0.14)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Enterprise Pilot</div>
              <div className="text-xs text-slate-500 mt-1">Cynapse Enterprise Pilot tier</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              Recommended
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <div className="text-4xl font-black text-slate-900">Custom</div>
            <div className="text-sm text-slate-500 mb-1">pricing</div>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Secure transactional emails + onboarding
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Enterprise billing + audit-ready receipts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Advanced governance controls
            </li>
          </ul>

          <button
            onClick={upgrade}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Redirecting to Stripe…" : "Upgrade to Enterprise Pilot"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      </div>
    </div>
  );
}

