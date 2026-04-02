import React, { useEffect, useState } from "react";

const STORAGE_KEY = "cynapse_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#042417]/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.35)]"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-sm leading-relaxed text-slate-300 sm:max-w-2xl">
          We use cookies to improve your experience and analyze platform usage. By continuing, you agree to our use of
          cookies as described in our policies.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => save("declined")}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/90 transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-[#16a34a]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
