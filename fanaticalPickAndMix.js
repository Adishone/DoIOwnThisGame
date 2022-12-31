getOwnedGames().then(obj => colorizeOwnedGames(obj.gameNames));

function colorizeOwnedGames(gameNames) {
	let numberOfGamesOwnedInBundle = 0;
	let bundleGames = document.getElementsByClassName('card-overlay');
	console.log(gameNames);
	for (let i = 0; i < bundleGames.length; i++) {
		if (gameNames.includes(bundleGames[i].children[0].children[0].innerText.toLowerCase()) )
		{
			numberOfGamesOwnedInBundle++;
			bundleGames[i].parentElement.parentElement.parentElement.style.webkitFilter  = 'sepia(100%)';
		}
	}
	addNumberSummary(numberOfGamesOwnedInBundle, bundleGames.length, 'pnm-upsell-message');
}