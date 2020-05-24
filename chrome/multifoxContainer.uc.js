// ==UserScript==
// @name            multifoxContainer
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.multifoxContainer.exec(win);
// @shutdown        UC.multifoxContainer.destroy();
// @onlyonce
// ==/UserScript==

UC.multifoxContainer = {
  exec: function (win) {
    let document = win.document;
    let gBrowser = win.gBrowser;
    let MozElements = win.MozElements;

    let mfcm = _uc.createElement(document, 'menupopup', {
      id: 'mf-contextmenu',
      position: 'after_start',
      onpopupshowing: 'UC.multifoxContainer.showPopup(window)',
    });
    document.getElementById('mainPopupSet').appendChild(mfcm);
    document.getElementById('userContext-icons').setAttribute('popup', 'mf-contextmenu');

    let BrowserOpenTab = win.BrowserOpenTab;
    win.eval('BrowserOpenTab = ' +
              BrowserOpenTab.toString().replace('relatedToCurrent,',
                                                'relatedToCurrent, userContextId: gBrowser.selectedTab.userContextId == UC.privateTab?.container.userContextId ? 0 : gBrowser.selectedTab.userContextId,'));

    let orig_updateUserContextUIIndicator = win.updateUserContextUIIndicator;
    win.updateUserContextUIIndicator = (function () {
      return function () {
        orig_updateUserContextUIIndicator();

        if (gBrowser.selectedTab.userContextId == 0) {
          let hbox = document.getElementById('userContext-icons');
          hbox.hidden = false;
          hbox.className = 'identity-color-black';
          document.getElementById('userContext-label').value = 'Default';
          document.getElementById('userContext-indicator').className = 'identity-icon-fingerprint';
        }
      };
    })();
    win.updateUserContextUIIndicator.orig = orig_updateUserContextUIIndicator;

    if (document.readyState == 'complete')
      win.updateUserContextUIIndicator();

    MozElements.MozTab.prototype.getAttribute = (function () {
      return function (att) {
        if (att == 'usercontextid' && 'toUserContextId' in this) {
          let id = this.toUserContextId;
          delete this.toUserContextId;
          return id;
        } else {
          return UC.multifoxContainer.orig_getAttribute.call(this, att);
        }
      };
    })();
  },

  showPopup: function (win) {
    let document = win.document;
    let userContextId = win.gBrowser.selectedTab.userContextId;
    let menupopup = document.getElementById('mf-contextmenu');

    let firstChild;
    while (firstChild = menupopup.firstChild)
      firstChild.remove();

    let menuitem;
    if (userContextId != 0) {
      menuitem = _uc.createElement(document, 'menuitem', {
        class: 'menuitem-iconic identity-color-black identity-icon-fingerprint',
        'data-usercontextid': '0',
        label: 'Default',
        oncommand: 'UC.multifoxContainer.openContainer(window, 0, 0);',
      });
      menuitem.addEventListener('click', function (e) {
        if (e.button == 1) {
          UC.multifoxContainer.openContainer(win, 1, 0);
          menupopup.hidePopup();
        }
      });
      menupopup.appendChild(menuitem);
    }

    ContextualIdentityService.getPublicIdentities().forEach(context => {
      if (userContextId !== context.userContextId) {
        menuitem = _uc.createElement(document, 'menuitem', {
          class: 'menuitem-iconic identity-color-' + context.color + ' identity-icon-' + context.icon,
          'data-usercontextid': userContextId,
          label: ContextualIdentityService.getUserContextLabel(context.userContextId),
          oncommand: 'UC.multifoxContainer.openContainer(window, 0, ' + context.userContextId + ')',
        });
        menuitem.addEventListener('click', function (e) {
          if (e.button == 1) {
            UC.multifoxContainer.openContainer(win, 1, context.userContextId);
            menupopup.hidePopup();
          }
        });
        menupopup.appendChild(menuitem);
      }
    });
  },

  openContainer: function (win, btn, id) {
    let gBrowser = win.gBrowser;
    let tab = gBrowser.selectedTab;
    tab.toUserContextId = id;
    gBrowser.selectedTab = gBrowser.duplicateTab(tab);
    if (btn == 0)
      gBrowser.removeTab(tab);
  },

  init: function () {
    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
  },

  orig_getAttribute: MozElements.MozTab.prototype.getAttribute,

  setStyle: function () {
    this.STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}') {
          .identity-color-black {
            --identity-tab-color: %23424242;
            --identity-icon-color: %23424242;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },

  destroy: function () {
    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);

    _uc.windows((doc, win) => {
      doc.getElementById('mf-contextmenu').remove();
      win.eval('BrowserOpenTab = ' +
                win.BrowserOpenTab.toString().replace('relatedToCurrent, userContextId: gBrowser.selectedTab.userContextId == UC.privateTab?.container.userContextId ? 0 : gBrowser.selectedTab.userContextId,',
                                                  'relatedToCurrent,'));
      win.updateUserContextUIIndicator = win.updateUserContextUIIndicator.orig;
      win.updateUserContextUIIndicator();
      win.MozElements.MozTab.prototype.getAttribute = this.orig_getAttribute;
    });
    delete UC.multifoxContainer;
  }
}

UC.multifoxContainer.init();
