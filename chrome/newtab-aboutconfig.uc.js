// ==UserScript==
// @name            Restore browser.newtab.url in about:config
// @author          TheRealPSV
// @include         main
// @shutdown        UC.NewTabAboutConfig.destroy();
// @onlyonce
// ==/UserScript==

const { AboutNewTab } = ChromeUtils.import(
  "resource:///modules/AboutNewTab.jsm"
);

UC.NewTabAboutConfig = {
  NEW_TAB_CONFIG_PATH: "browser.newtab.url",
  init: function () {
    //fetch pref if it exists
    this.newTabURL = xPref.get(this.NEW_TAB_CONFIG_PATH);

    //if pref doesn't exist, give it a default value of about:blank
    if (!this.newTabURL) {
      this.newTabURL = "about:blank";
      xPref.set(this.NEW_TAB_CONFIG_PATH, this.newTabURL);
    }

    //set the new tab URL in the browser itself, and add a listener to update it when the config is changed
    try {
      AboutNewTab.newTabURL = this.newTabURL;
      this.prefListener = xPref.addListener(
        this.NEW_TAB_CONFIG_PATH,
        (value) => {
          AboutNewTab.newTabURL = value;
        }
      );
    } catch (e) {
      console.error(e);
    } // Browser Console
  },

  destroy: function () {
    xPref.removeListener(this.NEW_TAB_CONFIG_PATH);
  },
};

UC.NewTabAboutConfig.init();
