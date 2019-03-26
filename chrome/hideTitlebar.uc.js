// ==UserScript==
// @name            hideTitlebar.uc.js
// @include         main
// @startup         UC.hideTitlebar.exec(win);
// @shutdown        UC.hideTitlebar.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

(function () {

  UC.hideTitlebar = {
    exec: function (win) {
      var document = win.document;
      document.getElementById('TabsToolbar').style.visibility = 'collapse';
      document.getElementById('titlebar').setAttribute('style', 'margin-top: -31px;');
      document.getElementById('toolbar-menubar').setAttribute = (function () {
          return function () {
            var result = Element.prototype.setAttribute.apply(this, arguments);

            if (arguments[0] == 'inactive')
              document.getElementById('titlebar').setAttribute('style', 'margin-top: -31px;');

            return result;
          };
        }
      )();

      document.getElementById('toolbar-menubar').removeAttribute = (function () {
          return function () {
            if (arguments[0] == 'inactive')
              document.getElementById('titlebar').removeAttribute('style');

            return Element.prototype.removeAttribute.apply(this, arguments);
          };
        }
      )();
    },

    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.document.getElementById('TabsToolbar').style.visibility = '';
        win.document.getElementById('titlebar').removeAttribute('style');
        win.document.getElementById('toolbar-menubar').setAttribute = Element.prototype.setAttribute;
        win.document.getElementById('toolbar-menubar').removeAttribute = Element.prototype.removeAttribute;
      }
      delete UC.hideTitlebar;
    }
  }

})()