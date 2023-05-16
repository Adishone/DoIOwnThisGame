getOwnedGames().then((obj) => colorizeOwnedGames(obj.gameNames));

function colorizeOwnedGames(gameNames) {
  let numberOfGamesOwnedInBundle = 0;
  let numberOfSimiliarOwnedGames = 0;
  let bundleGames = document.getElementsByClassName('card-overlay');
  for (let i = 0; i < bundleGames.length; i++) {
    let bundleGameName = bundleGames[i].children[0].children[0].innerText
      .toLowerCase()
      .replace(/[®™]/g, '');
    if (gameNames.includes(bundleGameName)) {
      numberOfGamesOwnedInBundle++;
      bundleGames[i].parentElement.parentElement.parentElement.style.filter =
        'sepia(100%)';
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
        bundleGames[i].parentElement.parentElement.children[0].style.filter =
          'grayscale(100%)';
        bundleGames[i].parentElement.parentElement.innerHTML +=
          '<span style="color: aqua">You own game with similiar name: </span>' +
          closestGameName;
        numberOfSimiliarOwnedGames++;
      }
    }
  }
  addNumberSummary(
    numberOfGamesOwnedInBundle,
    bundleGames.length,
    numberOfSimiliarOwnedGames,
    'pnm-upsell-message'
  );
}
