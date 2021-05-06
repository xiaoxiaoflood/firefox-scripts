// ==UserScript==
// @name            Keep Menu Open on Middle-Click
// @include         main
// @startup         UC.KeepMenuOnMiddleClick.exec(win);
// @shutdown        UC.KeepMenuOnMiddleClick.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

UC.KeepMenuOnMiddleClick = {
  exec: function (win) {
    win.document.getElementById('history-menu').addEventListener('mouseup', this.mouseupHandler);
  },

  init: function () {
    if (this.prefHadUserValue = Services.prefs.prefHasUserValue(this.PREF))
      this.prefUserValue = xPref.get(this.PREF);
    xPref.set(this.PREF, false);
  },

  mouseupHandler: function (event) {
    const elem = event.target;
    if (event.button == 1 && elem.classList.contains('bookmark-item')) {
      elem.setAttribute('closemenu', 'none');
      elem.parentNode.addEventListener('popuphidden', () => {
        elem.removeAttribute('closemenu');
      }, { once: true });
    }
  },

  PREF: 'browser.bookmarks.openInTabClosesMenu',

  destroy: function () {
    if (this.prefHadUserValue)
      xPref.set(this.PREF, this.prefUserValue);
    else
      xPref.clear(this.PREF);

    _uc.windows((doc, win) => {
      win.document.getElementById('history-menu').removeEventListener('mouseup', this.mouseupHandler);
    }, true);

    delete UC.KeepMenuOnMiddleClick;
  }
}

UC.KeepMenuOnMiddleClick.init();