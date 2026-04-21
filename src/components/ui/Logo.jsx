import React from 'react';

/** 3D mark only (no text in file) — lives in `public/cynapse-logo.png`. Bump `?v` if replaced. */
const MARK_SRC = '/cynapse-logo.png?v=2';

/**
 * Use these with `<Logo className={LOGO_CLASS.*} />` so every page keeps the same lockup chrome.
 * Do not pass `w-auto` here — the component uses `!w-max` for correct wordmark width.
 */
export const LOGO_CLASS = {
  marketing: 'h-auto shrink-0 text-emerald-500',
  neutral: 'h-auto shrink-0',
  trust: 'relative z-10 h-auto shrink-0 text-emerald-500',
  sidebarExpanded: 'h-auto shrink-0 max-w-[14rem] py-0.5',
  appMobileCompact: 'h-auto shrink-0 max-h-[3.75rem] py-0.5',
  loader: 'h-auto shrink-0',
  iconOnlyDesktopChip: 'hidden h-8 w-8 shrink-0 lg:inline-flex',
  iconOnlySidebar: 'h-10 w-10',
};

/**
 * PNG ~1024×559. Taller aspect = more mark height (less “squashed” vs text); still crops low glow via object-top.
 */
const MARK_ASPECT = 'aspect-[1024/448]';

const MARK_MIN_W = {
  compact: 'min-w-[4.5rem] sm:min-w-[5rem]',
  full: 'min-w-[7rem] sm:min-w-[8.25rem]',
};

/**
 * Raster 3D mark + single-line wordmark (“CYNAPSE ENTERPRISE”) directly below; mark stretches to full phrase width.
 * `iconOnly`: cropped mark only, for collapsed sidebar / desktop top bar chip.
 * `variant="dark"`: light text for dark marketing headers.
 * `enterprise={false}`: show CYNAPSE only.
 * `compact`: smaller lockup for dense chrome (e.g. mobile `h-16` app bar).
 * `align="start"`: left-align lockup (e.g. loader corner).
 */
export default function Logo({
  className = 'h-auto w-auto',
  iconOnly = false,
  variant = 'default',
  enterprise = true,
  compact = false,
  align = 'center',
  /** Knocks out white PNG padding on dark UIs (e.g. branded loader) via multiply blend on the mark only. */
  blendDarkBg = false,
}) {
  const dark = variant === 'dark';

  const cynapseCls = dark
    ? 'text-emerald-100'
    : 'text-emerald-900 dark:text-emerald-100';
  const enterpriseCls = dark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400';
  const lockupAriaLabel = enterprise ? 'Cynapse Enterprise' : 'Cynapse';

  const wordRowJustify = align === 'start' ? 'justify-start' : 'justify-center';

  const markMinW = compact ? MARK_MIN_W.compact : MARK_MIN_W.full;
  /** Balanced X/Y scale so the mark isn’t visibly flattened; taller clip box carries extra height. */
  const markImgZoom = compact
    ? 'origin-[50%_0%] scale-x-[1.1] scale-y-[1.08]'
    : 'origin-[50%_0%] scale-x-[1.22] scale-y-[1.18]';

  const mark = (
    <span
      className={`relative z-0 block w-full shrink-0 overflow-hidden ${MARK_ASPECT} ${markMinW}`}
    >
      <img
        src={MARK_SRC}
        alt=""
        aria-hidden
        draggable={false}
        decoding="async"
        className={`absolute inset-0 h-full w-full max-w-none object-cover object-top ${markImgZoom}${
          blendDarkBg ? ' mix-blend-multiply brightness-[1.08]' : ''
        }`}
      />
    </span>
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

  /** Space between 3D mark and “CYNAPSE ENTERPRISE” (was gap-0 + negative margin; slight gap reads clearer). */
  const outerGap = compact ? 'gap-1' : 'gap-1.5 sm:gap-2';
  const wordGap = compact ? 'gap-1' : 'gap-1 sm:gap-1.5';
  const cynapseText = compact
    ? `text-[10px] font-extrabold tracking-wide sm:text-[11px] ${cynapseCls}`
    : `text-xs font-extrabold tracking-wide sm:text-sm ${cynapseCls}`;
  const enterpriseText = compact
    ? `text-[8px] font-semibold tracking-[0.14em] sm:text-[9px] ${enterpriseCls}`
    : `text-[10px] font-semibold tracking-[0.1em] sm:text-[11px] ${enterpriseCls}`;

  return (
    <span
      className={`inline-flex !w-max max-w-full shrink-0 flex-col items-stretch ${outerGap} ${className}`}
      role="img"
      aria-label={lockupAriaLabel}
    >
      {mark}
      <span
        className={`relative z-10 flex w-full shrink-0 flex-row flex-nowrap items-baseline whitespace-nowrap font-sans leading-none ${wordGap} ${wordRowJustify}`}
      >
        <span className={`${cynapseText} leading-none`}>CYNAPSE</span>
        {enterprise && <span className={`${enterpriseText} leading-none`}>ENTERPRISE</span>}
      </span>
    </span>
  );
}
