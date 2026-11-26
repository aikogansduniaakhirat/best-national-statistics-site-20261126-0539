// format.js — the one place numbers, years and labels are turned into text.
// Every value on the site passes through here, so the same figure reads the same
// way in a headline, a table cell and an axis tick.

export function value(v, decimals) {
  if (v === null || v === undefined || Number.isNaN(v)) return '–';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** A big number said in words, for headlines: 284,400,000 -> "284.4 million". */
export function words(v) {
  if (v === null || v === undefined) return '–';
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(2) + ' trillion';
  if (abs >= 1e9) return (v / 1e9).toFixed(2) + ' billion';
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + ' million';
  if (abs >= 1e4) return (v / 1e3).toFixed(0) + ' thousand';
  return value(v, 0);
}

/** Axis ticks: short, unit-free, and never a wall of digits. */
export function tick(v) {
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  if (abs >= 10) return String(Math.round(v));
  if (abs >= 1) return v.toFixed(1).replace(/\.0$/, '');
  return v.toFixed(2).replace(/0$/, '');
}

export function year(y) {
  return String(y);
}

/** "+1.2" / "-0.4" — a signed change, which is what readers compare at a glance. */
export function signed(v, decimals) {
  if (v === null || v === undefined) return '–';
  const s = value(Math.abs(v), decimals);
  return (v >= 0 ? '+' : '−') + s;
}

/** The latest year a series actually reports, and the value in it. */
export function latest(series) {
  const years = Object.keys(series).map(Number).sort((a, b) => a - b);
  if (!years.length) return { year: null, value: null };
  const y = years[years.length - 1];
  return { year: y, value: series[y] };
}

/** The value n years back, or the nearest earlier year the series reports. */
export function back(series, yearsBack) {
  const years = Object.keys(series).map(Number).sort((a, b) => a - b);
  const last = years[years.length - 1];
  const target = last - yearsBack;
  let best = null;
  for (const y of years) if (y <= target) best = y;
  if (best === null) return { year: null, value: null };
  return { year: best, value: series[best] };
}

export function change(series, yearsBack) {
  const a = back(series, yearsBack);
  const b = latest(series);
  if (a.value === null || b.value === null) return null;
  return { from: a, to: b, absolute: b.value - a.value, relative: a.value === 0 ? null : (b.value - a.value) / Math.abs(a.value) };
}

export function pct(v, decimals = 1) {
  if (v === null || v === undefined) return '–';
  return signed(v * 100, decimals) + '%';
}
