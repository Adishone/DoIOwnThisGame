function addNumberSummary(
  numberOfGamesOwnedInBundle,
  numberOfGamesInBundle,
  numberOfSimiliarGames,
  firstHeaderClass
) {
  const firstHeader = document.getElementsByClassName(firstHeaderClass)[0];
  const percentageOfGamesOwned =
    numberOfGamesOwnedInBundle / numberOfGamesInBundle;
  let colorStyle = "style='color: green'";
  const aquaColorStyle = "style='color: aqua'";
  if (percentageOfGamesOwned > 0.5) {
    colorStyle = "style='color: red'";
  } else if (percentageOfGamesOwned < 0.5 && percentageOfGamesOwned > 0.2) {
    colorStyle = "style='color: yellow'";
  }
  const numberSummaryHederString =
    "<br /><span id='doIOwnThisGameNumbersSummary' " +
    colorStyle +
    '> You Own ' +
    numberOfGamesOwnedInBundle +
    '/' +
    numberOfGamesInBundle +
    ' games in this bundle</span> <br /><span ' +
    aquaColorStyle +
    '>You own ' +
    numberOfSimiliarGames +
    ' similiar games</span>';
  if (!firstHeader.innerHTML.includes('You Own')) {
    firstHeader.innerHTML += numberSummaryHederString;
  } else {
    const index = firstHeader.innerHTML.indexOf('doIOwnThisGameNumbersSummary');
    const substring = firstHeader.innerHTML.substring(0, index - 14);
    firstHeader.innerHTML = substring + numberSummaryHederString;
  }
}
