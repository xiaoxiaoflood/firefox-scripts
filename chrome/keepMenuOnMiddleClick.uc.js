// ==UserScript==
// @name            Keep Menu Open on Middle-Click
// @include         main
// @startup         UC.KeepMenuOnMiddleClick.exec(win);
// @shutdown        UC.KeepMenuOnMiddleClick.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

(function () {

  UC.KeepMenuOnMiddleClick = {
    exec: function (win) {
      win.eval('checkForMiddleClick = ' +
               checkForMiddleClick.toString().
                 replace('closeMenus(event.target);',
                         ''));
    },

    orig: checkForMiddleClick.toString(),

    init: function () {
      xPref.set('browser.bookmarks.openInTabClosesMenu', false);
    },

    destroy: function () {
      xPref.clear('browser.bookmarks.openInTabClosesMenu');
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.eval('checkForMiddleClick = ' +
                 UC.KeepMenuOnMiddleClick.orig);
      }
      delete UC.KeepMenuOnMiddleClick;
    }
  }

  UC.KeepMenuOnMiddleClick.init();

})()
