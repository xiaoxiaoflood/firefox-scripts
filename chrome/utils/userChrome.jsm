let EXPORTED_SYMBOLS = [];

let {
  classes: Cc,
  interfaces: Ci,
  utils: Cu
} = Components;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/osfile.jsm');

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
      Services.scriptloader.loadSubScript(OS.Path.toFileURI(OS.Constants.Path.profileDir) + '/chrome/userChrome.js',
                              document.defaultView, 'UTF-8');
    }
  }
};

if (!Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime).inSafeMode)
  new UserChrome_js();
