// views.js — every page of Nusa Data, as functions that return DOM.
// A page is a heading, a lede, then figures and charts; the router in main.js
// decides which one to mount and marks its link in the masthead.

import { INDICATORS, PEERS, COUNTRIES, PULLED } from './data.js';
import { lineChart, barChart, sparkline, legend } from './chart.js';
import { value, words, signed, latest, back, change, pct, year as fmtYear, tick } from './format.js';

const COLOURS = { IDN: '#b8482a', MYS: '#0d6b60', THA: '#b8862a', VNM: '#4a5fa8', PHL: '#7a4a8a', SGP: '#2a7a8a' };

const h = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const points = (series) => Object.keys(series).map(Number).sort((a, b) => a - b).map((y) => [y, series[y]]);

function figureBlock(key, { delta = 10 } = {}) {
  const ind = INDICATORS[key];
  const last = latest(ind.series.IDN);
  const ch = change(ind.series.IDN, delta);
  const box = h('div', 'figure');
  box.append(h('div', 'k', ind.label));
  const v = h('div', 'v');
  v.append(document.createTextNode(ind.unit === 'US$' && last.value > 1e6 ? words(last.value) : value(last.value, ind.decimals)));
  if (ind.unit !== 'US$' && ind.decimals === 0 && last.value > 1e5) v.append(document.createTextNode(' '), h('small', '', ind.unit));
  else v.append(h('small', '', ' ' + ind.unit));
  box.append(v);
  box.append(h('div', 'y', `${fmtYear(last.year)} · ${ind.id}`));
  if (ch && ch.relative !== null) {
    const d = h('div', 'd');
    const arrow = h('b', ch.absolute >= 0 ? 'up' : 'down', ch.absolute >= 0 ? '▲ ' : '▼ ');
    d.append(arrow, document.createTextNode(`${pct(ch.relative)} since ${ch.from.year}`));
    box.append(d);
  }
  return box;
}

function chartBlock(title, unit, svg, caption, extra) {
  const box = h('section', 'chart-block');
  const head = h('header');
  head.append(h('h3', '', title), h('span', 'unit', unit));
  box.append(head);
  const holder = h('div', 'chart-holder');
  holder.append(svg);
  box.append(holder);
  if (extra) box.append(extra);
  const cap = h('p', 'caption');
  cap.innerHTML = caption;
  box.append(cap);
  return box;
}

function card(href, title, body, meta) {
  const a = h('a', 'card');
  a.href = href;
  a.append(h('h3', '', title), h('p', '', body));
  if (meta) a.append(h('div', 'meta', meta));
  a.append(h('span', 'go', 'Open →'));
  return a;
}

/* ---------------------------------------------------------------- home */

export function homePage() {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'Overview'));
  frag.append(h('h1', '', 'Indonesia in figures'));
  frag.append(h('p', 'lede', 'A country of 285 million people, the largest economy in Southeast Asia, and a society changing faster than its statistics are usually read. These are the numbers that describe it, each with its source and the year it belongs to.'));

  const ledger = h('div', 'ledger');
  for (const k of ['pop', 'gdp', 'gdppc', 'life']) ledger.append(figureBlock(k, { delta: 10 }));
  frag.append(ledger);
  const pop = INDICATORS.pop;
  const popCh = change(pop.series.IDN, 10);
  frag.append(h('p', 'note-line', `Population growth has slowed to ${value(latest(INDICATORS.popgrow.series.IDN).value, 2)}% a year; ten years ago it was ${value(back(INDICATORS.popgrow.series.IDN, 10).value, 2)}%. Fertility is ${value(latest(INDICATORS.fertility.series.IDN).value, 2)} births per woman, against ${value(back(INDICATORS.fertility.series.IDN, 30).value, 2)} in ${back(INDICATORS.fertility.series.IDN, 30).year}.`));

  const head = h('div', 'section-head');
  head.append(h('h2', '', 'Three ways in'));
  frag.append(head);
  const grid = h('div', 'grid three');
  grid.append(
    card('#/population', 'Population', `Growth, age structure, fertility and life expectancy from 1960 to ${latest(INDICATORS.pop.series.IDN).year}.`, '8 indicators'),
    card('#/economy', 'Economy', 'Output, income per person, prices, jobs and trade, with the 1998 contraction and the 2020 one side by side.', '9 indicators'),
    card('#/society', 'Society', 'Poverty, schooling, health spending, electricity, the internet and forest cover.', '9 indicators'),
  );
  frag.append(grid);

  const head2 = h('div', 'section-head');
  head2.append(h('h2', '', 'The long view'));
  const more = h('a', 'more', 'All indicators →');
  more.href = '#/indicators';
  head2.append(more);
  frag.append(head2);

  const popPoints = points(INDICATORS.pop.series.IDN);
  frag.append(chartBlock(
    'Population, 1960 to ' + latest(INDICATORS.pop.series.IDN).year,
    'people',
    lineChart([{ name: 'Indonesia', colour: COLOURS.IDN, points: popPoints }], { label: 'Indonesia population by year', yFormat: tick, zero: true }),
    `Total population. <code>SP.POP.TOTL</code> · World Bank WDI, latest ${latest(INDICATORS.pop.series.IDN).year}: ${value(latest(INDICATORS.pop.series.IDN).value, 0)}.`,
  ));

  const gdpPts = points(INDICATORS.gdppc.series.IDN);
  frag.append(chartBlock(
    'Income per person, 1967 to ' + latest(INDICATORS.gdppc.series.IDN).year,
    'US$ at current prices',
    lineChart([{ name: 'GDP per person', colour: COLOURS.THA, points: gdpPts }], { label: 'GDP per person in US dollars by year', yFormat: tick }),
    `GDP per person, current US$. <code>NY.GDP.PCAP.CD</code> · latest ${latest(INDICATORS.gdppc.series.IDN).year}: US$${value(latest(INDICATORS.gdppc.series.IDN).value, 0)}.`,
  ));

  const head3 = h('div', 'section-head');
  head3.append(h('h2', '', 'How Indonesia compares'));
  const more3 = h('a', 'more', 'The full comparison →');
  more3.href = '#/compare';
  head3.append(more3);
  frag.append(head3);

  const peerItems = Object.keys(PEERS['NY.GDP.PCAP.CD']).map((iso) => ({
    name: COUNTRIES[iso], value: latest(PEERS['NY.GDP.PCAP.CD'][iso]).value, me: iso === 'IDN', colour: iso === 'IDN' ? COLOURS.IDN : undefined,
  })).sort((a, b) => b.value - a.value);
  const peerBox = h('section', 'chart-block');
  const ph = h('header');
  ph.append(h('h3', '', 'Income per person, ' + latest(PEERS['NY.GDP.PCAP.CD'].IDN).year), h('span', 'unit', 'US$, current prices'));
  peerBox.append(ph);
  peerBox.append(barChart(peerItems, { label: 'GDP per person by country', format: (v) => 'US$' + value(v, 0) }));
  peerBox.append(h('p', 'caption', 'GDP per person, current US$. <code>NY.GDP.PCAP.CD</code> · World Bank WDI, ' + latest(PEERS['NY.GDP.PCAP.CD'].IDN).year + '.'));
  frag.append(peerBox);

  return frag;
}

/* ---------------------------------------------------------- population */

export function populationPage() {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'Population'));
  frag.append(h('h1', '', 'A population that has quadrupled, and is now slowing'));
  frag.append(h('p', 'lede', 'Indonesia counted 88.7 million people in 1960 and 285 million in ' + latest(INDICATORS.pop.series.IDN).year + '. The growth that produced that is ending: fertility has been below the replacement rate since the mid-2010s, and the age structure is shifting for the first time since records began.'));

  const ledger = h('div', 'ledger');
  for (const k of ['pop', 'popgrow', 'fertility', 'life', 'urban', 'old']) ledger.append(figureBlock(k, { delta: 20 }));
  frag.append(ledger);

  const frag2 = document.createDocumentFragment();
  frag2.append(chartBlock('Population', 'people', lineChart([{ name: 'Indonesia', colour: COLOURS.IDN, points: points(INDICATORS.pop.series.IDN) }], { label: 'Population by year', yFormat: tick, zero: true }),
    'Total population. <code>SP.POP.TOTL</code> · World Bank WDI.'));
  frag2.append(chartBlock('Growth rate', '% a year', lineChart([{ name: 'Growth', colour: COLOURS.MYS, points: points(INDICATORS.popgrow.series.IDN) }], { label: 'Population growth rate by year' }),
    'Annual population growth. <code>SP.POP.GROW</code> · the peak is ' + (() => { const p = points(INDICATORS.popgrow.series.IDN); const top = p.reduce((a, b) => (b[1] > a[1] ? b : a)); return value(top[1], 2) + '% in ' + top[0]; })() + '.'));

  const two = h('div', 'grid two');
  two.append(
    chartBlock('Fertility', 'births per woman', lineChart([{ name: 'Fertility', colour: COLOURS.THA, points: points(INDICATORS.fertility.series.IDN) }], { label: 'Fertility rate by year' }),
      'Births per woman. <code>SP.DYN.TFRT.IN</code> · replacement is about 2.1.'),
    chartBlock('Life expectancy', 'years', lineChart([{ name: 'Life expectancy', colour: COLOURS.IDN, points: points(INDICATORS.life.series.IDN) }], { label: 'Life expectancy at birth by year' }),
      'Life expectancy at birth. <code>SP.DYN.LE00.IN</code>.'),
  );
  frag2.append(two);

  const two2 = h('div', 'grid two');
  two2.append(
    chartBlock('Age structure', '% of population', lineChart([
      { name: 'Aged 0–14', colour: COLOURS.THA, points: points(INDICATORS.young.series.IDN) },
      { name: 'Aged 65+', colour: COLOURS.IDN, points: points(INDICATORS.old.series.IDN) },
    ], { label: 'Share of population aged 0 to 14 and 65 and over', area: false }),
      'Shares of total population. <code>SP.POP.0014.TO.ZS</code> and <code>SP.POP.65UP.TO.ZS</code>.',
      legend([{ name: 'Aged 0–14', colour: COLOURS.THA }, { name: 'Aged 65+', colour: COLOURS.IDN }])),
    chartBlock('Urban share', '% of population', lineChart([{ name: 'Urban', colour: COLOURS.MYS, points: points(INDICATORS.urban.series.IDN) }], { label: 'Urban share of population by year' }),
      'Urban population as a share of total. <code>SP.URB.TOTL.IN.ZS</code>.'),
  );
  frag2.append(two2);

  frag2.append(chartBlock('Infant mortality', 'deaths per 1,000 live births', lineChart([{ name: 'Infant mortality', colour: COLOURS.PHL, points: points(INDICATORS.imr.series.IDN) }], { label: 'Infant mortality rate by year', zero: true }),
    'Infant deaths per 1,000 live births. <code>SP.DYN.IMRT.IN</code>.'));

  frag.append(frag2);
  return frag;
}

/* ------------------------------------------------------------- economy */

export function economyPage() {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'Economy'));
  frag.append(h('h1', '', 'The largest economy in Southeast Asia, measured honestly'));
  frag.append(h('p', 'lede', 'Indonesia\'s output passed US$1.4 trillion in ' + latest(INDICATORS.gdp.series.IDN).year + '. The series below also hold the two years that shaped how Indonesians think about money: the 1998 collapse, when output fell by 13% and prices rose by 58%, and 2020, when it fell by 2% and the state borrowed to soften it.'));

  const ledger = h('div', 'ledger');
  for (const k of ['gdp', 'gdppc', 'gdpgrow', 'cpi', 'unemp', 'exports']) ledger.append(figureBlock(k, { delta: 10 }));
  frag.append(ledger);

  frag.append(chartBlock('Output', 'US$, current prices', lineChart([{ name: 'GDP', colour: COLOURS.IDN, points: points(INDICATORS.gdp.series.IDN) }], { label: 'GDP in current US dollars by year', yFormat: tick }),
    'GDP at current prices. <code>NY.GDP.MKTP.CD</code> · US$' + value(latest(INDICATORS.gdp.series.IDN).value, 0) + ' in ' + latest(INDICATORS.gdp.series.IDN).year + '.'));

  frag.append(chartBlock('Growth', '% a year, constant prices', lineChart([{ name: 'GDP growth', colour: COLOURS.MYS, points: points(INDICATORS.gdpgrow.series.IDN) }], { label: 'GDP growth rate by year', zero: true }),
    'Real GDP growth. <code>NY.GDP.MKTP.KD.ZG</code> · the trough is ' + (() => { const p = points(INDICATORS.gdpgrow.series.IDN); const low = p.reduce((a, b) => (b[1] < a[1] ? b : a)); return value(low[1], 2) + '% in ' + low[0]; })() + '.'));

  const two = h('div', 'grid two');
  two.append(
    chartBlock('Inflation', '% a year', lineChart([{ name: 'CPI', colour: COLOURS.THA, points: points(INDICATORS.cpi.series.IDN) }], { label: 'Consumer price inflation by year', zero: true }),
      'Consumer prices, annual change. <code>FP.CPI.TOTL.ZG</code> · the 1998 spike is ' + (() => { const p = points(INDICATORS.cpi.series.IDN); const top = p.reduce((a, b) => (b[1] > a[1] ? b : a)); return value(top[1], 2) + '% in ' + top[0]; })() + '.'),
    chartBlock('Unemployment', '% of labour force', lineChart([{ name: 'Unemployment', colour: COLOURS.IDN, points: points(INDICATORS.unemp.series.IDN) }], { label: 'Unemployment rate by year', zero: true }),
      'Unemployment, ILO model. <code>SL.UEM.TOTL.ZS</code> · the series starts in 1991.'),
  );
  frag.append(two);

  const two2 = h('div', 'grid two');
  two2.append(
    chartBlock('Trade', '% of GDP', lineChart([
      { name: 'Exports', colour: COLOURS.MYS, points: points(INDICATORS.exports.series.IDN) },
      { name: 'Imports', colour: COLOURS.PHL, points: points(INDICATORS.imports.series.IDN) },
    ], { label: 'Exports and imports as a share of GDP', area: false }),
      'Exports and imports of goods and services. <code>NE.EXP.GNFS.ZS</code>, <code>NE.IMP.GNFS.ZS</code>.',
      legend([{ name: 'Exports', colour: COLOURS.MYS }, { name: 'Imports', colour: COLOURS.PHL }])),
    chartBlock('Foreign direct investment', '% of GDP, net inflows', lineChart([{ name: 'FDI', colour: COLOURS.VNM, points: points(INDICATORS.fdi.series.IDN) }], { label: 'FDI net inflows as a share of GDP', zero: true }),
      'Net inflows of foreign direct investment. <code>BX.KLT.DINV.WD.GD.ZS</code>.'),
  );
  frag.append(two2);

  frag.append(chartBlock('Labour force participation', '% of population 15+', lineChart([{ name: 'Participation', colour: COLOURS.SGP, points: points(INDICATORS.lfp.series.IDN) }], { label: 'Labour force participation rate by year' }),
    'Labour force participation, ILO model. <code>SL.TLF.CACT.ZS</code> · it counts everyone 15 and over who works or looks for work, so it falls as more young people stay in school.'));

  return frag;
}

/* ------------------------------------------------------------- society */

export function societyPage() {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'Society'));
  frag.append(h('h1', '', 'What life improved, and what it cost'));
  frag.append(h('p', 'lede', 'Poverty fell from 20% of the population in 1996 to single digits before the pandemic; electricity reached nearly everyone; the internet arrived in a decade. Forest cover went the other way. These are the trade-offs a country of 285 million lives with.'));

  const ledger = h('div', 'ledger');
  for (const k of ['poverty', 'internet', 'electricity', 'secondary', 'healthspend', 'forest']) ledger.append(figureBlock(k, { delta: 10 }));
  frag.append(ledger);

  frag.append(chartBlock('Poverty', '% of population below the national line', lineChart([{ name: 'Poverty', colour: COLOURS.RUST || '#b8482a', points: points(INDICATORS.poverty.series.IDN) }], { label: 'Poverty headcount at the national line by year', zero: true }),
    'Poverty headcount ratio at the national poverty line. <code>SI.POV.NAHC</code> · the World Bank reports it in survey years only, and the line leaves the gap rather than filling it.'));

  const two = h('div', 'grid two');
  two.append(
    chartBlock('Electricity', '% of population with access', lineChart([{ name: 'Access', colour: COLOURS.THA, points: points(INDICATORS.electricity.series.IDN) }], { label: 'Access to electricity by year', zero: true }),
      'Access to electricity. <code>EG.ELC.ACCS.ZS</code>.'),
    chartBlock('Internet', '% of population', lineChart([{ name: 'Internet users', colour: COLOURS.MYS, points: points(INDICATORS.internet.series.IDN) }], { label: 'Internet users as a share of population', zero: true }),
      'Individuals using the internet. <code>IT.NET.USER.ZS</code>.'),
  );
  frag.append(two);

  const two2 = h('div', 'grid two');
  two2.append(
    chartBlock('Schooling', '% gross enrolment', lineChart([
      { name: 'Secondary', colour: COLOURS.VNM, points: points(INDICATORS.secondary.series.IDN) },
      { name: 'Literacy, 15+', colour: COLOURS.IDN, points: points(INDICATORS.literacy.series.IDN) },
    ], { label: 'Secondary enrolment and adult literacy', area: false }),
      'Secondary school enrolment, gross (<code>SE.SEC.ENRR</code>), and adult literacy (<code>SE.ADT.LITR.ZS</code>), which the World Bank reports in census years only.',
      legend([{ name: 'Secondary enrolment', colour: COLOURS.VNM }, { name: 'Adult literacy', colour: COLOURS.IDN }])),
    chartBlock('Public spending', '% of GDP', lineChart([
      { name: 'Health', colour: COLOURS.MYS, points: points(INDICATORS.healthspend.series.IDN) },
      { name: 'Education', colour: COLOURS.THA, points: points(INDICATORS.eduspend.series.IDN) },
    ], { label: 'Health and education spending as a share of GDP', area: false }),
      'Current health expenditure (<code>SH.XPD.CHEX.GD.ZS</code>) and government expenditure on education (<code>SE.XPD.TOTL.GD.ZS</code>).',
      legend([{ name: 'Health', colour: COLOURS.MYS }, { name: 'Education', colour: COLOURS.THA }])),
  );
  frag.append(two2);

  frag.append(chartBlock('Forest cover', '% of land area', lineChart([{ name: 'Forest', colour: COLOURS.SGP, points: points(INDICATORS.forest.series.IDN) }], { label: 'Forest cover as a share of land area', zero: true }),
    'Forest area as a share of land area. <code>AG.LND.FRST.ZS</code> · from ' + (points(INDICATORS.forest.series.IDN)[0][1]) + '% in ' + points(INDICATORS.forest.series.IDN)[0][0] + ' to ' + latest(INDICATORS.forest.series.IDN).value + '% in ' + latest(INDICATORS.forest.series.IDN).year + '.'));

  return frag;
}

/* ------------------------------------------------------------- compare */

const COMPARE = [
  ['NY.GDP.PCAP.CD', 'Income per person', 'US$', 0],
  ['SP.DYN.LE00.IN', 'Life expectancy', 'years', 1],
  ['SP.POP.TOTL', 'Population', 'people', 0],
  ['IT.NET.USER.ZS', 'Internet users', '% of population', 1],
  ['SL.UEM.TOTL.ZS', 'Unemployment', '% of labour force', 1],
];

export function comparePage() {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'Compare'));
  frag.append(h('h1', '', 'Indonesia beside its neighbours'));
  frag.append(h('p', 'lede', 'Six countries, five measures, the same World Bank series for each. Singapore is a city-state and a financial centre; Indonesia is an archipelago of 17,000 islands. The comparison is not a ranking of how well each is doing, but it shows the scale Indonesia is working at.'));

  const two = h('div', 'grid two');
  for (const [id, label, unit, dec] of COMPARE) {
    const series = PEERS[id];
    const yr = Math.max(...Object.keys(series.IDN).map(Number));
    const items = Object.keys(series).map((iso) => ({ name: COUNTRIES[iso], value: latest(series[iso]).value, me: iso === 'IDN', colour: iso === 'IDN' ? COLOURS.IDN : undefined })).sort((a, b) => b.value - a.value);
    const box = h('section', 'chart-block');
    const head = h('header');
    head.append(h('h3', '', label), h('span', 'unit', unit + ', ' + yr));
    box.append(head);
    box.append(barChart(items, {
      label: label + ' by country',
      format: (v) => (unit === 'US$' ? 'US$' : '') + value(v, dec) + (unit === 'people' ? '' : ''),
    }));
    box.append(h('p', 'caption', `${label}. <code>${id}</code> · World Bank WDI, ${yr}.`));
    two.append(box);
  }
  frag.append(two);

  // The gap over time: Indonesia against the regional average, in one line each.
  const avg = (yr) => {
    const vals = Object.keys(PEERS['NY.GDP.PCAP.CD']).filter((iso) => iso !== 'IDN').map((iso) => PEERS['NY.GDP.PCAP.CD'][iso][yr]).filter((v) => typeof v === 'number');
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const years = Object.keys(PEERS['NY.GDP.PCAP.CD'].IDN).map(Number).sort((a, b) => a - b);
  const avgPts = years.map((y) => [y, avg(y)]).filter((p) => p[1] !== null);
  frag.append(chartBlock('Income per person, Indonesia against the five comparators\' average', 'US$, current prices',
    lineChart([
      { name: 'Indonesia', colour: COLOURS.IDN, points: points(PEERS['NY.GDP.PCAP.CD'].IDN) },
      { name: 'Five-country average', colour: COLOURS.MYS, points: avgPts },
    ], { label: 'GDP per person, Indonesia against the comparator average', area: false }),
    'GDP per person, current US$. <code>NY.GDP.PCAP.CD</code>. The average is unweighted across Malaysia, Thailand, Viet Nam, the Philippines and Singapore, so Singapore\'s income pulls it up sharply.',
    legend([{ name: 'Indonesia', colour: COLOURS.IDN }, { name: 'Five-country average', colour: COLOURS.MYS }])));

  // A table of the latest value for each, which is what a reader copies out.
  const tbl = h('div', 'table-wrap');
  const table = h('table');
  const thead = h('thead');
  const hr = h('tr');
  hr.append(h('th', '', 'Indicator'));
  for (const iso of Object.keys(COUNTRIES)) hr.append(h('th', '', COUNTRIES[iso]));
  thead.append(hr);
  table.append(thead);
  const tbody = h('tbody');
  for (const [id, label, unit, dec] of COMPARE) {
    const tr = h('tr');
    tr.append(h('td', '', label));
    for (const iso of Object.keys(COUNTRIES)) {
      const l = latest(PEERS[id][iso]);
      tr.append(h('td', 'num', (unit === 'US$' ? 'US$' : '') + value(l.value, dec)));
    }
    tbody.append(tr);
  }
  table.append(tbody);
  tbl.append(table);
  const tblHead = h('div', 'section-head');
  tblHead.append(h('h2', '', 'The numbers behind the charts'));
  frag.append(tblHead);
  frag.append(tbl);
  frag.append(h('p', 'note-line', 'Each cell is the latest year that country\'s series reports, which is ' + Math.max(...Object.keys(PEERS['NY.GDP.PCAP.CD'].IDN).map(Number)) + ' for income per person and population. Sources: World Bank WDI, series named above each chart.'));

  return frag;
}

/* ---------------------------------------------------------- indicators */

export function indicatorsPage(query = '') {
  const frag = document.createDocumentFragment();
  frag.append(h('p', 'eyebrow', 'All indicators'));
  frag.append(h('h1', '', 'Every series on this site'));
  frag.append(h('p', 'lede', `${Object.keys(INDICATORS).length} indicators, each a single World Bank series with the years it reports. Open one to see its full history, its latest value and its year-by-year table.`));

  const controls = h('div', 'controls');
  const search = h('div', 'control');
  const lab = h('label', '', 'Find an indicator');
  lab.setAttribute('for', 'q');
  const input = h('input');
  input.type = 'search';
  input.id = 'q';
  input.placeholder = 'poverty, GDP, fertility…';
  input.value = query;
  search.append(lab, input);
  controls.append(search);
  const count = h('span', 'readout');
  controls.append(count);
  frag.append(controls);

  const list = h('div', 'list');
  frag.append(list);

  const render = (q) => {
    list.textContent = '';
    const needle = q.trim().toLowerCase();
    const keys = Object.keys(INDICATORS).filter((k) => {
      const ind = INDICATORS[k];
      return !needle || ind.label.toLowerCase().includes(needle) || ind.id.toLowerCase().includes(needle) || ind.group.includes(needle);
    });
    count.textContent = `${keys.length} of ${Object.keys(INDICATORS).length}`;
    for (const k of keys) {
      const ind = INDICATORS[k];
      const l = latest(ind.series.IDN);
      const a = h('a');
      a.href = '#/indicator/' + k;
      a.append(h('span', 't', ind.label));
      a.append(h('span', 'n', (ind.unit === 'US$' ? 'US$' : '') + value(l.value, ind.decimals)));
      const pts = points(ind.series.IDN).slice(-40);
      const spark = sparkline(pts, { width: 96, height: 22, colour: '#0d6b60' });
      spark.classList.add('row-spark');
      a.append(spark);
      a.append(h('span', 's', `${ind.id} · ${ind.group} · latest ${l.year} · ${ind.unit}`));
      list.append(a);
    }
    if (!keys.length) list.append(h('p', 'note-line', 'No indicator matches that. Try “population”, “price” or “forest”.'));
  };
  render(query);
  input.addEventListener('input', () => render(input.value));
  return frag;
}

/* ---------------------------------------------------- one indicator */

export function indicatorPage(key) {
  const ind = INDICATORS[key];
  if (!ind) {
    const frag = document.createDocumentFragment();
    frag.append(h('h1', '', 'No such indicator'));
    const p = h('p', 'lede', 'That indicator is not on this site.');
    const a = h('a', '', 'Back to all indicators');
    a.href = '#/indicators';
    frag.append(p, a);
    return frag;
  }
  const frag = document.createDocumentFragment();
  const crumb = h('p', 'eyebrow', ind.group + ' · ' + ind.id);
  frag.append(crumb);
  frag.append(h('h1', '', ind.label));

  const l = latest(ind.series.IDN);
  const b10 = back(ind.series.IDN, 10);
  const ch = change(ind.series.IDN, 10);
  frag.append(h('p', 'lede', `${ind.label} for Indonesia, ${Object.keys(ind.series.IDN)[0]} to ${l.year}. The latest value is ${ind.unit === 'US$' ? 'US$' : ''}${value(l.value, ind.decimals)} ${ind.unit === 'US$' ? '' : ind.unit}, reported for ${l.year}${ch && ch.relative !== null ? `; ten years earlier it was ${ind.unit === 'US$' ? 'US$' : ''}${value(b10.value, ind.decimals)} in ${b10.year}` : ''}.`));

  // The controls: a year range the reader can narrow, and a toggle for the table.
  const controls = h('div', 'controls');
  const years = Object.keys(ind.series.IDN).map(Number).sort((a, b) => a - b);
  const first = years[0];
  const last = years[years.length - 1];

  const rangeCtl = h('div', 'control');
  const rl = h('label', '', 'From year');
  rl.setAttribute('for', 'from');
  const range = h('input');
  range.type = 'range';
  range.id = 'from';
  range.min = String(first);
  range.max = String(last);
  range.step = '1';
  range.value = String(first);
  const readout = h('span', 'readout', `${first} – ${last}`);
  rangeCtl.append(rl, range, readout);

  const viewCtl = h('div', 'control');
  viewCtl.append(h('label', '', 'View'));
  const seg = h('div', 'segmented');
  const btnChart = h('button', '', 'Chart');
  const btnTable = h('button', '', 'Table');
  btnChart.setAttribute('aria-pressed', 'true');
  btnTable.setAttribute('aria-pressed', 'false');
  seg.append(btnChart, btnTable);
  viewCtl.append(seg);

  const scaleCtl = h('div', 'control');
  scaleCtl.append(h('label', '', 'Baseline'));
  const seg2 = h('div', 'segmented');
  const btnAbs = h('button', '', 'Value');
  const btnIdx = h('button', '', 'Index');
  btnAbs.setAttribute('aria-pressed', 'true');
  btnIdx.setAttribute('aria-pressed', 'false');
  seg2.append(btnAbs, btnIdx);
  scaleCtl.append(seg2);

  controls.append(rangeCtl, viewCtl, scaleCtl);
  frag.append(controls);

  const holder = h('div');
  frag.append(holder);

  let mode = 'chart';
  let baseline = 'value';

  const draw = () => {
    holder.textContent = '';
    const from = Number(range.value);
    readout.textContent = `${from} – ${last}`;
    const pts = points(ind.series.IDN).filter((p) => p[0] >= from);
    if (mode === 'chart') {
      let shown = pts;
      let fmt = (v) => value(v, ind.decimals);
      if (baseline === 'index' && pts.length) {
        const base = pts[0][1];
        shown = pts.map(([y, v]) => [y, (v / base) * 100]);
        fmt = (v) => value(v, 0);
      }
      const box = chartBlock(ind.label + ', ' + from + ' to ' + last, baseline === 'index' ? `index, ${pts.length ? pts[0][0] : from} = 100` : ind.unit,
        lineChart([{ name: ind.label, colour: COLOURS.IDN, points: shown }], { label: ind.label + ' for Indonesia by year', yFormat: baseline === 'index' ? tick : (v) => tick(v) }),
        `${ind.label}. <code>${ind.id}</code> · World Bank WDI, ${from}–${last}.`);
      holder.append(box);
    } else {
      const tbl = h('div', 'table-wrap');
      const table = h('table');
      const thead = h('thead');
      const hr = h('tr');
      hr.append(h('th', '', 'Year'), h('th', '', ind.label), h('th', '', 'Change'));
      thead.append(hr);
      table.append(thead);
      const tbody = h('tbody');
      let prev = null;
      for (const [y, v] of [...pts].reverse()) {
        const tr = h('tr');
        tr.append(h('td', 'num', String(y)), h('td', 'num', (ind.unit === 'US$' ? 'US$' : '') + value(v, ind.decimals)));
        const d = prev === null ? null : v - prev;
        tr.append(h('td', 'num', d === null ? '–' : signed(d, ind.decimals)));
        prev = v;
        tbody.append(tr);
      }
      table.append(tbody);
      tbl.append(table);
      holder.append(tbl);
      holder.append(h('p', 'note-line', 'Newest first. The change column is against the year below, which is not always the year before when the series has a gap.'));
    }
  };

  btnChart.addEventListener('click', () => { mode = 'chart'; btnChart.setAttribute('aria-pressed', 'true'); btnTable.setAttribute('aria-pressed', 'false'); draw(); });
  btnTable.addEventListener('click', () => { mode = 'table'; btnChart.setAttribute('aria-pressed', 'false'); btnTable.setAttribute('aria-pressed', 'true'); draw(); });
  btnAbs.addEventListener('click', () => { baseline = 'value'; btnAbs.setAttribute('aria-pressed', 'true'); btnIdx.setAttribute('aria-pressed', 'false'); draw(); });
  btnIdx.addEventListener('click', () => { baseline = 'index'; btnAbs.setAttribute('aria-pressed', 'false'); btnIdx.setAttribute('aria-pressed', 'true'); draw(); });
  range.addEventListener('input', draw);

  draw();

  const head = h('div', 'section-head');
  head.append(h('h2', '', 'Related'));
  frag.append(head);
  const grid = h('div', 'grid three');
  for (const k of Object.keys(INDICATORS).filter((x) => x !== key && INDICATORS[x].group === ind.group).slice(0, 3)) {
    const o = INDICATORS[k];
    grid.append(card('#/indicator/' + k, o.label, `${o.id} · latest ${latest(o.series.IDN).year}`, (o.unit === 'US$' ? 'US$' : '') + value(latest(o.series.IDN).value, o.decimals) + ' ' + o.unit));
  }
  frag.append(grid);

  return frag;
}
