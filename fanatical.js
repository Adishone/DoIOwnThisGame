watchBundleOwnership({
  getGames() {
    const page = document.querySelector('main.bundle-page');
    const grid = page?.querySelector(':scope > .container > section.fan-grid-container');
    const cards = grid ? Array.from(grid.querySelectorAll('.bundle-game-card')) : [];
    if (page) {
      return cards.map((card) => ({
        card,
        image: card.querySelector('.cover-container img') || card,
        name: card.querySelector('.card-product-name')?.textContent || '',
      }));
    }

    // Older bundles could also include a featured game outside the card grid.
    return Array.from(document.querySelectorAll('.card-overlay, .mega-product-name')).map((title) => {
      const card = title.closest('article') || title.parentElement.parentElement;
      return {
        card,
        image: card.querySelector('img') || card,
        name: (title.querySelector('.card-product-name') || title.firstElementChild?.firstElementChild || title).textContent,
      };
    });
  },
  getSummaryTarget() {
    return document.querySelector('main.bundle-page > .container > section.fan-grid-container');
  },
  legacyHeaderClass: 'product-name',
});
