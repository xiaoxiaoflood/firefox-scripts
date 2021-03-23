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
  Cu.import('resource://gre/modules/osfile.jsm');
  Cu.import(OS.Path.toFileURI(OS.Constants.Path.profileDir) + '/chrome/utils/boot.jsm');
} catch(ex) {};