// ==UserScript==
// @name            Status Bar
// @include         main
// @startup         UC.statusBar.exec(win);
// @shutdown        UC.statusBar.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

// original: https://github.com/ardiman/userChrome.js/blob/master/revertaddonbarstatusbar/RevertAddonBarStatusBar.uc.js

(function () {

  UC.statusBar = {
    exec: function (win) {
      var document = win.document;

      var statusbar = document.createElement('toolbar');
      statusbar.id = 'status-bar';
      statusbar.setAttribute('customizable', 'true');
      statusbar.setAttribute('mode', 'icons');
      statusbar.setAttribute('context', 'toolbar-context-menu');
      statusbar.setAttribute('toolbarname', 'Status Bar');
      statusbar.setAttribute('toolboxid', 'navigator-toolbox');

      var vbox  = document.createElement('vbox');
      vbox.id = 'bottom-toolbar-vbox';
      vbox.appendChild(statusbar);
      vbox.style.backgroundColor = '#F6F6F6';

      var browserBottombox = document.getElementById('browser-bottombox');
      browserBottombox.parentNode.insertBefore(vbox, browserBottombox);

      var sspi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css,' + encodeURIComponent(UC.statusBar.style) + '"'
      );
      document.insertBefore(sspi, document.documentElement);
      UC.statusBar.styles.push(sspi);
    },
    
    style: `
      @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
      #status-bar {
        border-top: 1px solid #D0D0D0;
        direction: rtl;
      }
      statuspanel {
        max-width: none;
        left: 0px;
        bottom: 0px;
      }
      .statuspanel-inner {
        height: 1em;
      }
      .statuspanel-label {
        border: none !important;
        background: none transparent !important;
        color: black;
      }
    `,

    styles: [],

    init: function () {
      CustomizableUI.registerArea('status-bar', {legacy: true});
    },
    
    destroy: function () {
      CustomizableUI.unregisterArea('status-bar', false);
      UC.statusBar.styles.forEach(s => s.parentNode.removeChild(s));
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        var document = win.document;
        document.getElementById('browser-panel').removeChild(document.getElementById('bottom-toolbar-vbox'));
        var extraToolbarsList = win.gNavToolbox.externalToolbars;
        extraToolbarsList.splice(extraToolbarsList.findIndex(t => t.id == 'status-bar'), 1);
      }
      delete UC.statusBar;
    }
  }

  UC.statusBar.init();

})()
