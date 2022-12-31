const databaseName = "DoIOwnThisGame";
const gamesObjectStoreName = "games";
const sqlQuery = `SELECT lower(substring(GP.value, 11, length(GP.value) - 12)) as title \n
                  FROM ProductPurchaseDates PPD \n
                  INNER JOIN GamePieces GP ON PPD.gameReleaseKey = GP.releaseKey \n
                  INNER JOIN GamePieceTypes GPT ON GP.gamePieceTypeId = GPT.id \n
                  WHERE GPT.type = 'title' \n
                  ORDER BY title`;

function restoreData() {
  function setCurrentNumberOfGamesAndLastUpdateDate(result) {
    if (result.numberOfGames) {
      document.getElementById('numberOfOwnedGames').innerText = `Number of owned games: ${result.numberOfGames}`
    }
    if (result.lastUpdateDate) {
      let date = new Date(result.lastUpdateDate).toLocaleString();
      document.getElementById('lastUpdateDate').innerText = `Last update date of database: ${date}`;
    }
  }

  browser.storage.local.get(['numberOfGames', 'lastUpdateDate']).then(setCurrentNumberOfGamesAndLastUpdateDate, onError);
}

function onError(error) {
  console.log(`DoIOwnThisGame: Error: ${error}`);
}

function clearBrowserStorage() {
  browser.storage.local.clear().then(restoreData, onError);
}

function saveGamesToLocalStorage(resultsArray) {
  outputElement.innerText += 'Saving data. ';
  browser.storage.local.set({ numberOfGames: resultsArray.length });
  browser.storage.local.set({ lastUpdateDate: new Date() });
  browser.storage.local.set({ gameNames: resultsArray });
  restoreData();
}

var dbFileElement = document.getElementById('dbFile');
var outputElement = document.getElementById('output');
var clearButton = document.getElementById('clearBrowserStorageButton');

clearButton.onclick = function () {
  clearBrowserStorage();
  restoreData();
}

dbFileElement.onchange = function () {
	const f = dbFileElement.files[0];
	const r = new FileReader();
	r.onload = function() {
    outputElement.innerText += 'Loading your GoG Galaxy database. ';
    initSqlJs().then(function(SQL) {
      const Uints = new Uint8Array(r.result);
      db = new SQL.Database(Uints);
      const result = db.exec(sqlQuery);
      const mergedResult = result[0].values.flat(1);
      saveGamesToLocalStorage(mergedResult);
    })
  };
  r.readAsArrayBuffer(f);
}

restoreData();