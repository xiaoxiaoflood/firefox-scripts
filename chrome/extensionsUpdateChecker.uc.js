// ==UserScript==
// @name            Extensions Update Checker
// @author          xiaoxiaoflood
// @include         main
// @shutdown        UC.ExtensionsUpdateChecker.destroy();
// @onlyonce
// ==/UserScript==

UC.ExtensionsUpdateChecker = {
  ignoreList: [],

  PREF_AUTOUPDATE: 'extensions.update.autoUpdateDefault',
  OBS_TOPIC_BG_UPD_COMPLETE: 'addons-background-update-complete',

  observe: async function () {
    const { AddonManager, BrowserOpenAddonsMgr } = Services.wm.getMostRecentBrowserWindow();
    let addons = await AddonManager.getAllAddons();
    if (addons.some(addon => addon.updateInstall && !this.ignoreList.includes(addon.name)))
      BrowserOpenAddonsMgr('addons://updates/available');
  },

  init: function () {
    xPref.lock(this.PREF_AUTOUPDATE, false);
    Services.obs.addObserver(this, this.OBS_TOPIC_BG_UPD_COMPLETE, false);
  },

  destroy: function () {
    xPref.unlock(this.PREF_AUTOUPDATE);
    Services.obs.removeObserver(this, this.OBS_TOPIC_BG_UPD_COMPLETE, false);
    delete UC.ExtensionsUpdateChecker;
  }
}

UC.ExtensionsUpdateChecker.init();
