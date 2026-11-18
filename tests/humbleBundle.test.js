const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');

const fixture = readFileSync(path.join(__dirname, 'fixtures/humble-bundle.html'), 'utf8');
const cardSelector = '[data-testid="bundle-item-card"][data-bundle-type="games"]';
const badgeSelector = '[data-do-i-own-this-game-badge]';
const summarySelector = '[data-do-i-own-this-game-summary]';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function load(t, html = fixture, gameNames = []) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.browser = { storage: { local: { get: async () => ({ gameNames }) } } };
  for (const file of ['getGames.js', 'getNamesDistance.js', 'numberSummary.js', 'bundleOwnership.js', 'humbleBundle.js']) {
    dom.window.eval(readFileSync(path.join(__dirname, '..', file), 'utf8'));
  }
  await delay(0);
  return dom.window;
}

function findCard(document, name) {
  return Array.from(document.querySelectorAll(cardSelector)).find(
    (card) => card.querySelector('img').alt === name
  );
}

test('marks current Humble cards and counts exact, similar and unowned games', async (t) => {
  const { document } = await load(t, fixture, [
    '  POPUCOM™ ', 'DuneCrawl', 'Bread & Fred', 'Back 4 Blood: Ultimate Editions',
  ]);
  assert.equal(document.querySelectorAll(cardSelector).length, 9);
  for (const name of ['POPUCOM', 'DuneCrawl', 'Bread & Fred']) {
    const card = findCard(document, name);
    assert.equal(card.querySelector('img').style.filter, 'sepia(100%)');
    assert.equal(card.querySelector(badgeSelector).textContent, 'You own this game');
  }
  const similar = findCard(document, 'Back 4 Blood: Ultimate Edition');
  assert.equal(similar.querySelector('img').style.filter, 'grayscale(100%)');
  assert.match(similar.querySelector(badgeSelector).textContent, /Ultimate Editions/);
  assert.equal(findCard(document, 'Ember Knights').querySelector(badgeSelector), null);
  assert.match(document.querySelector(summarySelector).textContent, /3\/9 games.*1 similar games/);
});

test('handles cards arriving after the content script starts', async (t) => {
  const { document } = await load(t, '<main></main>', ['popucom']);
  assert.equal(document.querySelector(summarySelector), null);
  document.querySelector('main').innerHTML = fixture;
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
});

test('updates after tier replacement without duplicating badges or replacing controls', async (t) => {
  const { document } = await load(t, fixture, ['popucom', 'dunecrawl']);
  const popucom = findCard(document, 'POPUCOM');
  const button = popucom.closest('button');
  const originalBadge = popucom.querySelector(badgeSelector);
  let clicks = 0;
  button.addEventListener('click', () => clicks++);
  findCard(document, 'DuneCrawl').closest('li').remove();
  await delay(180);
  assert.equal(popucom.querySelector(badgeSelector), originalBadge);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/8 games/);
  button.click();
  assert.equal(clicks, 1);

  const section = document.querySelector('[data-bundle-section="games"]');
  section.outerHTML = fixture;
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 2);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /2\/9 games/);
});

test('removes stale marks when React reuses a card for another game', async (t) => {
  const { document } = await load(t, fixture, ['popucom']);
  const card = findCard(document, 'POPUCOM');
  card.querySelector('img').alt = 'Completely Different Title';
  await delay(180);
  assert.equal(card.querySelector(badgeSelector), null);
  assert.equal(card.querySelector('img').style.filter, '');
  assert.match(document.querySelector(summarySelector).textContent, /0\/9 games/);
});

test('restores badges removed during hydration and ignores non-game cards', async (t) => {
  const { document } = await load(t, fixture, ['popucom']);
  findCard(document, 'POPUCOM').querySelector(badgeSelector).remove();
  const bonus = findCard(document, 'POPUCOM').cloneNode(true);
  bonus.dataset.bundleType = 'software';
  document.body.appendChild(bonus);
  await delay(180);
  assert.equal(findCard(document, 'POPUCOM').querySelectorAll(badgeSelector).length, 1);
  assert.equal(bonus.querySelector(badgeSelector), null);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
});

test('supports an empty library and missing page headings', async (t) => {
  const { document } = await load(t, fixture, undefined);
  assert.equal(document.querySelectorAll(badgeSelector).length, 0);
  assert.match(document.querySelector(summarySelector).textContent, /0\/9 games/);
});

test('clears badges for incomplete cards and restores them once titles arrive', async (t) => {
  const { document } = await load(t, fixture, ['popucom']);
  const card = findCard(document, 'POPUCOM');
  const image = card.querySelector('img');
  image.alt = '';
  await delay(180);
  assert.equal(card.querySelector(badgeSelector), null);
  assert.equal(image.style.filter, '');
  assert.match(document.querySelector(summarySelector).textContent, /0\/8 games/);
  image.alt = 'POPUCOM';
  await delay(180);
  assert.equal(card.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/9 games/);
});

test('renders imported game names as text and removes summary when navigating away', async (t) => {
  const name = 'Back 4 Blood: Ultimate Edition <b>Deluxe</b>';
  const { document } = await load(t, fixture, [name]);
  const badge = findCard(document, 'Back 4 Blood: Ultimate Edition').querySelector(badgeSelector);
  assert.ok(badge);
  assert.ok(badge.textContent.includes(name));
  assert.equal(badge.children.length, 0);
  document.querySelector('[data-bundle-section="games"]').remove();
  await delay(180);
  assert.equal(document.querySelector(summarySelector), null);
});

test('continues to support the legacy Humble layout', async (t) => {
  const { document } = await load(t, `
    <h2 class="tier-header heading-medium js-tier-header">Pay what you want</h2>
    <div><img><span class="item-title">POPUCOM™</span></div>
    <div><img><span class="item-title">DuneCrawl</span></div>`, ['popucom']);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/2 games/);
  document.body.appendChild(document.createElement('div'));
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector('.item-title').textContent, /^POPUCOM™$/);
});

test('summary keeps existing header nodes and listeners when updated', async (t) => {
  const window = await load(t, '<h2 class="title"><button>Details</button></h2>');
  const { document } = window;
  const button = document.querySelector('button');
  let clicks = 0;
  button.addEventListener('click', () => clicks++);
  window.addNumberSummary(1, 4, 2, 'title');
  window.addNumberSummary(3, 4, 0, 'title');
  button.click();
  assert.equal(clicks, 1);
  assert.equal(document.querySelector('button'), button);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /3\/4 games.*0 similar games/);
  assert.equal(document.querySelector('#doIOwnThisGameNumbersSummary').style.color, 'red');
  assert.doesNotThrow(() => window.addNumberSummary(0, 0, 0, 'missing-header'));
});
