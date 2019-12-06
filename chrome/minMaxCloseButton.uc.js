// ==UserScript==
// @name            MinMaxClose Button
// @include         main
// @shutdown        UC.MinMaxCloseButton.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

// original: https://j.mozest.com/ucscript/script/83.meta.js

(function () {

  UC.MinMaxCloseButton = {
    init: function () {
      CustomizableUI.createWidget({
        id: 'minMaxClose-button',
        type: 'custom',
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: function (aDocument) {
          var toolbaritem = aDocument.createXULElement('toolbarbutton');
          var props = {
            id: 'minMaxClose-button',
            class: 'toolbarbutton-1 chromeclass-toolbar-additional',
            label: 'Window Button',
            tooltiptext: 'Left-Click: Minimize\nMiddle-Click: Maximize/Restore\nRight-Click: Exit',
            style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAO0lEQVQ4jWNgYGD4jwWTBCg2gBSDSTKcYgNwGUqRzfQzAJcYxQYQBahiAE0SF7pBVEn2VHEJ/VyANQwACylDvQ9eqkEAAAAASUVORK5CYII=)',
            oncontextmenu: 'return false',
            onclick: 'UC.MinMaxCloseButton.BrowserManipulateCombine(event);'
          };
          for (var p in props) {
            toolbaritem.setAttribute(p, props[p]);
          }
          return toolbaritem;
        }
      });
    },
    
    BrowserManipulateCombine: function (e) {
      var win = e.view;
      switch(e.button) {
        case 0:
          win.minimize();
          break;
        case 1:
          let max = win.document.getElementById('main-window').getAttribute('sizemode') == 'maximized' ? true : false;
          if ((!e.shiftKey && max) ||
              (e.shiftKey && !max && !(win.screenX === -5 && win.screenY === 0 && win.innerWidth === 1966 && win.innerHeight === 1050))) {
            win.resizeTo(1992, 1056);
            win.moveTo(-5, 0);
          } else if (max && e.shiftKey) {
            win.restore();
          } else {
            win.maximize();
          }
          break;
        case 2:
          win.BrowserTryToCloseWindow();
      }
    },
    
    destroy: function () {
      CustomizableUI.destroyWidget('minMaxClose-button');
      delete UC.MinMaxCloseButton;
    }
  }

  UC.MinMaxCloseButton.init();

})()