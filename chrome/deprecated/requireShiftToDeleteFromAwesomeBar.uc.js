// ==UserScript==
// @name            Require Shift to Delete from Address Bar
// @include         main
// @startup         UC.requireShiftToDeleteFromAwesomeBar.exec(win);
// @shutdown        UC.requireShiftToDeleteFromAwesomeBar.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

(function () {

  UC.requireShiftToDeleteFromAwesomeBar = {
    exec: function (win) {
      win.eval('gURLBar.handleKeyPress = ' +
           gURLBar.handleKeyPress.toString().
             replace('&& !aEvent.shiftKey',
                     '|| !aEvent.shiftKey'));
    },

    orig: gURLBar.handleKeyPress.toString(),

    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.eval('gURLBar.handleKeyPress = ' +
             UC.requireShiftToDeleteFromAwesomeBar.orig);
      }
      delete UC.requireShiftToDeleteFromAwesomeBar;
    }
  }

})()
