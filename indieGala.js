watchBundleOwnership({
  getGames() {
    return Array.from(document.querySelectorAll(
      '.bundle-page-tier-games .bundle-page-tier-item-title'
    )).map((title) => {
      const card = title.closest('.bundle-page-tier-item-outer') ||
        title.closest('.bundle-page-tier-item-inner') || title.parentElement;
      return {
        card,
        image: card.querySelector('figure img') || card.querySelector('img') || card,
        name: title.textContent,
      };
    });
  },
  getSummaryTarget() {
    return document.querySelector('.bundle-page-tier-games');
  },
  legacyHeaderClass: 'bundle-page-tier-text',
});
