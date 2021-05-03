let EXPORTED_SYMBOLS = [];

let cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
cmanifest.append('utils');
cmanifest.append('chrome.manifest');
Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

ChromeUtils.import('chrome://userchromejs/content/BootstrapLoader.jsm');

ChromeUtils.import('chrome://userchromejs/content/userChrome.jsm');
