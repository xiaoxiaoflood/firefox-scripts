// ==UserScript==
// @name            Context Menu - Hide on Click
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.contextHideOnClick.exec(win);
// @shutdown        UC.contextHideOnClick.destroy();
// @onlyonce
// ==/UserScript==

UC.contextHideOnClick = {
  initNSMouseEvent_orig: MouseEvent.prototype.initNSMouseEvent,

  exec: function (win) {
    win.MouseEvent.prototype.initNSMouseEvent = function () {
      if (arguments[0] === 'contextmenu' && arguments[13] === 2) {
        arguments[5] += 2;
        arguments[6] += 2;
      }
      return UC.contextHideOnClick.initNSMouseEvent_orig.apply(this, arguments);
    }
  },

  destroy: function () {
    _uc.windows((doc, win) => {
      win.MouseEvent.prototype.initNSMouseEvent = this.initNSMouseEvent_orig;
    });
    delete UC.contextHideOnClick;
  }
}

