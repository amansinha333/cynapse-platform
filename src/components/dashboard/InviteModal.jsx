import React, { useMemo, useState } from "react";
import { X, Mail, Shield, User, Users } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

const ROLES = [
  { value: "admin", label: "Admin", icon: Shield },
  { value: "manager", label: "Manager", icon: Users },
  { value: "user", label: "User", icon: User },
];

export default function InviteModal({ open, onClose }) {
  const { backendUrl, currentUser } = useProject();
  const organizationId = useMemo(() => (currentUser?.workspaceId || "").toString(), [currentUser]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (!organizationId) throw new Error("Missing organization/workspace id.");
      const res = await fetch(`${backendUrl}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organization_id: organizationId, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.detail || body?.error || "Failed to send invite.");
      }
      setNotice("Invite sent successfully.");
      setEmail("");
      setRole("user");
    } catch (err) {
      setError(err?.message || "Invite failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selected = ROLES.find((r) => r.value === role) || ROLES[2];
  const RoleIcon = selected.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => onClose?.()}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="text-sm font-black text-slate-900">Invite teammate</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Send a secure invite link via email.
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}

          <label className="block">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" /> Email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="name@company.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
              <RoleIcon className="h-4 w-4 text-slate-400" /> Role
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500">
              Org: <span className="font-mono text-slate-700">{organizationId || "—"}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

