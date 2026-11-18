function addNumberSummary(
  numberOfGamesOwnedInBundle,
  numberOfGamesInBundle,
  numberOfSimiliarGames,
  firstHeaderClass
) {
  const firstHeader =
    typeof firstHeaderClass === 'string'
      ? document.getElementsByClassName(firstHeaderClass)[0]
      : firstHeaderClass;
  if (!firstHeader) return;
  const percentageOfGamesOwned =
    numberOfGamesOwnedInBundle / numberOfGamesInBundle;
  let color = 'green';
  if (percentageOfGamesOwned > 0.5) {
    color = 'red';
  } else if (percentageOfGamesOwned < 0.5 && percentageOfGamesOwned > 0.2) {
    color = 'yellow';
  }
  let summary = firstHeader.querySelector('[data-do-i-own-this-game-summary]');
  if (!summary) {
    summary = document.createElement('span');
    summary.setAttribute('data-do-i-own-this-game-summary', '');
    const owned = document.createElement('span');
    owned.id = 'doIOwnThisGameNumbersSummary';
    owned.style.display = 'block';
    const similar = document.createElement('span');
    similar.style.cssText = 'display: block; color: aqua;';
    summary.append(owned, similar);
    firstHeader.appendChild(summary);
  }
  summary.children[0].style.color = color;
  summary.children[0].textContent =
    'You Own ' + numberOfGamesOwnedInBundle + '/' + numberOfGamesInBundle +
    ' games in this bundle';
  summary.children[1].textContent =
    'You own ' + numberOfSimiliarGames + ' similar games';
}
