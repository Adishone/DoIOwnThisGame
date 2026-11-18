watchBundleOwnership({
  getGames() {
    const cards = Array.from(document.querySelectorAll(
      '[data-testid="bundle-item-card"][data-bundle-type="games"]'
    ));
    return cards.length
      ? cards.map((card) => {
          // Bundle thumbnail alt text contains the product title.
          const image = card.querySelector('[data-testid="product-thumbnail"] img');
          return { card, image: image || card, name: image ? image.alt : '' };
        })
      : Array.from(document.querySelectorAll('.item-title')).map((title) => ({
          card: title.parentElement,
          image: title.parentElement.querySelector('img') || title.parentElement,
          name: title.textContent,
        }));
  },
  getSummaryTarget() {
    return document.querySelector('[data-bundle-section="games"]');
  },
  legacyHeaderClass: 'tier-header heading-medium js-tier-header',
});
