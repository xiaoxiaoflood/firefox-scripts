let EXPORTED_SYMBOLS = [];

let {
  classes: Cc,
  interfaces: Ci,
  manager: Cm,
  utils: Cu
} = Components;

var cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
cmanifest.append('utils');
cmanifest.append('chrome.manifest');
Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

Cu.import('chrome://userchromejs/content/defaultExtPrefs.jsm');
Cu.import('chrome://userchromejs/content/globals.jsm');
Cu.import('chrome://userchromejs/content/userChrome.jsm');
