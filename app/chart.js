// chart.js — hand-built SVG charts: a line series, a small-multiple line, and a
// horizontal bar. No library, no canvas, no network: every chart is DOM nodes the
// page owns, so it prints, scales with the column and is readable to a screen reader
// through its caption and its aria-label.

import { tick } from './format.js';

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, String(attrs[k]));
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Round a span up to a step a reader can divide in their head. */
function niceStep(span, target = 4) {
  if (span <= 0) return 1;
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export function scale(values, { zero = false, pad = 0.08 } = {}) {
  const clean = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!clean.length) return { min: 0, max: 1, ticks: [0, 1] };
  let min = Math.min(...clean);
  let max = Math.max(...clean);
  if (zero) min = Math.min(0, min);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min = zero && min >= 0 ? 0 : min - span * pad;
  max = max + span * pad;
  const step = niceStep(max - min);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = lo; t <= hi + step / 1000; t += step) ticks.push(Number(t.toFixed(6)));
  return { min: lo, max: hi, ticks };
}

/**
 * A line chart of one or more series over years.
 * series: [{ name, colour, points: [[year, value], ...] }]
 */
export function lineChart(series, opts = {}) {
  const {
    width = 720, height = 260, decimals = 1, label = '', yFormat = tick,
    zero = false, area = true, showDots = true,
  } = opts;
  const pad = { top: 14, right: 12, bottom: 26, left: 48 };
  const iw = width - pad.left - pad.right;
  const ih = height - pad.top - pad.bottom;

  const allYears = series.flatMap((s) => s.points.map((p) => p[0]));
  const allValues = series.flatMap((s) => s.points.map((p) => p[1]));
  const y0 = Math.min(...allYears);
  const y1 = Math.max(...allYears);
  const { min, max, ticks } = scale(allValues, { zero });

  const x = (yr) => pad.left + (y1 === y0 ? iw / 2 : ((yr - y0) / (y1 - y0)) * iw);
  const y = (v) => pad.top + ih - ((v - min) / (max - min)) * ih;

  const svg = el('svg', {
    class: 'chart', viewBox: `0 0 ${width} ${height}`, role: 'img',
    'aria-label': label || 'Line chart',
    preserveAspectRatio: 'xMidYMid meet',
  });

  for (const t of ticks) {
    svg.append(el('line', { class: 'grid-line', x1: pad.left, x2: width - pad.right, y1: y(t), y2: y(t) }));
    svg.append(el('text', { x: pad.left - 8, y: y(t) + 3.5, 'text-anchor': 'end' }, yFormat(t)));
  }

  const yearTicks = [];
  const stepY = (y1 - y0) > 40 ? 10 : (y1 - y0) > 12 ? 5 : 2;
  for (let yr = Math.ceil(y0 / stepY) * stepY; yr <= y1; yr += stepY) yearTicks.push(yr);
  for (const yr of yearTicks) {
    svg.append(el('text', { x: x(yr), y: height - 8, 'text-anchor': 'middle' }, String(yr)));
  }
  svg.append(el('line', { class: 'axis', x1: pad.left, x2: width - pad.right, y1: y(min), y2: y(min) }));

  series.forEach((s, i) => {
    // break the path where a year is missing, rather than drawing through the gap
    const segments = [];
    let current = [];
    const sorted = [...s.points].sort((a, b) => a[0] - b[0]);
    let prevYear = null;
    for (const [yr, v] of sorted) {
      if (prevYear !== null && yr - prevYear > 1) { if (current.length) segments.push(current); current = []; }
      current.push([yr, v]);
      prevYear = yr;
    }
    if (current.length) segments.push(current);

    for (const seg of segments) {
      const d = seg.map(([yr, v], j) => `${j === 0 ? 'M' : 'L'}${x(yr).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      if (area && seg.length > 1) {
        const base = y(Math.max(min, 0));
        const areaD = `${d} L${x(seg[seg.length - 1][0]).toFixed(1)},${base.toFixed(1)} L${x(seg[0][0]).toFixed(1)},${base.toFixed(1)} Z`;
        svg.append(el('path', { d: areaD, fill: s.colour, opacity: 0.1 }));
      }
      svg.append(el('path', { class: 'line', d, stroke: s.colour }));
    }

    if (showDots) {
      const last = sorted[sorted.length - 1];
      const first = sorted[0];
      for (const p of [first, last]) {
        svg.append(el('circle', { class: 'dot', cx: x(p[0]), cy: y(p[1]), r: 3.4, fill: s.colour }));
      }
    }
  });

  return svg;
}

/**
 * A bar chart, horizontal, ranked: used for the comparator page and for any
 * "which is biggest" question. items: [{ name, value, colour, me }]
 */
export function barChart(items, opts = {}) {
  const { decimals = 1, label = '', format = tick } = opts;
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const wrap = document.createElement('div');
  wrap.className = 'bars';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', label || 'Bar chart');

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'peer-row' + (item.me ? ' me' : '');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;
    const track = document.createElement('span');
    track.className = 'bar-track';
    const fill = document.createElement('span');
    fill.className = 'bar-fill';
    fill.style.width = Math.max(1.5, (Math.abs(item.value) / max) * 100).toFixed(1) + '%';
    if (item.colour) fill.style.background = item.colour;
    track.append(fill);
    const val = document.createElement('span');
    val.className = 'val';
    val.textContent = format(item.value, decimals);
    row.append(name, track, val);
    wrap.append(row);
  }
  return wrap;
}

/**
 * A sparkline: the shape of a series with no axes, for a card or a table row.
 */
export function sparkline(points, { width = 120, height = 32, colour = '#0d6b60' } = {}) {
  const values = points.map((p) => p[1]);
  const { min, max } = scale(values, { pad: 0.12 });
  const x = (i) => (points.length === 1 ? width / 2 : (i / (points.length - 1)) * width);
  const y = (v) => height - ((v - min) / (max - min || 1)) * height;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width, height, 'aria-hidden': 'true', class: 'spark' });
  svg.append(el('path', { d, fill: 'none', stroke: colour, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
  return svg;
}

/** The legend a multi-series chart needs; returned as DOM, not as a caption. */
export function legend(entries) {
  const wrap = document.createElement('p');
  wrap.className = 'caption legend';
  for (const e of entries) {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = e.colour;
    swatch.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.textContent = e.name;
    wrap.append(swatch, name);
  }
  return wrap;
}
