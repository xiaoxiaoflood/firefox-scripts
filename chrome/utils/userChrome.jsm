let EXPORTED_SYMBOLS = [];

let {
  classes: Cc,
  interfaces: Ci,
  utils: Cu
} = Components;

if (!'ChromeUtils' in this || !'import' in ChromeUtils)
  this.ChromeUtils = Cu;

ChromeUtils.import('resource://gre/modules/Services.jsm');
ChromeUtils.import('chrome://userchromejs/content/xPref.jsm')

let UC = {};

function UserChrome_js() {
  Services.obs.addObserver(this, 'domwindowopened', false);
};

UserChrome_js.prototype = {
  observe: function (aSubject, aTopic, aData) {
      aSubject.addEventListener('DOMContentLoaded', this, true);
  },

  handleEvent: function (aEvent) {
    let document = aEvent.originalTarget;
    if (document.location && document.location.protocol == 'chrome:') {
      document.defaultView.UC = UC;
      document.defaultView.xPref = xPref;
      document.allowUnsafeHTML = true; // https://bugzilla.mozilla.org/show_bug.cgi?id=1432966
      Services.scriptloader.loadSubScript('resource://userchromejs/userChrome.js',
                              document.defaultView, 'UTF-8');
    }
  }
};

if (!Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime).inSafeMode)
  new UserChrome_js();
