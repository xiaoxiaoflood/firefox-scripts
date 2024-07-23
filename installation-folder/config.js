// skip 1st line
lockPref('xpinstall.signatures.required', false);
lockPref('extensions.install_origins.enabled', false);

try {
  const cmanifest = Services.dirsvc.get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

  const objRef = ChromeUtils.importESModule('resource://gre/modules/addons/XPIDatabase.sys.mjs');
  objRef.XPIDatabase.SIGNED_TYPES.delete('extension');

  ChromeUtils.import('chrome://userchromejs/content/BootstrapLoader.jsm');
} catch (ex) {};

try {
  ChromeUtils.import('chrome://userchromejs/content/userChrome.jsm');
} catch (ex) {};
