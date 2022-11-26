getOwnedGames().then(gameNames => colorizeOwnedGames(gameNames));

function colorizeOwnedGames(gameNames) {
	let numberOfGamesOwnedInBundle = 0;
	let bundleGames = document.getElementsByClassName("store-section-item__meta-name");
	for (let i = 0; i < bundleGames.length; i++) {
		if (gameNames.includes(bundleGames[i].innerText.toLowerCase()))
		{
			numberOfGamesOwnedInBundle++;
			bundleGames[i].parentElement.parentElement.style.webkitFilter  = "sepia(100%)";
		}
	}
	addNumberSummary(numberOfGamesOwnedInBundle, bundleGames.length, "section-header__title");
}

