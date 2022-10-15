function addNumberSummary(numberOfGamesOwnedInBundle, numberOfGamesInBundle, firstHeaderClass) {
	const firstHeader = document.getElementsByClassName(firstHeaderClass)[0];
	const percentageOfGamesOwned = numberOfGamesOwnedInBundle/numberOfGamesInBundle;
	let colorStyle = "style='color: green'";
	if (percentageOfGamesOwned > 0.5) {
		colorStyle = "style='color: red'";
	} else if (percentageOfGamesOwned < 0.5 && percentageOfGamesOwned > 0.2) {
		colorStyle = "style='color: yellow'";
	}
		
	firstHeader.innerHTML += "<br /><span " + colorStyle +"> You Own " + numberOfGamesOwnedInBundle + "/" + numberOfGamesInBundle + " games in this bundle </span>";
}