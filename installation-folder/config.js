// skip 1st line
lockPref('xpinstall.signatures.required', false);
lockPref('extensions.install_origins.enabled', false);

try {
  const cmanifest = Services.dirsvc.get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

  Services.scriptloader.loadSubScript('chrome://userchromejs/content/BootstrapLoader.js');
} catch (ex) {};

try {
  ChromeUtils.import('chrome://userchromejs/content/userChrome.jsm');
} catch (ex) {};