let EXPORTED_SYMBOLS = ['UC'];

let {
  classes: Cc,
  interfaces: Ci,
  utils: Cu
} = Components;

function globals () {
  Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService).addObserver(this, 'domwindowopened', false);
};

// to store flags and vars across windows
let UC = {};

globals.prototype = {
  observe: function(aSubject, aTopic, aData) {
      aSubject.UC = UC;
      Cu.import('chrome://userchromejs/content/xPref.jsm', aSubject);
  },
};

if (!Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime).inSafeMode)
  new globals();
