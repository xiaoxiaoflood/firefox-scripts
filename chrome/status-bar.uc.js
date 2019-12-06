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
      var StatusPanel = win.StatusPanel;

      var statusbar = document.createXULElement('toolbar');
      statusbar.id = 'status-bar';
      statusbar.setAttribute('customizable', 'true');
      statusbar.setAttribute('mode', 'icons');
      statusbar.setAttribute('context', 'toolbar-context-menu');
      statusbar.setAttribute('toolbarname', 'Status Bar');
      statusbar.setAttribute('toolboxid', 'navigator-toolbox');

      var toolbaritem = document.createXULElement('toolbaritem');
      toolbaritem.id = 'status-text';
      toolbaritem.flex = 1;
      toolbaritem.width = 100;
 
      var label = document.createXULElement('label');
      label.id = 'status-text-label';
      label.flex = 1;
 
      toolbaritem.appendChild(label);
      statusbar.appendChild(toolbaritem);

      var hbox = document.createXULElement('hbox');
      hbox.id = 'resizer';
      hbox.flex = 0;

      var resizer = document.createXULElement('resizer');
      resizer.dir = 'bottomend';

      hbox.appendChild(resizer);
      statusbar.appendChild(hbox);

      StatusPanel.obs = new MutationObserver(() => {
        document.getElementById('status-text-label').value = StatusPanel.isVisible ? StatusPanel._labelElement.value : '';
      });

      StatusPanel.obs.observe(StatusPanel._labelElement, { attributeFilter: ['value', 'crop'] });

      var vbox  = document.createXULElement('vbox');
      vbox.id = 'bottom-toolbar-vbox';
      vbox.appendChild(statusbar);
      vbox.style.backgroundColor = '#F6F6F6';

      var browserBottombox = document.getElementById('browser-bottombox');
      browserBottombox.parentNode.insertBefore(vbox, browserBottombox);
      CustomizableUI.registerToolbarNode(statusbar);

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
        color: initial !important;
      }
      #statuspanel {
        display: none;
      }
    `,

    styles: [],

    init: function () {
      CustomizableUI.registerArea('status-bar', {legacy: true});
    },
    
    destroy: function () {
      CustomizableUI.unregisterArea('status-bar', false);
      UC.statusBar.styles.forEach(s => s.remove());
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        var document = win.document;
        var StatusPanel = win.StatusPanel;
        StatusPanel.obs.disconnect();
        delete StatusPanel.obs;
        document.getElementById('bottom-toolbar-vbox').remove();
      }
      delete UC.statusBar;
    }
  }

  UC.statusBar.init();

})()