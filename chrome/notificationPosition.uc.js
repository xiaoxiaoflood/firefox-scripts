// ==UserScript==
// @name            Notification XUL Fix Position
// @author          xiaoxiaoflood
// @include         chrome://global/content/alerts/alert.xhtml
// @startup         UC.notificationPosition.exec(win);
// @shutdown        UC.notificationPosition.destroy();
// @onlyonce
// ==/UserScript==

UC.notificationPosition = {
  exec: function (win) {
    win.document.documentElement.setAttribute('onload', 'gOrigin = 0; onAlertLoad();');
  },

  destroy: function () {
    delete UC.notificationPosition;
  }
}
