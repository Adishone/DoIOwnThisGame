function saveOptions(e) {
  e.preventDefault();
  const steamApiKeyValue = document.getElementById('steam-api-key').value;
  const steamIdValue = document.getElementById('steam-id').value;
  
  if (steamApiKeyValue) {
    browser.storage.sync.set({ steamApiKey: steamApiKeyValue });
  }

  if (steamIdValue) {
    browser.storage.sync.set({ steamId: steamIdValue });
  }

  const savedMessage = document.getElementById('saved-message');
  savedMessage.classList.remove('hidden');
  fadeOutEffect(savedMessage);
}

function restoreOptions() {

  function setCurrentSteamApiKeyAndId(result) {
    if (result.steamApiKey) {
      document.getElementById('steam-api-key-already-set-message').classList.remove('hidden');
    }
    if (result.steamId) {
      document.getElementById('steam-id').value = result.steamId;
    }
  }

  function onError(error) {
    console.log(`DoIOwnThisGame: Error: ${error}`);
  }

  browser.storage.sync.get(['steamApiKey', 'steamId']).then(setCurrentSteamApiKeyAndId, onError);
}

function fadeOutEffect(target) {
  var fadeEffect = setInterval(function () {
      if (!target.style.opacity) {
        target.style.opacity = 1;
      }
      if (target.style.opacity > 0) {
        target.style.opacity -= 0.1;
      } else {
          clearInterval(fadeEffect);
      }
  }, 200);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
