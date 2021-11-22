// ==UserScript==
// @name            Status Bar
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.statusBar.exec(win);
// @shutdown        UC.statusBar.destroy();
// @onlyonce
// ==/UserScript==

UC.statusBar = {
  PREF_ENABLED: 'userChromeJS.statusbar.enabled',
  PREF_STATUSTEXT: 'userChromeJS.statusbar.appendStatusText',

  get enabled() {
    return xPref.get(this.PREF_ENABLED);
  },

  get textInBar() {
    return this.enabled && xPref.get(this.PREF_STATUSTEXT);
  },

  init: function () {
    xPref.set(this.PREF_ENABLED, true, true);
    xPref.set(this.PREF_STATUSTEXT, true, true);
    this.enabledListener = xPref.addListener(this.PREF_ENABLED, (isEnabled) => {
      CustomizableUI.getWidget('status-dummybar').instances.forEach(dummyBar => {
        dummyBar.node.setAttribute('collapsed', !isEnabled);
      });
    });
    this.textListener = xPref.addListener(this.PREF_STATUSTEXT, (isEnabled) => {
      if (!UC.statusBar.enabled)
        return;

      _uc.windows((doc, win) => {
        let StatusPanel = win.StatusPanel;
        if (isEnabled)
          win.statusbar.textNode.appendChild(StatusPanel._labelElement);
        else
          StatusPanel.panel.firstChild.appendChild(StatusPanel._labelElement);
      });
    });

    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

    CustomizableUI.registerArea('status-bar', {});
  },

  exec: function (win) {
    let document = win.document;
    let StatusPanel = win.StatusPanel;

    let dummystatusbar = _uc.createElement(document, 'toolbar', {
      id: 'status-dummybar',
      toolbarname: 'Status Bar',
      hidden: 'true'
    });
    dummystatusbar.collapsed = !this.enabled;
    dummystatusbar.setAttribute = function (att, value) {
      let result = Element.prototype.setAttribute.apply(this, arguments);

      if (att == 'collapsed') {
        let StatusPanel = win.StatusPanel;
        if (value === true) {
          xPref.set(UC.statusBar.PREF_ENABLED, false);
          win.statusbar.node.setAttribute('collapsed', true);
          StatusPanel.panel.firstChild.appendChild(StatusPanel._labelElement);
          win.statusbar.node.parentNode.collapsed = true;;
        } else {
          xPref.set(UC.statusBar.PREF_ENABLED, true);
          win.statusbar.node.setAttribute('collapsed', false);
          if (UC.statusBar.textInBar)
            win.statusbar.textNode.appendChild(StatusPanel._labelElement);
          win.statusbar.node.parentNode.collapsed = false;
        }
      }

      return result;
    };
    win.gNavToolbox.appendChild(dummystatusbar);

    win.statusbar.node = _uc.createElement(document, 'toolbar', {
      id: 'status-bar',
      customizable: 'true',
      context: 'toolbar-context-menu',
      mode: 'icons'
    });

    win.statusbar.textNode = _uc.createElement(document, 'toolbaritem', {
      id: 'status-text',
      flex: '1',
      width: '100'
    });
    if (this.textInBar)
      win.statusbar.textNode.appendChild(StatusPanel._labelElement);
    win.statusbar.node.appendChild(win.statusbar.textNode);

    let resizerContainer = _uc.createElement(document, 'toolbaritem', {id: 'resizer-container'});
    let resizer = _uc.createElement(document, 'resizer');
    resizer.setAttribute('dir', 'bottomend');
    resizerContainer.appendChild(resizer);
    win.statusbar.node.appendChild(resizerContainer);

    win.eval('Object.defineProperty(StatusPanel, "_label", {' + Object.getOwnPropertyDescriptor(StatusPanel, '_label').set.toString().replace(/^set _label/, 'set').replace(/((\s+)this\.panel\.setAttribute\("inactive", "true"\);)/, '$2this._labelElement.value = val;$1') + ', enumerable: true, configurable: true});');

    let bottomBox = document.getElementById('browser-bottombox');
    if (!this.enabled)
      bottomBox.collapsed = true;

    CustomizableUI.registerToolbarNode(win.statusbar.node);
    bottomBox.appendChild(win.statusbar.node);
    win.statusbar.node.parentNode = bottomBox;
  },

  orig: Object.getOwnPropertyDescriptor(StatusPanel, '_label').set.toString(),

  setStyle: function () {
    this.STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}') {
          #status-bar {
            color: initial !important;
            background-color: var(--toolbar-non-lwt-bgcolor);
          }
          #status-text > #statuspanel-label {
            border-top: 0 !important;
            background-color: unset !important;
            color: #444;
          }
          #wrapper-status-text label::after {
            content: "Status text" !important;
            color: red !important;
            border: 1px #aaa solid !important;
            border-radius: 3px !important;
            font-weight: bold !important;
          }
          #status-bar > #status-text {
            display: flex !important;
            justify-content: center !important;
            align-content: center !important;
            flex-direction: column !important;
          }
          @media (-moz-toolbar-prefers-color-scheme: light) {
            #browser-bottombox:not([collapsed]) {
              border-top: 1px solid var(--panel-separator-color) !important;
            }
          }
          @media (-moz-toolbar-prefers-color-scheme: dark) {
            #status-bar {
              background-color: var(--toolbar-bgcolor);
            }
            #status-text > #statuspanel-label {
              color: var(--lwt-text-color) !important;
            }
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },
  
  destroy: function () {
    xPref.removeListener(this.enabledListener);
    xPref.removeListener(this.textListener);
    CustomizableUI.unregisterArea('status-bar');
    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
    _uc.windows((doc, win) => {
      win.eval('Object.defineProperty(StatusPanel, "_label", {' + this.orig.replace(/^set _label/, 'set') + ', enumerable: true, configurable: true});');
      let StatusPanel = win.StatusPanel;
      StatusPanel.panel.firstChild.appendChild(StatusPanel._labelElement);
      doc.getElementById('status-dummybar').remove();
      win.statusbar.node.remove();
    });
    delete UC.statusBar;
  }
}

UC.statusBar.init();