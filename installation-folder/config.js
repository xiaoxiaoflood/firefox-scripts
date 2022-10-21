// skip 1st line
lockPref('xpinstall.signatures.required', false);
lockPref('extensions.install_origins.enabled', false);

try {
  const cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);

  // signing bypass by Dumby from forum.mozilla-russia.org
  const g = Cu.getGlobalForObject(Cu);
  const sandbox = new Cu.Sandbox(g, { freshCompartment: true });
  Cc['@mozilla.org/jsdebugger;1'].createInstance(Ci.IJSDebugger).addClass(sandbox);
  const dbg = new sandbox.Debugger();
  dbg.addDebuggee(g);
  const gref = dbg.makeGlobalObjectReference(g);

  dbg.onEnterFrame = frame => {
    const { script } = frame;

    if (!script.url.startsWith('resource://gre/modules/AppConstants.'))
      return;

    dbg.onEnterFrame = undefined;

    if (script.isModule) { // ESM, Fx 108+
      const env = frame.environment;
      frame.onPop = () => env.setVariable('AppConstants', gref.makeDebuggeeValue(Object.freeze(
        Object.assign(new Object(), env.getVariable('AppConstants').unsafeDereference(), {
          'MOZ_REQUIRE_SIGNING': false
        })
      )));
    } else { // JSM
      const nsvo = frame.this.unsafeDereference();
      nsvo.Object = {
        freeze (ac) {
          ac.MOZ_REQUIRE_SIGNING = false;
          delete nsvo.Object;
          return Object.freeze(ac);
        }
      };
    }
  }

  ChromeUtils.import('resource://gre/modules/addons/XPIInstall.jsm');

  dbg.removeAllDebuggees();

  Cu.import('chrome://userchromejs/content/BootstrapLoader.jsm');
} catch (ex) {};

try {
  Cu.import('chrome://userchromejs/content/userChrome.jsm');
} catch (ex) {};
