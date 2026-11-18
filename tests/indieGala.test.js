const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const fixture = readFileSync(path.join(__dirname, 'fixtures/indiegala-bundle.html'), 'utf8');
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const scripts = manifest.content_scripts.find((entry) => entry.js.includes('indieGala.js')).js;
const badgeSelector = '[data-do-i-own-this-game-badge]';
const summarySelector = '[data-do-i-own-this-game-summary]';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function load(t, html = fixture, gameNames = []) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.browser = { storage: { local: { get: async () => ({ gameNames }) } } };
  for (const file of scripts) dom.window.eval(readFileSync(path.join(root, file), 'utf8'));
  await delay(0);
  return dom.window;
}

function findCard(document, name) {
  return Array.from(document.querySelectorAll('.bundle-page-tier-item-outer')).find(
    (card) => card.querySelector('.bundle-page-tier-item-title').textContent.trim() === name
  );
}

test('IndieGala marks exact and similar titles and counts only bundle games', async (t) => {
  const { document } = await load(t, fixture, ['  LAB INSPECT™ ', 'halt', 'power driver deluxe']);
  for (const name of ['Lab Inspect', 'Halt']) {
    const card = findCard(document, name);
    assert.equal(card.querySelector('figure img').style.filter, 'sepia(100%)');
    assert.equal(card.querySelector(badgeSelector).textContent, 'You own this game');
  }
  const similar = findCard(document, 'Power Driver');
  assert.equal(similar.querySelector('figure img').style.filter, 'grayscale(100%)');
  assert.match(similar.querySelector(badgeSelector).textContent, /power driver deluxe/);
  assert.equal(findCard(document, 'Agent Murphy').querySelector(badgeSelector), null);
  assert.equal(document.querySelectorAll(badgeSelector).length, 3);
  assert.match(document.querySelector(summarySelector).textContent, /2\/9 games.*1 similar games/);
  assert.equal(document.querySelector(summarySelector).parentElement.nextElementSibling.className, 'bundle-page-tier-games');
});

test('IndieGala handles delayed loading and replacement of the game grid', async (t) => {
  const { document } = await load(t, '<main></main>', ['lab inspect']);
  assert.equal(document.querySelector(summarySelector), null);
  document.querySelector('main').outerHTML = fixture;
  await delay(180);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
  const template = document.createElement('template');
  template.innerHTML = fixture;
  document.querySelector('.bundle-page-tier-games').replaceWith(
    template.content.querySelector('.bundle-page-tier-games')
  );
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
});

test('IndieGala preserves card links, title nodes and price controls through updates', async (t) => {
  const { document } = await load(t, fixture, ['lab inspect']);
  const card = findCard(document, 'Lab Inspect');
  const link = card.querySelector('.fit-click');
  const title = card.querySelector('strong');
  const price = document.querySelector('.bundle-page-tier-text strong');
  const badge = card.querySelector(badgeSelector);
  let clicks = 0;
  link.addEventListener('click', (event) => { event.preventDefault(); clicks++; });
  document.querySelector('main').appendChild(document.createElement('div'));
  await delay(180);
  link.click();
  assert.equal(clicks, 1);
  assert.equal(card.querySelector('.fit-click'), link);
  assert.equal(card.querySelector('strong'), title);
  assert.equal(document.querySelector('.bundle-page-tier-text strong'), price);
  assert.equal(card.querySelector(badgeSelector), badge);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  badge.remove();
  await delay(180);
  assert.equal(card.querySelectorAll(badgeSelector).length, 1);
});

test('IndieGala finds artwork after card children are rearranged', async (t) => {
  const { document } = await load(t, fixture, ['power driver deluxe']);
  const card = findCard(document, 'Power Driver');
  const inner = card.querySelector('.bundle-page-tier-item-inner');
  const extra = document.createElement('div');
  extra.textContent = 'New label';
  inner.prepend(extra);
  await delay(180);
  assert.equal(card.querySelector('figure img').style.filter, 'grayscale(100%)');
  assert.equal(extra.style.filter, '');
  assert.equal(card.querySelectorAll(badgeSelector).length, 1);
});

test('IndieGala updates reused titles, including plain text without a strong element', async (t) => {
  const { document } = await load(t, fixture, ['lab inspect']);
  const card = findCard(document, 'Lab Inspect');
  const title = card.querySelector('.bundle-page-tier-item-title');
  title.textContent = 'Completely Different Game';
  await delay(180);
  assert.equal(card.querySelector(badgeSelector), null);
  assert.equal(card.querySelector('figure img').style.filter, '');
  assert.match(document.querySelector(summarySelector).textContent, /0\/9 games/);
  title.textContent = 'Lab Inspect';
  await delay(180);
  assert.equal(card.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
});

test('IndieGala ignores slider copies and recommendations, and removes stale summaries', async (t) => {
  const { document } = await load(t, fixture, ['lab inspect']);
  const details = document.createElement('section');
  details.className = 'bundle-slider';
  details.innerHTML = '<h3 class="bundle-slider-game-info-title">Lab Inspect</h3>';
  const copy = findCard(document, 'Lab Inspect').cloneNode(true);
  copy.querySelector(badgeSelector).remove();
  details.appendChild(copy);
  document.querySelector('main').appendChild(details);
  await delay(180);
  assert.equal(details.querySelector(badgeSelector), null);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
  document.querySelector('.bundle-page-tier-games').remove();
  await delay(180);
  assert.equal(document.querySelector(summarySelector), null);
  assert.equal(details.querySelector(badgeSelector), null);
});

test('IndieGala tolerates empty libraries and missing title wrappers or headings', async (t) => {
  const html = fixture.replace(/<strong>([^<]*)<\/strong>/g, '$1');
  const { document } = await load(t, html);
  document.querySelector('.bundle-page-tier-text').remove();
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 0);
  assert.match(document.querySelector(summarySelector).textContent, /0\/9 games/);
});
