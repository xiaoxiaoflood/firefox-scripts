// ==UserScript==
// @name            Status Bar
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.statusBar.exec(win);
// @shutdown        UC.statusBar.destroy();
// @onlyonce
// ==/UserScript==

const { CustomizableUI, StatusPanel } = window;

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
          StatusPanel.panel.appendChild(StatusPanel._labelElement);
      });
    });

    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

    CustomizableUI.registerArea('status-bar', {});

    Services.obs.addObserver(this, 'browser-delayed-startup-finished');
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
          StatusPanel.panel.appendChild(StatusPanel._labelElement);
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

    win.eval('Object.defineProperty(StatusPanel, "_label", {' + Object.getOwnPropertyDescriptor(StatusPanel, '_label').set.toString().replace(/^set _label/, 'set').replace(/((\s+)this\.panel\.setAttribute\("inactive", "true"\);)/, '$2this._labelElement.value = val;$1') + ', enumerable: true, configurable: true});');

    let bottomBox = document.createElement('vbox');
    bottomBox.id = 'browser-bottombox';
    bottomBox.append(win.statusbar.node);

    if (!this.enabled)
      bottomBox.collapsed = true;

    document.getElementById('fullscreen-and-pointerlock-wrapper').insertAdjacentElement('afterend', bottomBox);

    win.addEventListener('fullscreen', this.fsEvent);

    if (document.readyState === 'complete')
      this.observe(win);
  },

  fsEvent: function (ev) {
    const { StatusPanel, fullScreen, statusbar } = ev.target;
    if (fullScreen)
      StatusPanel.panel.appendChild(StatusPanel._labelElement);
    else
      statusbar.textNode.appendChild(StatusPanel._labelElement);
  },

  observe: function (win) {
    CustomizableUI.registerToolbarNode(win.statusbar.node);
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
          #status-bar > #status-text {
            display: flex !important;
            justify-content: center !important;
            align-content: center !important;
            flex-direction: column !important;
            -moz-window-dragging: drag;
          }
          toolbarpaletteitem #status-text:before {
            content: "Status text";
            color: red;
            border: 1px #aaa solid;
            border-radius: 3px;
            font-weight: bold;
          }
          #browser-bottombox:not([collapsed]) {
            border-top: 1px solid #BCBEBF !important;
          }
          :root[inFullscreen]:not([macOSNativeFullscreen]) #browser-bottombox {
            visibility: collapse !important;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },
  
  destroy: function () {
    const { CustomizableUI } = Services.wm.getMostRecentBrowserWindow();

    xPref.removeListener(this.enabledListener);
    xPref.removeListener(this.textListener);
    CustomizableUI.unregisterArea('status-bar');
    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
    _uc.windows((doc, win) => {
      const { eval, statusbar, StatusPanel } = win;
      eval('Object.defineProperty(StatusPanel, "_label", {' + this.orig.replace(/^set _label/, 'set') + ', enumerable: true, configurable: true});');
      StatusPanel.panel.appendChild(StatusPanel._labelElement);
      doc.getElementById('status-dummybar').remove();
      statusbar.node.remove();
      win.removeEventListener('fullscreen', this.fsEvent);
    });
    Services.obs.removeObserver(this, 'browser-delayed-startup-finished');
    delete UC.statusBar;
  }
}

UC.statusBar.init();
