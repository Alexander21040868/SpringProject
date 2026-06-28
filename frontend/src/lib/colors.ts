// Single source of truth for data-visualisation colours.
// Mirrors the --chart-* / categorical tokens in src/index.css.
// Recharts renders SVG presentation attributes (stroke/fill) which do NOT
// resolve CSS var(), so chart marks must reference these JS constants.
// Anything styled via CSS (inline `style`, classes) should use the var() tokens.

import type { LimitState } from '../types'

/** Semantic data-viz accents — income / expense / warning. */
export const CHART = {
  income: '#1d9e75',
  expense: '#e24b4a',
  warn: '#ef9f27',
} as const

/** Categorical palette for user-assignable category colours. */
export const CATEGORY_PALETTE = [
  '#1d9e75', '#378add', '#d4537e', '#ba7517',
  '#7f77dd', '#d85a30', '#0f6e56', '#185fa5',
] as const

/** Limit state → data-viz colour (OK / WARNING / EXCEEDED). */
export const LIMIT_COLOR: Record<LimitState, string> = {
  OK: CHART.income,
  WARNING: CHART.warn,
  EXCEEDED: CHART.expense,
}

export const LIMIT_LABEL: Record<LimitState, string> = {
  OK: 'в норме', WARNING: 'близко', EXCEEDED: 'превышено',
}

/** Brand accent used for the default user avatar (matches --info). */
export const AVATAR_DEFAULT = '#185fa5'

/** Neutral hex fallback when a category has no assigned colour.
 *  Hex (not a token) because callers append an alpha suffix, e.g. `color + '24'`. */
export const CATEGORY_FALLBACK = '#888888'
