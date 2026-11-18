const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const badgeSelector = '[data-do-i-own-this-game-badge]';
const summarySelector = '[data-do-i-own-this-game-summary]';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const layouts = [
  {
    name: 'regular bundle', file: 'fanatical.js', fixture: 'fanatical-bundle.html',
    page: 'main.bundle-page', grid: 'section.fan-grid-container', card: '.bundle-game-card',
    count: 3, owned: "Monsters' Den: Godfall", similar: "Monsters' Den Chronicles",
    // The existing similarity matcher also flags the other titles in this series.
    markedWithExactOnly: 3, markedWithSimilar: 3, similarWithBoth: 2,
  },
  {
    name: 'pick-and-mix', file: 'fanaticalPickAndMix.js', fixture: 'fanatical-pick-and-mix.html',
    page: 'main.PickAndMixProductPage', grid: '.PickAndMixHits', card: '.PickAndMixCard',
    count: 14, owned: 'Crime Scene Cleaner', similar: 'Forever Skies Deluxe Edition',
    markedWithExactOnly: 1, markedWithSimilar: 2, similarWithBoth: 1,
  },
];

async function load(t, layout, html, gameNames = []) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.browser = { storage: { local: { get: async () => ({ gameNames }) } } };
  const scripts = manifest.content_scripts.find((entry) => entry.js.includes(layout.file)).js;
  for (const file of scripts) dom.window.eval(readFileSync(path.join(root, file), 'utf8'));
  await delay(0);
  return dom.window;
}

function findCard(document, layout, name) {
  return Array.from(document.querySelectorAll(layout.card)).find(
    (card) => card.querySelector('.card-product-name').textContent === name
  );
}

for (const layout of layouts) {
  const fixture = readFileSync(path.join(__dirname, 'fixtures', layout.fixture), 'utf8');

  test(`Fanatical ${layout.name}: exact and similar ownership markers and counts`, async (t) => {
    const { document } = await load(t, layout, fixture, [
      `  ${layout.owned.toUpperCase()}™ `, `${layout.similar} Deluxe`,
    ]);
    const owned = findCard(document, layout, layout.owned);
    const similar = findCard(document, layout, layout.similar);
    assert.equal(owned.querySelector('.cover-container img').style.filter, 'sepia(100%)');
    assert.equal(owned.querySelector(badgeSelector).textContent, 'You own this game');
    assert.equal(similar.querySelector('.cover-container img').style.filter, 'grayscale(100%)');
    assert.ok(similar.querySelector(badgeSelector).textContent.includes(`${layout.similar} Deluxe`));
    assert.equal(document.querySelectorAll(badgeSelector).length, layout.markedWithSimilar);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`1/${layout.count} games`));
    assert.ok(document.querySelector(summarySelector).textContent.includes(`${layout.similarWithBoth} similar games`));
    assert.equal(owned.querySelector('img[alt="steam logo"]').style.filter, '');
  });

  test(`Fanatical ${layout.name}: waits for loading shell to be replaced`, async (t) => {
    const { document } = await load(t, layout, '<div class="SkeletonHold__page"></div>', [layout.owned]);
    assert.equal(document.querySelector(summarySelector), null);
    document.body.innerHTML = fixture;
    await delay(180);
    assert.equal(document.querySelectorAll(badgeSelector).length, layout.markedWithExactOnly);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`1/${layout.count} games`));
  });

  test(`Fanatical ${layout.name}: keeps buttons and links working through rerenders`, async (t) => {
    const { document } = await load(t, layout, fixture, [layout.owned]);
    const card = findCard(document, layout, layout.owned);
    const control = card.querySelector('button') || card.querySelector('a');
    const badge = card.querySelector(badgeSelector);
    let clicks = 0;
    control.addEventListener('click', () => clicks++);
    document.querySelector(layout.page).appendChild(document.createElement('div'));
    await delay(180);
    assert.equal(card.querySelector(badgeSelector), badge);
    assert.equal(card.querySelectorAll(badgeSelector).length, 1);
    assert.equal(document.querySelectorAll(summarySelector).length, 1);
    control.click();
    assert.equal(clicks, 1);

    badge.remove();
    await delay(180);
    assert.equal(card.querySelectorAll(badgeSelector).length, 1);
  });

  test(`Fanatical ${layout.name}: updates when filtering, replacing or reusing cards`, async (t) => {
    const { document } = await load(t, layout, fixture, [layout.owned]);
    let card = findCard(document, layout, layout.owned);
    card.querySelector('.card-product-name').firstChild.textContent = 'Unrelated New Game';
    await delay(180);
    assert.equal(card.querySelector(badgeSelector), null);
    assert.equal(card.querySelector('.cover-container img').style.filter, '');
    card.remove();
    await delay(180);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`0/${layout.count - 1} games`));
    const template = document.createElement('template');
    template.innerHTML = fixture;
    const grid = document.querySelector(layout.grid);
    grid.replaceWith(template.content.querySelector(layout.grid));
    await delay(180);
    card = findCard(document, layout, layout.owned);
    assert.equal(card.querySelectorAll(badgeSelector).length, 1);
    assert.equal(document.querySelectorAll(summarySelector).length, 1);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`1/${layout.count} games`));
  });

  test(`Fanatical ${layout.name}: excludes recommendations and detail copies`, async (t) => {
    const { document } = await load(t, layout, fixture, [layout.owned]);
    const extra = findCard(document, layout, layout.owned).cloneNode(true);
    extra.querySelector(badgeSelector).remove();
    const recommendations = document.createElement('section');
    recommendations.className = 'Recommendations';
    recommendations.appendChild(extra);
    document.querySelector(layout.page).appendChild(recommendations);
    await delay(180);
    assert.equal(extra.querySelector(badgeSelector), null);
    assert.equal(document.querySelectorAll(badgeSelector).length, layout.markedWithExactOnly);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`1/${layout.count} games`));
    document.querySelector(layout.grid).remove();
    await delay(180);
    assert.equal(extra.querySelector(badgeSelector), null);
    assert.equal(document.querySelector(summarySelector), null);
  });

  test(`Fanatical ${layout.name}: works without an imported library`, async (t) => {
    const { document } = await load(t, layout, fixture);
    assert.equal(document.querySelectorAll(badgeSelector).length, 0);
    assert.ok(document.querySelector(summarySelector).textContent.includes(`0/${layout.count} games`));
  });
}

test('legacy Fanatical bundles count featured games and keep names free of detail-link text', async (t) => {
  const { document } = await load(t, layouts[0], `
    <h1 class="product-name">Legacy bundle</h1>
    <article><img><div class="overlay-container"><div class="card-overlay">
      <div><h3>Alpha Quest</h3><a>Product details</a></div>
    </div></div></article>
    <div><img><div><h2 class="mega-product-name">Zebra Racing</h2></div></div>`,
  ['alpha quest', 'zebra racing']);
  assert.equal(document.querySelectorAll(badgeSelector).length, 2);
  assert.match(document.querySelector(summarySelector).textContent, /2\/2 games/);
  document.body.appendChild(document.createElement('div'));
  await delay(180);
  assert.equal(document.querySelectorAll(badgeSelector).length, 2);
  assert.match(document.querySelector(summarySelector).textContent, /2\/2 games/);
});

test('legacy Fanatical pick-and-mix still uses the original summary location', async (t) => {
  const { document } = await load(t, layouts[1], `
    <div class="pnm-upsell-message">Select games</div>
    <article><img><div class="overlay-container"><div class="card-overlay">
      <div><h3>Alpha Quest</h3><a>Product details</a></div>
    </div></div><button>Add</button></article>`, ['alpha quest']);
  assert.equal(document.querySelectorAll(badgeSelector).length, 1);
  assert.match(document.querySelector('.pnm-upsell-message').textContent, /1\/1 games/);
});
