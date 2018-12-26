let EXPORTED_SYMBOLS = [];

let {
  classes: Cc,
  interfaces: Ci,
  manager: Cm,
  utils: Cu
} = Components;

if (!('import' in ChromeUtils))
  ChromeUtils.import = Cu.import;

var cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
cmanifest.append('utils');
cmanifest.append('chrome.manifest');
Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

ChromeUtils.import('resource://gre/modules/AddonManager.jsm');
if (AddonManager.addExternalExtensionLoader) {
  ChromeUtils.import('chrome://userchromejs/content/BootstrapLoader.jsm');
  AddonManager.addExternalExtensionLoader(BootstrapLoader);
}

ChromeUtils.import('chrome://userchromejs/content/userPrefs.jsm');
ChromeUtils.import('chrome://userchromejs/content/userChrome.jsm');
