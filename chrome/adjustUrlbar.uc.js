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
      var document = win.document;
      var popup = document.getElementById('PopupAutoCompleteRichResult');
      popup.style.marginLeft = '';// orig seta marginleft quando a popup é aberta, precisa resetar
      popup.__proto__._openAutocompletePopup = function _openAutocompletePopup (aInput, aElement) {
        if (this.mPopupOpen)
          return;
        this.setAttribute('width', Math.round(win.gURLBar.getBoundingClientRect().width));
        this._invalidate();
        this.openPopup(aElement, 'after_start', 0, -1, false, false);
      }
    },

    orig: document.getElementById('PopupAutoCompleteRichResult').__proto__._openAutocompletePopup.toString(),

    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.eval("document.getElementById('PopupAutoCompleteRichResult').__proto__._openAutocompletePopup = " +
             UC.adjustUrlbar.orig);
      }
      delete UC.adjustUrlbar;
    }
  }

})()
