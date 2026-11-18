async function watchBundleOwnership({ getGames, getSummaryTarget, legacyHeaderClass }) {
  const { gameNames = [] } = await getOwnedGames();
  const normalizeName = (name) =>
    name.toLowerCase().replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
  const ownedNames = gameNames.map(normalizeName);
  const ownedGames = new Set(ownedNames);
  const matches = new Map();
  const cardStates = new WeakMap();
  const badgeSelector = '[data-do-i-own-this-game-badge]';
  let summaryHost;
  let updateTimer;

  function getMatch(name) {
    if (!matches.has(name)) {
      let match = { type: 'unowned' };
      if (ownedGames.has(name)) {
        match = { type: 'owned' };
      } else {
        let closestDistance = 0;
        ownedNames.forEach((gameName, index) => {
          const distance = Number(countWordsDistance(name, gameName));
          if (distance > closestDistance) {
            closestDistance = distance;
            if (distance > 0.85) {
              match = { type: 'similar', name: gameNames[index] };
            }
          }
        });
      }
      matches.set(name, match);
    }
    return matches.get(name);
  }

  function markCard(card, image, match) {
    const previous = cardStates.get(card);
    if (
      previous && previous.match === match && previous.image === image &&
      previous.badge.parentElement === card
    ) return;
    if (previous) previous.image.style.filter = previous.filter;
    card.querySelectorAll(badgeSelector).forEach((badge) => badge.remove());
    cardStates.delete(card);
    if (match.type === 'unowned') return;

    const filter = image.style.filter;
    image.style.filter =
      match.type === 'owned' ? 'sepia(100%)' : 'grayscale(100%)';
    const badge = document.createElement('div');
    badge.setAttribute('data-do-i-own-this-game-badge', '');
    badge.style.cssText = 'padding: 0.5rem; font-size: 0.875rem;';
    badge.style.color = match.type === 'owned' ? 'gold' : 'aqua';
    badge.textContent =
      match.type === 'owned'
        ? 'You own this game'
        : 'You own a game with a similar name: ' + match.name;
    card.appendChild(badge);
    cardStates.set(card, { image, filter, match, badge });
  }

  function updateBundle() {
    // Ignore our own DOM changes, and leave React's existing nodes intact.
    observer.disconnect();
    try {
      let ownedCount = 0;
      let similarCount = 0;
      const games = getGames();
      const namedGames = games.filter((game) => game.name.trim());
      games.forEach(({ card, image, name }) => {
        const match = name.trim() ? getMatch(normalizeName(name)) : { type: 'unowned' };
        if (match.type === 'owned') ownedCount++;
        if (match.type === 'similar') similarCount++;
        markCard(card, image, match);
      });

      const target = getSummaryTarget();
      if (target) {
        if (!summaryHost) {
          summaryHost = document.createElement('div');
          summaryHost.style.marginBottom = '1rem';
        }
        if (summaryHost.nextElementSibling !== target) target.before(summaryHost);
        addNumberSummary(ownedCount, namedGames.length, similarCount, summaryHost);
      } else {
        if (summaryHost) summaryHost.remove();
        if (namedGames.length) {
          addNumberSummary(ownedCount, namedGames.length, similarCount, legacyHeaderClass);
        }
      }
    } finally {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['alt'],
      });
    }
  }

  // Hydration and client-side navigation can replace the cards.
  const observer = new MutationObserver(() => {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updateBundle, 100);
  });
  updateBundle();
}
