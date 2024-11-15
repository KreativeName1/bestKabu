//* SERVICE WORKER
if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('onMessage');

  // Get the config from the file properties.json
  if (request.action === 'getConfig') {
    console.log('getConfig');
    console.log(chrome.runtime.getURL('properties.json'));
      fetch(chrome.runtime.getURL('properties.json'))
          .then(response => response.json())
          .then(config => {
              sendResponse(config);
          })
          .catch(error => {
              console.error('Error loading config:', error);
              sendResponse({ error: 'Failed to load config' });
          });
      return true;
  }

  // Update the config in local storage
  if (request.action === 'updateProperties') {
    console.log('updateProperties');
    console.log(request.config);
    chrome.storage.local.set({ config: request.config });
    sendResponse({ success: true });
    return true;
  }

  // Get the config from local storage.
  // If it doesn't exist, load the default config from properties.json into local storage
  if (request.action === 'getProperties') {
    console.log('getProperties');
    chrome.storage.local.get('config', (config) => {
      if (config.config) {
        sendResponse(config.config);
      } else {
        console.log('Config not found in local storage. Loading default config');
        fetch(chrome.runtime.getURL('properties.json'))
          .then(response => response.json())
          .then(config => {
            chrome.storage.local.set({ config });
            sendResponse(config);
          })
          .catch(error => {
            console.error('Error loading config:', error);
            sendResponse({ error: 'Failed to load config' });
          });
      }
    });
    return true;
  }

  // Reset the config in local storage to the default config from properties.json
  if (request.action === 'resetProperties') {
    console.log('resetProperties');
    fetch(chrome.runtime.getURL('properties.json'))
      .then(response => response.json())
      .then(config => {
        chrome.storage.local.set({ config });
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error loading config:', error);
        sendResponse({ error: 'Failed to load config' });
      });
    return true;
  }
});

// Open the options page when the user clicks the settings button in the interface
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOptionsPage') {
      chrome.runtime.openOptionsPage();
  }
});