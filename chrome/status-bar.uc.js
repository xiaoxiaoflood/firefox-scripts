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

  get enabled() {
    return xPref.get(this.PREF_ENABLED);
  },

  init: function () {
    xPref.set(this.PREF_ENABLED, true, true);
    this.prefListener = xPref.addListener(this.PREF_ENABLED, (isEnabled) => {
      CustomizableUI.getWidget('status-dummybar').instances.forEach(dummyBar => {
        dummyBar.node.setAttribute('collapsed', !isEnabled);
      });
    });

    CustomizableUI.registerArea('status-bar', {legacy: true});
  },

  exec: function (win) {
    let document = win.document;
    let StatusPanel = win.StatusPanel;

    // para ter a toolbar acessível via menu de contexto, é preciso que ela seja filha da gNavToolbox. Como a gNavToolbox fica no topo e o status lá embaixo, será criada uma barra "dummy", cuja ação referenciará a verdadeira statusbar.
    let dummystatusbar = _uc.createElement(document, 'toolbar', {
      id: 'status-dummybar',
      toolbarname: 'Status Bar',
      hidden: 'true'
    });
    dummystatusbar.collapsed = !this.enabled;
    dummystatusbar.setAttribute = (function () {
      return function (att, value) {
        let result = Element.prototype.setAttribute.apply(this, arguments);

        if (att == 'collapsed') {
          let StatusPanel = win.StatusPanel;
          if (value === true) {
            xPref.set(UC.statusBar.PREF_ENABLED, false);
            win.statusbar.node.setAttribute('collapsed', true);
            StatusPanel.panel.firstChild.appendChild(StatusPanel._labelElement);
            win.statusbar.parentNode.collapsed = true;;
          } else {
            xPref.set(UC.statusBar.PREF_ENABLED, true);
            win.statusbar.node.setAttribute('collapsed', false);
            win.statusbar.textNode.appendChild(StatusPanel._labelElement);
            win.statusbar.parentNode.collapsed = false;
          }
        }

        return result;
      };
    })();
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
    if (this.enabled)
      win.statusbar.textNode.appendChild(StatusPanel._labelElement);
    win.statusbar.node.appendChild(win.statusbar.textNode);

    // precisa do container pra poder colocar itens à esquerda do resizer com efeito imediato. Sem ele, só corrige a ordem depois de reiniciar o Fx.
    let resizerContainer = _uc.createElement(document, 'toolbaritem', {id: 'resizer-container'});
    let resizer = _uc.createElement(document, 'resizer');
    resizerContainer.appendChild(resizer);
    win.statusbar.node.appendChild(resizerContainer);

    // a label que contém o status na verdade não apaga o texto quando não há status, apenas esconde o elemento container. Com a statusbar, a label estará sempre visível, então precisa apagar o texto quando não houver status.
    win.eval('Object.defineProperty(StatusPanel, "_label", {' + Object.getOwnPropertyDescriptor(StatusPanel, '_label').set.toString().replace(/^set _label/, 'set').replace(/((\s+)this\.panel\.setAttribute\("inactive", "true"\);)/, '$2this._labelElement.value = val;$1') + ', enumerable: true, configurable: true});');

    let bottomBox = document.getElementById('browser-bottombox');
    if (!this.enabled)
      bottomBox.collapsed = true;
    bottomBox.appendChild(win.statusbar.node);
    CustomizableUI.registerToolbarNode(win.statusbar.node);
    win.statusbar.parentNode = bottomBox;

    let sspi = document.createProcessingInstruction(
      'xml-stylesheet',
      'type="text/css" href="data:text/css,' + encodeURIComponent(this.style) + '"'
    );
    document.insertBefore(sspi, document.documentElement);
    this.styles.push(sspi);
  },

  orig: Object.getOwnPropertyDescriptor(StatusPanel, '_label').set.toString(),

  style: `
    @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
    #status-bar {
      color: initial; /* sem isso, ícones padrões ficam transparentes */
    }
    #status-text > #statuspanel-label {
      border-top: 0; /* status flutuante é 1, mas quando deslocado pra statusbar não é pra ter */
    }
    #browser-bottombox:not([collapsed]) {
      border-top: 1px solid var(--chrome-content-separator-color);
      background-color: var(--toolbar-bgcolor);
    }
    toolbarpaletteitem #status-text:after {
      content: "Status text";
      color: red;
      border: 1px #aaa solid;
      border-radius: 3px;
      font-weight: bold;
    }
    #status-bar > #status-text {
        display: flex;
        justify-content: center;
        align-content: center;
        flex-direction: column;
    }
  `,

  styles: [],
  
  destroy: function () {
    xPref.removeListener(this.prefListener);
    CustomizableUI.unregisterArea('status-bar', false);
    this.styles.forEach(style => style.remove());
    _uc.windows((doc, win) => {
      win.eval('Object.defineProperty(StatusPanel, "_label", {' + this.orig.replace(/^set _label/, 'set') + ', enumerable: true, configurable: true});');
      let StatusPanel = win.StatusPanel;
      StatusPanel.panel.firstChild.appendChild(StatusPanel._labelElement);
      document.getElementById('status-dummybar').remove();
      win.statusbar.node.remove();
    });
    delete UC.statusBar;
  }
}

UC.statusBar.init();