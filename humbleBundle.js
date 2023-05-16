getOwnedGames().then((obj) => colorizeOwnedGames(obj.gameNames));

function colorizeOwnedGames(gameNames) {
  let numberOfGamesOwnedInBundle = 0;
  let numberOfSimiliarOwnedGames = 0;
  let bundleGames = document.getElementsByClassName('item-title');

  for (let i = 0; i < bundleGames.length; i++) {
    const bundleGameName = bundleGames[i].innerText
      .toLowerCase()
      .replace(/[®™]/g, '');
    if (gameNames.includes(bundleGameName)) {
      numberOfGamesOwnedInBundle++;
      bundleGames[i].parentElement.style.filter = 'sepia(100%)';
    } else {
      let closestDistance = 0;
      let closestGameName = '';
      gameNames.forEach((gameName) => {
        let distance = countWordsDistance(bundleGameName, gameName);
        if (distance > closestDistance) {
          closestDistance = distance;
          closestGameName = gameName;
        }
      });
      if (closestDistance > 0.85) {
        bundleGames[i].parentElement.children[0].style.filter =
          'grayscale(100%)';
        bundleGames[i].innerHTML +=
          '<br /><span style="color: aqua">You own game with similiar name: </span>' +
          closestGameName;
        numberOfSimiliarOwnedGames++;
      }
    }
  }

  addNumberSummary(
    numberOfGamesOwnedInBundle,
    bundleGames.length,
    numberOfSimiliarOwnedGames,
    'tier-header heading-medium js-tier-header'
  );
}
