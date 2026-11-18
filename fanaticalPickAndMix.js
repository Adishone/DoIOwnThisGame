watchBundleOwnership({
  getGames() {
    const page = document.querySelector('main.PickAndMixProductPage');
    const cards = page ? Array.from(page.querySelectorAll('.PickAndMixHits .PickAndMixCard')) : [];
    if (page) {
      return cards.map((card) => ({
        card,
        image: card.querySelector('.cover-container img') || card,
        name: card.querySelector('.card-product-name')?.textContent || '',
      }));
    }

    return Array.from(document.querySelectorAll('.card-overlay')).map((title) => {
      const card = title.closest('article') || title.parentElement.parentElement;
      return {
        card,
        image: card.querySelector('img') || card,
        name: (title.querySelector('.card-product-name') || title.firstElementChild?.firstElementChild || title).textContent,
      };
    });
  },
  getSummaryTarget() {
    return document.querySelector('main.PickAndMixProductPage .PickAndMixHits');
  },
  legacyHeaderClass: 'pnm-upsell-message',
});
