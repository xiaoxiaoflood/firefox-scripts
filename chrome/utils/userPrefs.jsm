let EXPORTED_SYMBOLS = [];

const {xPref} = ChromeUtils.import('chrome://userchromejs/content/xPref.jsm');

xPref.lock('extensions.legacy.enabled', true);
xPref.lock('xpinstall.signatures.required', false);
