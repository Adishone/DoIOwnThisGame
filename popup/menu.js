document.addEventListener('DOMContentLoaded', function() {
    var optionsButton = document.getElementById('optionsButton');
    // onClick's logic below:
    optionsButton.addEventListener('click', function() {
        openOptionsPage();
    });
    var reloadButton = document.getElementById('reloadButton');
    // onClick's logic below:
    reloadButton.addEventListener('click', function() {
        reload();
    });
    checkIfApiKeyAndSteamIdIsSet();
});

function openOptionsPage() {
    browser.runtime.openOptionsPage();
}

function checkIfApiKeyAndSteamIdIsSet() {
    browser.storage.sync.get(['steamApiKey', 'steamId']).then(showOptionsWarningText, onError);
}

function showOptionsWarningText(result) {
    if(!result.steamApiKey || !result.steamId) {
        document.querySelector('#options-warning-text').classList.remove('hidden');
    }
}

function reload() {
    browser.runtime.reload();
}

function onError(error) {
    console.log(`DoIOwnThisGame: Error: ${error}`);
}