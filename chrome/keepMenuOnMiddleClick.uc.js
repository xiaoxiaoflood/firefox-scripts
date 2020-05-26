// ==UserScript==
// @name            Keep Menu Open on Middle-Click
// @include         main
// @startup         UC.KeepMenuOnMiddleClick.exec(win);
// @shutdown        UC.KeepMenuOnMiddleClick.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

UC.KeepMenuOnMiddleClick = {
  exec: (win) => win.eval('checkForMiddleClick = ' +
                           checkForMiddleClick.toString().replace('closeMenus(event.target);', '')),

  init: function () {
    if (this.prefHadUserValue = Services.prefs.prefHasUserValue(this.PREF))
      this.prefUserValue = xPref.get(this.PREF);
    xPref.set(this.PREF, false);
  },

  PREF: 'browser.bookmarks.openInTabClosesMenu',
  orig: checkForMiddleClick.toString(),

  destroy: function () {
    if (this.prefHadUserValue)
      xPref.set(this.PREF, this.prefUserValue);
    else
      xPref.clear(this.PREF);

    _uc.windows((doc, win) => {
      win.eval('checkForMiddleClick = ' + UC.KeepMenuOnMiddleClick.orig);
    }, true);

    delete UC.KeepMenuOnMiddleClick;
  }
}

UC.KeepMenuOnMiddleClick.init();