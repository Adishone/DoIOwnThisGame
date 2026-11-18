const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const fixture = readFileSync(path.join(__dirname, 'fixtures/humble-choice.html'), 'utf8');
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const scripts = manifest.content_scripts.find((entry) => entry.js.includes('humbleChoice.js')).js;
const cardSelector = '[data-testid="product-card"]';
const titleSelector = '[class~="group/product-title"] .line-clamp-1';
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
  return Array.from(document.querySelectorAll(cardSelector)).find(
    (card) => card.querySelector(titleSelector).textContent.trim() === name
  );
}

test('Choice uses footer titles when thumbnails have empty alt text', async (t) => {
  const { document } = await load(t, fixture, [
    '  MAFIA: THE OLD COUNTRY™ ', 'dysmantle', 'the outer worlds 2 deluxe',
  ]);
  assert.equal(document.querySelectorAll(cardSelector).length, 10);
  for (const name of ['Mafia: The Old Country', 'DYSMANTLE']) {
    const card = findCard(document, name);
    assert.equal(card.querySelector('img').alt, '');
    assert.equal(card.querySelector('img').style.filter, 'sepia(100%)');
    assert.equal(card.querySelector(badgeSelector).textContent, 'You own this game');
  }
  const similar = findCard(document, 'The Outer Worlds 2');
  assert.equal(similar.querySelector('img').style.filter, 'grayscale(100%)');
  assert.match(similar.querySelector(badgeSelector).textContent, /the outer worlds 2 deluxe/);
  assert.equal(findCard(document, 'Space Haven').querySelector(badgeSelector), null);
  assert.match(document.querySelector(summarySelector).textContent, /2\/10 games.*1 similar games/);
  assert.equal(document.querySelector(summarySelector).parentElement.nextElementSibling.classList.contains('grid'), true);
});

test('Choice handles deferred loading, hydration and changing the monthly grid', async (t) => {
  const { document } = await load(t, '<main></main>', ['dysmantle']);
  assert.equal(document.querySelector(summarySelector), null);
  document.querySelector('main').outerHTML = fixture;
  await delay(180);
  const card = findCard(document, 'DYSMANTLE');
  card.querySelector(badgeSelector).remove();
  await delay(180);
  assert.equal(card.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/10 games/);

  const replacement = document.createElement('div');
  replacement.innerHTML = fixture;
  const grid = document.querySelector('main .grid');
  grid.replaceWith(replacement.querySelector('.grid'));
  await delay(180);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/10 games/);
});

test('Choice retains controls and does not duplicate markers on repeated updates', async (t) => {
  const { document } = await load(t, fixture, ['dysmantle']);
  const card = findCard(document, 'DYSMANTLE');
  const button = card.closest('button');
  const title = card.querySelector(titleSelector);
  const badge = card.querySelector(badgeSelector);
  let clicks = 0;
  button.addEventListener('click', () => clicks++);
  document.querySelector('main h1').firstChild.textContent = 'December 2026 Humble Choice';
  await delay(180);
  assert.equal(card.querySelector(badgeSelector), badge);
  assert.equal(card.querySelector(titleSelector), title);
  assert.equal(document.querySelectorAll(summarySelector).length, 1);
  button.click();
  assert.equal(clicks, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/10 games/);
});

test('Choice removes stale marks when a title changes and preserves original image styling', async (t) => {
  const html = fixture.replace('<img alt="">', '<img alt="" style="filter: brightness(80%)">');
  const { document } = await load(t, html, ['mafia: the old country']);
  const card = findCard(document, 'Mafia: The Old Country');
  card.querySelector(titleSelector).firstChild.textContent = 'Completely Different Title';
  await delay(180);
  assert.equal(card.querySelector(badgeSelector), null);
  assert.equal(card.querySelector('img').style.filter, 'brightness(80%)');
  assert.match(document.querySelector(summarySelector).textContent, /0\/10 games/);
});

test('Choice ignores product cards in promotions and detail dialogs', async (t) => {
  const { document } = await load(t, fixture, ['dysmantle']);
  const promotion = findCard(document, 'DYSMANTLE').cloneNode(true);
  promotion.querySelector(badgeSelector).remove();
  document.querySelector('main').appendChild(promotion);
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.appendChild(promotion.cloneNode(true));
  document.body.appendChild(dialog);
  await delay(180);
  assert.equal(promotion.querySelector(badgeSelector), null);
  assert.equal(dialog.querySelector(badgeSelector), null);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/10 games/);
});

test('Choice handles empty libraries, missing titles and navigation away', async (t) => {
  const { document } = await load(t);
  assert.equal(document.querySelectorAll(badgeSelector).length, 0);
  assert.match(document.querySelector(summarySelector).textContent, /0\/10 games/);
  const title = findCard(document, 'DYSMANTLE').querySelector(titleSelector);
  title.textContent = '';
  await delay(180);
  assert.match(document.querySelector(summarySelector).textContent, /0\/9 games/);
  document.querySelector('main .grid').remove();
  await delay(180);
  assert.equal(document.querySelector(summarySelector), null);
});

test('Choice still supports legacy cards and the old summary heading', async (t) => {
  const { document } = await load(t, `
    <h2 class="subhub-secondary-title">This month's games</h2>
    <div><img><div><span class="content-choice-title">DYSMANTLE™</span></div></div>
    <div><img><div><span class="content-choice-title">Space Haven</span></div></div>`, ['dysmantle']);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector(summarySelector).textContent, /1\/2 games/);
  document.body.appendChild(document.createElement('div'));
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.equal(document.querySelector('.content-choice-title').textContent, 'DYSMANTLE™');
});
