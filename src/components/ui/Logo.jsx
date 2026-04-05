import React from 'react';

/** 3D mark only (no text in file) — lives in `public/cynapse-logo.png`. Bump `?v` if replaced. */
const MARK_SRC = '/cynapse-logo.png?v=2';

/**
 * Raster 3D icon + wordmark stacked vertically (mark above CYNAPSE / ENTERPRISE) for readable, untruncated text.
 * `iconOnly`: cropped mark only, for collapsed sidebar / desktop top bar chip.
 * `variant="dark"`: light text for dark marketing headers.
 * `enterprise={false}`: show CYNAPSE only.
 */
export default function Logo({
  className = 'h-auto w-auto',
  iconOnly = false,
  variant = 'default',
  enterprise = true,
}) {
  const dark = variant === 'dark';

  const cynapseCls = dark
    ? 'text-emerald-100'
    : 'text-emerald-900 dark:text-emerald-100';
  const enterpriseCls = dark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400';
  const lockupAriaLabel = enterprise ? 'Cynapse Enterprise' : 'Cynapse';

  const mark = (
    <img
      src={MARK_SRC}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className="h-9 w-11 shrink-0 object-cover object-center sm:h-10 sm:w-12"
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
      className={`inline-flex flex-col items-center gap-1 ${className}`}
      role="img"
      aria-label={lockupAriaLabel}
    >
      {mark}
      <span className="flex flex-col items-center gap-0 font-sans leading-tight">
        <span
          className={`text-center text-[11px] font-extrabold tracking-wide sm:text-xs ${cynapseCls}`}
        >
          CYNAPSE
        </span>
        {enterprise && (
          <span
            className={`text-center text-[9px] font-semibold tracking-[0.18em] sm:text-[10px] ${enterpriseCls}`}
          >
            ENTERPRISE
          </span>
        )}
      </span>
    </span>
  );
}
