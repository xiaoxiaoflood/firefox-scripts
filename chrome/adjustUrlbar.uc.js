// ==UserScript==
// @name            Adjust URLBar Popup Position and Width
// @description     urlbar suggestion popup width should match urlbar width
// @include         main
// @startup         UC.adjustUrlbar.exec(win);
// @shutdown        UC.adjustUrlbar.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

(function () {

  UC.adjustUrlbar = {
    exec: function (win) {
      let gURLBar = win.gURLBar;
      gURLBar.popup.removeAttribute('style');
      gURLBar.popup._openAutocompletePopup = function _openAutocompletePopup (aInput, aElement) {
        if (this.mPopupOpen)
          return;

        this.setAttribute('width', Math.round(gURLBar.getBoundingClientRect().width));

        this._invalidate();
        this.openPopup(aElement, 'after_start', 0, -1, false, false);
      }
    },

    orig: gURLBar.popup._openAutocompletePopup.toString(),

    destroy: function () {
      _uc.windows((doc, win) => {
        let gURLBar = win.gURLBar;
        win.eval('gURLBar.popup._openAutocompletePopup = ' + UC.adjustUrlbar.orig);
        gURLBar.popup.margins = gURLBar.popup.margins;
      });
      delete UC.adjustUrlbar;
    }
  }

})()

