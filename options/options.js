const databaseName = 'DoIOwnThisGame';
const gamesObjectStoreName = 'games';
const sqlQuery = `SELECT lower(substring(GP.value, 11, length(GP.value) - 12)) as title \n
                  FROM ProductPurchaseDates PPD \n
                  INNER JOIN GamePieces GP ON PPD.gameReleaseKey = GP.releaseKey \n
                  INNER JOIN GamePieceTypes GPT ON GP.gamePieceTypeId = GPT.id \n
                  WHERE GPT.type = 'title' \n
                  ORDER BY title`;

function restoreData(resultsArray) {
  function setCurrentNumberOfGamesAndLastUpdateDate(result) {
    if (result.numberOfGames) {
      document.getElementById(
        'numberOfOwnedGames'
      ).innerText = `Number of owned games: ${result.numberOfGames}`;
    }

    if (result.lastUpdateDate) {
      let date = new Date(result.lastUpdateDate).toLocaleString();
      document.getElementById(
        'lastUpdateDate'
      ).innerText = `Last update date of database: ${date}`;
    }

    if (result.gameNames) {
      clearTable();
      addGamesToTable(result.gameNames);
    }
  }

  browser.storage.local
    .get(['numberOfGames', 'lastUpdateDate', 'gameNames'])
    .then(setCurrentNumberOfGamesAndLastUpdateDate, onError);
}

function onError(error) {
  console.log(`DoIOwnThisGame: Error: ${error}`);
}

function clearBrowserStorage() {
  browser.storage.local.clear().then(restoreData, onError);
}

function saveGamesToLocalStorage(resultsArray) {
  outputElement.innerHTML += '<br />Saving data.';
  browser.storage.local.set({ numberOfGames: resultsArray.length });
  browser.storage.local.set({ lastUpdateDate: new Date() });
  browser.storage.local.set({ gameNames: resultsArray });
  restoreData(resultsArray);
}

function clearTable() {
  gamesTableBody.innerHTML = '';
}

function addGamesToTable(gameNames) {
  gameNames.sort();
  gameNames.forEach((game) => {
    var newRow = gamesTable.insertRow();
    var newCell = newRow.insertCell(0);
    newCell.innerText = game;
  });
}

function clearQuotationMarks(gameNames) {
  outputElement.innerHTML += '<br />Clearing quotation marks...';
  var index = 0;
  var games = gameNames;
  while (games[index].startsWith('"')) {
    games[index] = games[index].substring(1, games[index].length - 1);
    index++;
  }
  outputElement.innerHTML += '<br />Finished clearing quotation marks...';
  return games.sort();
}

var csvFileElement = document.getElementById('csvFile');
var dbFileElement = document.getElementById('dbFile');
var outputElement = document.getElementById('output');
var clearButton = document.getElementById('clearBrowserStorageButton');
var gamesTable = document.getElementById('gamesTable');
var gamesTableBody = document.getElementById('gamesTableBody');

clearButton.onclick = function () {
  clearBrowserStorage();
  restoreData();
};

csvFileElement.onchange = function () {
  const file = csvFileElement.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    outputElement.innerHTML += '<br />Loading your games from CSV file...';
    var resultsSplitted = reader.result.split('\r\n');
    var resultsSliced = resultsSplitted.slice(1, resultsSplitted.length - 1);
    resultsSliced.sort();
    var resultsCleared = clearQuotationMarks(resultsSliced);
    uniqueResults = [...new Set(resultsCleared)];
    saveGamesToLocalStorage(uniqueResults);
  };
  reader.readAsText(file);
};

dbFileElement.onchange = function () {
  const file = dbFileElement.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    outputElement.innerHtml += '<br />Loading your GoG Galaxy database...';
    initSqlJs().then(function (SQL) {
      const Uints = new Uint8Array(reader.result);
      db = new SQL.Database(Uints);
      const result = db.exec(sqlQuery);
      const mergedResult = result[0].values.flat(1);
      saveGamesToLocalStorage(mergedResult);
    });
  };
  reader.readAsArrayBuffer(file);
};

restoreData();
