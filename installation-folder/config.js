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
  const { Services } = Cu.import('resource://gre/modules/Services.jsm');
  Cu.import(Services.io.newFileURI(Services.dirsvc.get('ProfD', Ci.nsIFile)).spec + 'chrome/utils/boot.jsm');
} catch (ex) {};