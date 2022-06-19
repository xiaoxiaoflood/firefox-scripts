// skip 1st line
lockPref('xpinstall.signatures.required', false);
lockPref('extensions.install_origins.enabled', false);

// signing bypass by Dumby from forum.mozilla-russia.org
try {
  let g = Cu.getGlobalForObject(Cu);
  let def = g.ChromeUtils.defineModuleGetter;
  g.ChromeUtils.defineModuleGetter = (...args) => {
    try {
      let sandbox = new Cu.Sandbox(g, { freshCompartment: true });
      Cc['@mozilla.org/jsdebugger;1'].createInstance(Ci.IJSDebugger).addClass(sandbox);
      let dbg = new sandbox.Debugger();
      dbg.addDebuggee(g);
      dbg.makeGlobalObjectReference(g);
      dbg.addDebuggee(globalThis);
      let e = dbg.getNewestFrame().older.environment;
      let obj = e.parent.type == 'object' && e.parent.object;
      if (obj && obj.class.startsWith('N')) // JSM, NSVO
        obj.unsafeDereference().Object = {
          freeze: ac => (ac.MOZ_REQUIRE_SIGNING = false) || g.Object.freeze(ac)
        };
      dbg.removeAllDebuggees();
    } catch(ex) {
      Cu.reportError(ex);
    }
    (g.ChromeUtils.defineModuleGetter = def)(...args);
  }
} catch(ex) {
  Cu.reportError(ex)
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
