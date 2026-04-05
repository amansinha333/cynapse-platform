import React from 'react';

/** 3D mark only (no text in file) — lives in `public/cynapse-logo.png`. Bump `?v` if replaced. */
const MARK_SRC = '/cynapse-logo.png?v=2';

/**
 * Raster 3D icon + vector wordmark (PNG has no text; typography is added here).
 * `iconOnly`: cropped mark only, for collapsed sidebar.
 * `variant="dark"`: light text for dark marketing headers.
 * `enterprise={false}`: hide divider + ENTERPRISE.
 */
export default function Logo({
  className = 'h-8 w-auto',
  iconOnly = false,
  variant = 'default',
  enterprise = true,
}) {
  const dark = variant === 'dark';

  const cynapseCls = dark
    ? 'text-emerald-100'
    : 'text-emerald-900 dark:text-emerald-100';
  const dividerCls = dark ? 'text-teal-400/70' : 'text-teal-600/50';
  const enterpriseCls = dark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400';

  const mark = (
    <img
      src={MARK_SRC}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className="h-full w-[3.25rem] shrink-0 object-cover object-center sm:w-14"
    />
  );

  if (iconOnly) {
    return (
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-md ${className}`}
        role="img"
        aria-label="Cynapse"
      >
        <img
          src={MARK_SRC}
          alt="Cynapse"
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="img"
      aria-label="Cynapse Enterprise"
    >
      {mark}
      <span className="flex min-w-0 items-baseline gap-2 font-sans leading-none">
        <span
          className={`whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base ${cynapseCls}`}
        >
          CYNAPSE
        </span>
        {enterprise && (
          <>
            <span
              className={`select-none text-sm font-light opacity-80 ${dividerCls}`}
              aria-hidden
            >
              |
            </span>
            <span
              className={`whitespace-nowrap text-[10px] font-semibold tracking-[0.22em] sm:text-xs ${enterpriseCls}`}
            >
              ENTERPRISE
            </span>
          </>
        )}
      </span>
    </span>
  );
}
