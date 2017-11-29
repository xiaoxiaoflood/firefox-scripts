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
      let { NewTabURL } = Cu.import('resource:///modules/NewTabURL.jsm');
      NewTabURL.override('about:blank');
    },

    destroy: function () {
      NewTabURL.reset();
      delete UC.newTabAboutBlank;
    }
  }

  UC.newTabAboutBlank.init();

})()
