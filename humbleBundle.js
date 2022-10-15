getApiKeyAndSteamId().then(games => colorizeOwnedGames(games));

function colorizeOwnedGames(gameNames) {
	let numberOfGamesOwnedInBundle = 0;
	let bundleGames = document.getElementsByClassName("item-title");
	for (let i = 0; i < bundleGames.length; i++) {
		if (gameNames.includes(bundleGames[i].innerText) )
		{
			numberOfGamesOwnedInBundle++;
			bundleGames[i].parentElement.style.webkitFilter  = "sepia(100%)";
		}
	}
	addNumberSummary(numberOfGamesOwnedInBundle, bundleGames.length, "tier-header heading-medium js-tier-header");
}

