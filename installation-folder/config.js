// skip 1st line
lockPref('xpinstall.signatures.required', false);
lockPref('extensions.install_origins.enabled', false);

try {
  const cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

  const objRef = ChromeUtils.import('resource://gre/modules/addons/AddonSettings.jsm');
  const temp = Object.assign({}, Object.getOwnPropertyDescriptors(objRef.AddonSettings), {
    REQUIRE_SIGNING: { value: false }
  });
  objRef.AddonSettings = Object.defineProperties({}, temp);

  Cu.import('chrome://userchromejs/content/BootstrapLoader.jsm');
} catch (ex) {};

try {
  Cu.import('chrome://userchromejs/content/userChrome.jsm');
} catch (ex) {};
