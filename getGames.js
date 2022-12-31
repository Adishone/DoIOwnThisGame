function getOwnedGames() {
    return browser.storage.local.get(['gameNames']);
}

function onError(error) {
    console.log(`DoIOwnThisGame: Error: ${error}`);
}