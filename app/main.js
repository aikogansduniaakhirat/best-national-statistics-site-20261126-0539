// main.js — the router. Nusa Data has no server and no build step: this file reads
// the hash, mounts the matching view into <main>, marks the section in the masthead
// and moves focus to the new heading so a keyboard or screen-reader user lands where
// the page starts. It also keeps the document title in step with the page.

import { homePage, populationPage, economyPage, societyPage, comparePage, indicatorsPage, indicatorPage } from './views.js';
import { INDICATORS, PULLED } from './data.js';

const main = document.getElementById('main');
const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
const pulled = document.getElementById('pulled');
if (pulled) pulled.textContent = PULLED;

function parse(hash) {
  const raw = (hash || '#/').replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, query: new URLSearchParams(qs || '') };
}

function resolve(parts, query) {
  if (!parts.length) return { view: homePage, nav: 'home', title: 'Overview' };
  switch (parts[0]) {
    case 'population': return { view: populationPage, nav: 'population', title: 'Population' };
    case 'economy': return { view: economyPage, nav: 'economy', title: 'Economy' };
    case 'society': return { view: societyPage, nav: 'society', title: 'Society' };
    case 'compare': return { view: comparePage, nav: 'compare', title: 'Compare' };
    case 'indicators': return { view: () => indicatorsPage(query.get('q') || ''), nav: 'indicators', title: 'All indicators' };
    case 'indicator': {
      const key = parts[1];
      const ind = INDICATORS[key];
      return { view: () => indicatorPage(key), nav: 'indicators', title: ind ? ind.label : 'Indicator' };
    }
    default: return { view: homePage, nav: 'home', title: 'Overview' };
  }
}

function render() {
  const { parts, query } = parse(window.location.hash);
  const { view, nav, title } = resolve(parts, query);

  main.textContent = '';
  main.append(view());

  for (const link of navLinks) {
    if (link.dataset.nav === nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  document.title = title === 'Overview' ? 'Nusa Data — statistics of Indonesia' : `${title} — Nusa Data`;
  const heading = main.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
