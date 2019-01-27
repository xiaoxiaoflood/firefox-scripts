// ==UserScript==
// @name            about:blank as New Tab
// @include         main
// @shutdown        UC.newTabAboutBlank.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

(function () {

  UC.newTabAboutBlank = {
    init: function () {
      aboutNewTabService.newTabURL = 'about:blank';
    },

    destroy: function () {
      aboutNewTabService.resetNewTabURL();
      delete UC.newTabAboutBlank;
    }
  }

  UC.newTabAboutBlank.init();

})()
