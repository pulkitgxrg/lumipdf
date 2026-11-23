import type { CSSProperties } from 'react';

export interface ViewerColors {
  /* Surfaces */
  bg?: string;
  toolbarBg?: string;
  viewerBg?: string;
  sidebarBg?: string;
  controlBg?: string;
  controlHoverBg?: string;
  pageBg?: string;

  /* Text & lines */
  text?: string;
  textMuted?: string;
  icon?: string;
  border?: string;
  borderStrong?: string;

  /* Neutral button states */
  buttonHover?: string;
  buttonActive?: string;

  /* Accent (derived shades are computed from `accent` when omitted) */
  accent?: string;
  accentContrast?: string;
  accentHover?: string;
  accentSoft?: string;
  accentSoftText?: string;
  accentBorder?: string;
  focusRing?: string;

  /* Status */
  danger?: string;
  dangerText?: string;
  dangerSoft?: string;

  /* Document overlays */
  selection?: string;
  searchHighlight?: string;
  searchHighlightCurrent?: string;

  /* Floating page navigator */
  floatingBg?: string;
  floatingText?: string;
  floatingTextMuted?: string;
  floatingHover?: string;

  /* Misc */
  overlay?: string;
  checker?: string;
  shadow?: string;
  shadowLg?: string;
  pageShadow?: string;
}

const toCssVar = (key: string) => `--dv-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

export function colorsToCssVars(colors: ViewerColors | undefined): CSSProperties | undefined {
  if (!colors) return undefined;
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string' && value !== '') style[toCssVar(key)] = value;
  }
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}
