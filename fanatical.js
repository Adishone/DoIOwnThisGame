getApiKeyAndSteamId().then(games => colorizeOwnedGames(games));

function colorizeOwnedGames(gameNames) {
	let numberOfGamesOwnedInBundle = 0;
	let mainGames = document.getElementsByClassName('mega-product-name');
	let bundleGames = document.getElementsByClassName('card-overlay');
	for (let i = 0; i < bundleGames.length; i++) {
		if (gameNames.includes(bundleGames[i].children[0].children[0].innerText) )
		{
			numberOfGamesOwnedInBundle++;
			bundleGames[i].parentElement.parentElement.parentElement.style.webkitFilter  = 'sepia(100%)';
		}
	}
	for (let j = 0; j < mainGames.length; j++) {
		if (gameNames.includes(mainGames[j].innerText))
		{
			
			numberOfGamesOwnedInBundle++;
			mainGames[j].parentElement.parentElement.parentElement.style.webkitFilter  = 'sepia(100%)';
		}
	}
	addNumberSummary(numberOfGamesOwnedInBundle, bundleGames.length + mainGames.length, 'product-name');
}