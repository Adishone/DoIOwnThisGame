getOwnedGames().then(obj => colorizeOwnedGames(obj.gameNames));

function colorizeOwnedGames(gameNames) {
	let numberOfGamesOwnedInBundle = 0;
	let bundleGames = document.getElementsByClassName('bundle-page-tier-item-title');
	for (let i=0; i < bundleGames.length; i++) {
		if (gameNames.includes(bundleGames[i].children[0].innerText.toLowerCase()))
		{
			numberOfGamesOwnedInBundle++;
			bundleGames[i].parentElement.parentElement.parentElement.parentElement.style.webkitFilter  = 'sepia(100%)';
		}
	}
	addNumberSummary(numberOfGamesOwnedInBundle, bundleGames.length, 'bundle-page-tier-text');
}