let EXPORTED_SYMBOLS = [];

if (!('import' in ChromeUtils))
  ChromeUtils.import = Cu.import;

ChromeUtils.import('chrome://userchromejs/content/xPref.jsm');

xPref.lock('extensions.legacy.enabled', true);
xPref.lock('xpinstall.signatures.required', false);
