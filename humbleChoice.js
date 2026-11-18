(function () {
  function getChoiceGrid() {
    // The monthly grid follows the heading and purchase controls. Scope the
    // lookup to that grid so promotions and detail dialogs are not counted.
    const heading = document.querySelector('main h1');
    const container = heading && heading.parentElement.parentElement;
    return container ? container.querySelector(':scope > .grid') : null;
  }

  watchBundleOwnership({
    getGames() {
      const grid = getChoiceGrid();
      if (grid) {
        return Array.from(grid.querySelectorAll('[data-testid="product-card"]')).map((card) => {
          // Choice thumbnails have empty alt text; read the visible footer title.
          const title = card.querySelector(
            '[data-testid="product-card-footer"] [class~="group/product-title"] .line-clamp-1'
          );
          const image = card.querySelector('[data-testid="product-thumbnail"] img');
          return { card, image: image || card, name: title ? title.textContent : '' };
        });
      }
      return Array.from(document.querySelectorAll('.content-choice-title')).map((title) => {
        const card = title.parentElement.parentElement;
        return { card, image: card.querySelector('img') || card, name: title.textContent };
      });
    },
    getSummaryTarget: getChoiceGrid,
    legacyHeaderClass: 'subhub-secondary-title',
  });
})();
