getOwnedGames().then((obj) => colorizeOwnedGames(obj.gameNames));

function colorizeOwnedGames(gameNames) {
  let numberOfGamesOwnedInBundle = 0;
  let numberOfSimiliarOwnedGames = 0;
  let bundleGames = document.getElementsByClassName(
    'bundle-page-tier-item-title'
  );
  for (let i = 0; i < bundleGames.length; i++) {
    let bundleGameName = bundleGames[i].children[0].innerText.toLowerCase();
    if (gameNames.includes(bundleGameName)) {
      numberOfGamesOwnedInBundle++;
      bundleGames[
        i
      ].parentElement.parentElement.parentElement.parentElement.style.filter =
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
        bundleGames[i].parentElement.parentElement.children[2].style.filter =
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
    'bundle-page-tier-text'
  );
}
