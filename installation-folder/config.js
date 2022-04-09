// skip 1st line
lockPref('xpinstall.signatures.required', false);

Object = Cu.getGlobalForObject(Cu).Object;
const { freeze } = Object;
Object.freeze = obj => {
  if (Components.stack.caller.filename != 'resource://gre/modules/AppConstants.jsm')
    return freeze(obj);

  obj.MOZ_REQUIRE_SIGNING = false;
  Object.freeze = freeze;
  return freeze(obj);
}

try {
  let cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

  Cu.import('chrome://userchromejs/content/BootstrapLoader.jsm');
} catch (ex) {};

try {
  Cu.import('chrome://userchromejs/content/userChrome.jsm');
} catch (ex) {};