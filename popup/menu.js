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
    checkIfNumberOfGamesAndLastUpdateDateIsSet();
});

function openOptionsPage() {
    browser.runtime.openOptionsPage();
}

function checkIfNumberOfGamesAndLastUpdateDateIsSet() {
    browser.storage.sync.get(['numberOfGames', 'lastUpdateDate']).then(showOptionsWarningText, onError);
}

function showOptionsWarningText(result) {
    if(!result.numberOfGames || !result.lastUpdateDate) {
        document.querySelector('#options-warning-text').classList.remove('hidden');
    }
}

function reload() {
    browser.runtime.reload();
}

function onError(error) {
    console.log(`DoIOwnThisGame: Error: ${error}`);
}