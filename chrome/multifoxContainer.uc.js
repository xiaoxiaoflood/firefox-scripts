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

    let mfcm = _uc.createElement(document, 'menupopup', {
      id: 'mf-contextmenu',
      position: 'after_start',
      onpopupshowing: 'UC.multifoxContainer.showPopup(window)',
    });
    document.getElementById('mainPopupSet').appendChild(mfcm);
    document.getElementById('userContext-icons').setAttribute('popup', 'mf-contextmenu');

    gBrowser.orig_addTab = gBrowser.addTab;
    gBrowser.addTab = function (aURI, options) {
      if ('toUserContextId' in this) {
        options.userContextId = this.toUserContextId;
        delete this.toUserContextId;
      } else if (!options.relatedToCurrent && !options.userContextId && this.selectedTab.userContextId != UC.privateTab?.container.userContextId) {
        options.userContextId = this.selectedTab.userContextId;
      }

      return gBrowser.orig_addTab.call(this, aURI, options);
    };

    let orig_updateUserContextUIIndicator = win.updateUserContextUIIndicator;
    win.updateUserContextUIIndicator = function () {
      orig_updateUserContextUIIndicator();

      if (gBrowser.selectedTab.userContextId == 0) {
        let hbox = document.getElementById('userContext-icons');
        hbox.hidden = false;
        hbox.className = 'identity-color-black';
        document.getElementById('userContext-label').value = 'Default';
        document.getElementById('userContext-indicator').className = 'identity-icon-fingerprint';
      }
    };
    win.updateUserContextUIIndicator.orig = orig_updateUserContextUIIndicator;

    if (document.readyState == 'complete')
      win.updateUserContextUIIndicator();
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
    gBrowser.toUserContextId = id;
    let tab = gBrowser.selectedTab;
    gBrowser.selectedTab = gBrowser.duplicateTab(tab);
    if (btn == 0)
      gBrowser.removeTab(tab);
  },

  init: function () {
    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
  },

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
      let gBrowser = win.gBrowser;
      doc.getElementById('mf-contextmenu').remove();
      gBrowser.addTab = gBrowser.orig_addTab;
      delete gBrowser.orig_addTab;
      win.updateUserContextUIIndicator = win.updateUserContextUIIndicator.orig;
      win.updateUserContextUIIndicator();
    });
    delete UC.multifoxContainer;
  }
}

UC.multifoxContainer.init();
