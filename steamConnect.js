function getApiKeyAndSteamId() {
    return browser.storage.sync.get(['steamApiKey', 'steamId']).then(getGames, onError);
}

function getGames(apiKeyAndSteamId) {
    const url = prepareUrl(apiKeyAndSteamId);
    return fetch(url)
    .then(function(response) {
        if (!response.ok) {
            throw Error(response.statusText);
        } else {
            return response.json();
        }
    })
    .then(function(data) { 
        return data.response.games.map(function (game) {
            return game.name;
        });
    });
}

function prepareUrl(result) {
    return 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=' + result.steamApiKey + '&steamid=' + result.steamId +'&include_appinfo=true&include_played_free_games=false&appids_filter&include_free_sub=false';
}

function onError(error) {
    console.log(`DoIOwnThisGame: Error: ${error}`);
}
