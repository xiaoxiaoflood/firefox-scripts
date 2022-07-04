// ==UserScript==
// @name            PrivateTab
// @author          xiaoxiaoflood
// @include         main
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @startup         UC.privateTab.exec(win);
// @shutdown        UC.privateTab.destroy();
// @onlyonce
// ==/UserScript==

const {
  AddonManager,
  ContextualIdentityService,
  customElements,
  CustomizableUI,
  gBrowser,
  MozElements,
  PlacesUIUtils,
  PlacesUtils,
  PrivateBrowsingUtils
} = window;

UC.privateTab = {
  config: {
    neverClearData: false, // if you want to not record history but don't care about other data, maybe even want to keep private logins
    restoreTabsOnRestart: true,
    doNotClearDataUntilFxIsClosed: true,
    deleteContainerOnDisable: false,
    clearDataOnDisable: false,
  },

  openTabs: new Set(),

  exec: function (win) {
    if (win.PrivateBrowsingUtils.isWindowPrivate(win))
      return;

    let {document} = win;

    let openAll = document.getElementById('placesContext_openBookmarkContainer:tabs');
    let openAllPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openAllPrivate',
      label: 'Open All in Private Tabs',
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAll.getAttribute('oncommand'),
      onclick: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAll.getAttribute('onclick'),
    });
    openAll.insertAdjacentElement('afterend', openAllPrivate);

    let openAllLinks = document.getElementById('placesContext_openLinks:tabs');
    let openAllLinksPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openAllLinksPrivate',
      label: 'Open All in Private Tabs',
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('oncommand'),
      onclick: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('onclick'),
    });
    openAllLinks.insertAdjacentElement('afterend', openAllLinksPrivate);

    let openTab = document.getElementById('placesContext_open:newtab');
    let openPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openPrivate',
      label: 'Open in a New Private Tab',
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'let view = event.target.parentElement._view; PlacesUIUtils._openNodeIn(view.selectedNode, "tab", view.ownerWindow, false, ' + UC.privateTab.container.userContextId + ')',
    });
    openTab.insertAdjacentElement('afterend', openPrivate);

    document.getElementById('placesContext').addEventListener('popupshowing', this.placesContext);

    if (win.location.href != _uc.BROWSERCHROME)
      return;

    let {customElements, gBrowser, MozElements} = win;

    let keyset =  _uc.createElement(document, 'keyset', { id: 'privateTab-keyset' });
    document.getElementById('mainKeyset').insertAdjacentElement('afterend', keyset);

    let toggleKey = _uc.createElement(document, 'key', {
      id: 'togglePrivateTab-key',
      modifiers: 'alt control',
      key: 'T',
      oncommand: 'UC.privateTab.togglePrivate(window)',
    });
    keyset.appendChild(toggleKey);

    let newPrivateTabKey = _uc.createElement(document, 'key', {
      id: 'newPrivateTab-key',
      modifiers: 'alt control',
      key: 'P',
      oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
    });
    keyset.appendChild(newPrivateTabKey);

    let menuOpenLink = _uc.createElement(document, 'menuitem', {
      id: 'menu_newPrivateTab',
      label: 'New Private Tab',
      accesskey: 'v',
      acceltext: 'Ctrl+Alt+P',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
    });
    document.getElementById('menu_newNavigatorTab').insertAdjacentElement('afterend', menuOpenLink);

    let openLink = _uc.createElement(document, 'menuitem', {
      id: 'openLinkInPrivateTab',
      label: 'Open Link in New Private Tab',
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      hidden: true
    });

    openLink.addEventListener('command', (e) => {
      let {gContextMenu} = win;
      win.openLinkIn(gContextMenu.linkURL, 'tab', gContextMenu._openLinkInParameters({
        userContextId: UC.privateTab.container.userContextId,
        triggeringPrincipal: document.nodePrincipal,
      }));
    }, false);

    document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', this.contentContext);
    document.getElementById('contentAreaContextMenu').addEventListener('popuphidden', this.hideContext);
    document.getElementById('context-openlinkintab').insertAdjacentElement('afterend', openLink);

    let toggleTab = _uc.createElement(document, 'menuitem', {
      id: 'toggleTabPrivateState',
      label: 'Private Tab',
      type: 'checkbox',
      accesskey: 'v',
      acceltext: 'Ctrl+Alt+T',
      oncommand: 'UC.privateTab.togglePrivate(window, TabContextMenu.contextTab)',
    });
    document.getElementById('context_pinTab').insertAdjacentElement('afterend', toggleTab);
    document.getElementById('tabContextMenu').addEventListener('popupshowing', this.tabContext);

    let privateMask = document.getElementsByClassName('private-browsing-indicator')[0];
    privateMask.id = 'private-mask';

    let btn2 = _uc.createElement(document, 'toolbarbutton', {
      id: this.BTN2_ID,
      label: 'New Private Tab',
      tooltiptext: 'Open a new private tab (Ctrl+Alt+P)',
      class: 'toolbarbutton-1 chromeclass-toolbar-additional',
    });

    btn2.addEventListener('click', function (e) {
      if (e.button == 0) {
        UC.privateTab.BrowserOpenTabPrivate(win);
      } else if (e.button == 2) {
        document.getElementById('toolbar-context-menu').openPopup(this, 'after_start', 14, -10, false, false);
        //document.getElementsByClassName('customize-context-removeFromToolbar')[0].disabled = false;
        //document.getElementsByClassName('customize-context-moveToPanel')[0].disabled = false;
        e.preventDefault();
      }
    });

    document.getElementById('tabs-newtab-button').insertAdjacentElement('afterend', btn2);

    gBrowser.tabContainer.addEventListener('TabSelect', this.onTabSelect);

    gBrowser.privateListener = (e) => {
      let browser = e.target;
      let tab = gBrowser.getTabForBrowser(browser);
      if (!tab)
        return;
      let isPrivate = this.isPrivate(tab);
    
      if (!isPrivate) {
        if (this.observePrivateTabs) {
          this.openTabs.delete(tab);
          if (!this.openTabs.size)
            this.clearData();
        }
        return;
      }

      if (this.observePrivateTabs)
        this.openTabs.add(tab)

      browser.browsingContext.useGlobalHistory = false;
    }

    win.addEventListener('XULFrameLoaderCreated', gBrowser.privateListener);

    if(this.observePrivateTabs)
      gBrowser.tabContainer.addEventListener('TabClose', this.onTabClose);

    MozElements.MozTab.prototype.getAttribute = function (att) {
      if (att == 'usercontextid' && this.isToggling) {
        delete this.isToggling;
        return UC.privateTab.orig_getAttribute.call(this, att) ==
               UC.privateTab.container.userContextId ? 0 : UC.privateTab.container.userContextId;
      } else {
        return UC.privateTab.orig_getAttribute.call(this, att);
      }
    };

    customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility = function () {
      let wrap = n =>
        n.parentNode.localName == "toolbarpaletteitem" ? n.parentNode : n;
      let unwrap = n =>
        n && n.localName == "toolbarpaletteitem" ? n.firstElementChild : n;

      let newTabFirst = false;
      let sibling = (id, otherId) => {
        let sib = this;
        do {
          if (sib.id == "new-tab-button")
            newTabFirst = true;
          sib = unwrap(wrap(sib).nextElementSibling);
        } while (sib && (sib.hidden || sib.id == "alltabs-button" || sib.id == otherId));
        return sib?.id == id && sib;
      }

      const kAttr = "hasadjacentnewtabbutton";
      let adjacentNetTab = sibling("new-tab-button", UC.privateTab.BTN_ID);
      if (adjacentNetTab) {
        this.setAttribute(kAttr, "true");
      } else {
        this.removeAttribute(kAttr);
      }

      const kAttr2 = "hasadjacentnewprivatetabbutton";
      let adjacentPrivateTab = sibling(UC.privateTab.BTN_ID, "new-tab-button");
      if (adjacentPrivateTab) {
        this.setAttribute(kAttr2, "true");
      } else {
        this.removeAttribute(kAttr2);
      }

      if (adjacentNetTab && adjacentPrivateTab) {
        let doc = adjacentPrivateTab.ownerDocument;
        if (newTabFirst)
          doc.getElementById('tabs-newtab-button').insertAdjacentElement('afterend', doc.getElementById(UC.privateTab.BTN2_ID));
        else
          doc.getElementById(UC.privateTab.BTN2_ID).insertAdjacentElement('afterend', doc.getElementById('tabs-newtab-button'));
      }
    };
  },

  init: function () {
    ContextualIdentityService.ensureDataReady();
    this.container = ContextualIdentityService._identities.find(container => container.name == 'Private');
    if (!this.container) {
      ContextualIdentityService.create('Private', 'fingerprint', 'purple');
      this.container = ContextualIdentityService._identities.find(container => container.name == 'Private');
    } else if (!this.config.neverClearData) {
      this.clearData();
    }

    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

    ChromeUtils.import('resource:///modules/sessionstore/TabStateFlusher.jsm', this);
    ChromeUtils.import('resource:///modules/sessionstore/TabStateCache.jsm', this);

    let { gSeenWidgets } = Cu.import('resource:///modules/CustomizableUI.jsm');
    let firstRun = !gSeenWidgets.has(this.BTN_ID);

    if (firstRun) {
      let listener = {
        onWidgetAfterCreation: function (id) {
          if (id == UC.privateTab.BTN_ID) {
            setTimeout(() => {
              let newTabPlacement = CustomizableUI.getPlacementOfWidget('new-tab-button')?.position;
              if (newTabPlacement && Services.wm.getMostRecentBrowserWindow().gBrowser.tabContainer.hasAttribute('hasadjacentnewtabbutton'))
                CustomizableUI.addWidgetToArea(UC.privateTab.BTN_ID, CustomizableUI.AREA_TABSTRIP, newTabPlacement + 1);
            }, 0);
            CustomizableUI.removeListener(this);
          }
        }
      }
      CustomizableUI.addListener(listener);
    }

    CustomizableUI.createWidget({
      id: UC.privateTab.BTN_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      showInPrivateBrowsing: false,
      onBuild: (doc) => {
        let btn = _uc.createElement(doc, 'toolbarbutton', {
          id: UC.privateTab.BTN_ID,
          label: 'New Private Tab',
          tooltiptext: 'Open a new private tab (Ctrl+Alt+P)',
          class: 'toolbarbutton-1 chromeclass-toolbar-additional',
          oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
        });

        return btn;
      }
    });

    let { getBrowserWindow } = Cu.import('resource:///modules/PlacesUIUtils.jsm');
    eval('PlacesUIUtils.openTabset = function ' +
          PlacesUIUtils.openTabset.toString().replace(/(\s+)(inBackground: loadInBackground,)/,
                                                      '$1$2$1userContextId: aEvent.userContextId || 0,')
                                             .replace(/\blazy\./g, ''));
                                                      
    eval('PlacesUIUtils._openNodeIn = ' +
          PlacesUIUtils._openNodeIn.toString().replace(/(\s+)(aPrivate = false)\n/,
                                                       '$1$2,$1userContextId = 0\n')
                                              .replace(/(\s+)(private: aPrivate,)\n/,
                                                       '$1$2$1userContextId,\n')
                                              .replace(/\blazy\./g, ''));

    let { UUIDMap } = Cu.import('resource://gre/modules/Extension.jsm');
    let TST_ID = 'treestyletab@piro.sakura.ne.jp';
    this.TST_UUID = UUIDMap.get(TST_ID, false);//null se nao tiver

    if (this.TST_UUID)
      this.setTstStyle(this.TST_UUID);
    AddonManager.addAddonListener({
      onInstalled: addon => {
        if (addon.id == TST_ID)
          this.setTstStyle(UUIDMap.get(TST_ID, false));
      },
      onUninstalled: addon => {
        if (addon.id == TST_ID)
          _uc.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
      }
    });

    if (!this.config.neverClearData) {
      let observe = () => {
        this.clearData();
        if (!this.config.restoreTabsOnRestart)
          this.closeTabs();
      }
      Services.obs.addObserver(observe, 'quit-application-granted');
    }
  },

  clearData: function () {
    Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId: this.container.userContextId });
  },

  closeTabs: function () {
    ContextualIdentityService._forEachContainerTab((tab, tabbrowser) => {
      if (tab.userContextId == this.container.userContextId)
        tabbrowser.removeTab(tab);
    });
  },

  togglePrivate: function (win, tab = win.gBrowser.selectedTab) {
    let {gBrowser} = win;
    tab.isToggling = true;
    let shouldSelect = tab == win.gBrowser.selectedTab;
    let newTab = gBrowser.duplicateTab(tab);
    let newBrowser = newTab.linkedBrowser;
    this.TabStateFlusher.flush(newBrowser).then(() => {
      this.TabStateCache.update(newBrowser.permanentKey, {
        userContextId: newTab.userContextId
      });
    });
    if (shouldSelect) {
      let gURLBar = win.gURLBar;
      let focusUrlbar = gURLBar.focused;
      gBrowser.selectedTab = newTab;
      if (focusUrlbar)
        gURLBar.focus();
    }
    gBrowser.removeTab(tab);
  },

  toggleMask: function (win) {
    let {gBrowser} = win;
    let privateMask = win.document.getElementById('private-mask');
    if (gBrowser.selectedTab.isToggling)
      privateMask.setAttribute('enabled', gBrowser.selectedTab.userContextId == this.container.userContextId ? 'false' : 'true');
    else
      privateMask.setAttribute('enabled', gBrowser.selectedTab.userContextId == this.container.userContextId ? 'true' : 'false');
  },

  BrowserOpenTabPrivate: function (win) {
    win.openTrustedLinkIn(win.BROWSER_NEW_TAB_URL, 'tab', {
      userContextId: this.container.userContextId,
    });
  },

  isPrivate: function (tab) {
    return tab.getAttribute('usercontextid') == this.container.userContextId;
  },

  contentContext: function (e) {
    let win = e.view;
    let gContextMenu = win.gContextMenu;
    let tab = win.gBrowser.getTabForBrowser(gContextMenu.browser);
    gContextMenu.showItem('openLinkInPrivateTab', gContextMenu.onSaveableLink || gContextMenu.onPlainTextLink);
    let isPrivate = UC.privateTab.isPrivate(tab);
    if (isPrivate)
      gContextMenu.showItem('context-openlinkincontainertab', false);
  },

  hideContext: function (e) {
    if (e.target == this)
      e.view.document.getElementById('openLinkInPrivateTab').hidden = true;
  },

  tabContext: function (e) {
    let win = e.view;
    win.document.getElementById('toggleTabPrivateState').setAttribute('checked', win.TabContextMenu.contextTab.userContextId == UC.privateTab.container.userContextId);
  },

  placesContext: function (e) {
    let win = e.view;
    let {document} = win;
    document.getElementById('openPrivate').disabled = document.getElementById('placesContext_open:newtab').disabled;
    document.getElementById('openPrivate').hidden = document.getElementById('placesContext_open:newtab').hidden;
    document.getElementById('openAllPrivate').disabled = document.getElementById('placesContext_openBookmarkContainer:tabs').disabled;
    document.getElementById('openAllPrivate').hidden = document.getElementById('placesContext_openBookmarkContainer:tabs').hidden;
    document.getElementById('openAllLinksPrivate').disabled = document.getElementById('placesContext_openLinks:tabs').disabled;
    document.getElementById('openAllLinksPrivate').hidden = document.getElementById('placesContext_openLinks:tabs').hidden;
  },

  onTabSelect: function (e) {
    let tab = e.target;
    let win = tab.ownerGlobal;
    let prevTab = e.detail.previousTab;
    if (tab.userContextId != prevTab.userContextId)
      UC.privateTab.toggleMask(win);
  },

  onTabClose: function (e) {
    let tab = e.target;
    if (UC.privateTab.isPrivate(tab)) {
      UC.privateTab.openTabs.delete(tab);
      if (!UC.privateTab.openTabs.size)
        UC.privateTab.clearData();
    }
  },

  get observePrivateTabs() {
    return this.observePrivateTabs = !this.config.neverClearData && !this.config.doNotClearDataUntilFxIsClosed;
  },

  orig_getAttribute: MozElements.MozTab.prototype.getAttribute,
  orig_allTabs: Object.getOwnPropertyDescriptor(Object.getPrototypeOf(gBrowser.tabContainer), 'allTabs').get,
  orig_insertBefore: customElements.get('tabbrowser-tabs').prototype.insertBefore,
  orig__updateNewTabVisibility: customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility,
  orig_openTabset: PlacesUIUtils.openTabset,
  orig__openNodeIn: PlacesUIUtils._openNodeIn,

  BTN_ID: 'privateTab-button',
  BTN2_ID: 'newPrivateTab-button',

  setStyle: function () {
    this.STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}'), url-prefix('chrome://browser/content/places/') {
          #private-mask[enabled="true"] {
            display: block !important;
          }

          .privatetab-icon {
            list-style-image: url(chrome://browser/skin/privatebrowsing/favicon.svg) !important;
          }

          #${UC.privateTab.BTN_ID}, #${UC.privateTab.BTN2_ID} {
            list-style-image: url(chrome://browser/skin/privateBrowsing.svg);
          }

          #tabbrowser-tabs[hasadjacentnewprivatetabbutton]:not([overflow="true"]) ~ #${UC.privateTab.BTN_ID},
          #tabbrowser-tabs[overflow="true"] > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${UC.privateTab.BTN2_ID},
          #tabbrowser-tabs:not([hasadjacentnewprivatetabbutton]) > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${UC.privateTab.BTN2_ID},
          #TabsToolbar[customizing="true"] #${UC.privateTab.BTN2_ID} {
            display: none;
          }

          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"] .tab-label {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"][pinned] .tab-icon-image,
          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"][pinned] .tab-throbber {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },

  setTstStyle: function (uuid) {
    this.TST_STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document  url-prefix(moz-extension://${uuid}/sidebar/sidebar.html) {
          .tab.contextual-identity-firefox-container-${UC.privateTab.container.userContextId} .label-content {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tab.contextual-identity-firefox-container-${UC.privateTab.container.userContextId} tab-favicon {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    };
    _uc.sss.loadAndRegisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
  },

  destroy: function () {
    const {
      ContextualIdentityService,
      CustomizableUI,
      PlacesUIUtils
    } = Services.wm.getMostRecentBrowserWindow();

    if (this.config.deleteContainerOnDisable)
      ContextualIdentityService.remove(this.container.userContextId);
    else if (this.config.clearDataOnDisable)
      Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId: this.container.userContextId });

    this.openTabs.forEach(tab => tab.ownerGlobal.gBrowser.removeTab(tab));

    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
    if (this.TST_STYLE)
      _uc.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);

    _uc.windows((doc, win) => {
      if (!doc.getElementById('openAllPrivate'))
        return;
      doc.getElementById('openAllPrivate').remove();
      doc.getElementById('openAllLinksPrivate').remove();
      doc.getElementById('openPrivate').remove();
      doc.getElementById('placesContext').removeEventListener('popupshowing', this.placesContext);
      let {gBrowser} = win;
      if (!gBrowser)
        return;
      doc.getElementById('privateTab-keyset').remove();
      doc.getElementById('menu_newPrivateTab').remove();
      doc.getElementById('openLinkInPrivateTab').remove();
      doc.getElementById('toggleTabPrivateState').remove();
      doc.getElementById(this.BTN2_ID).remove();
      gBrowser.tabContainer.removeEventListener('TabSelect', this.onTabSelect);
      gBrowser.tabContainer.removeEventListener('TabClose', this.onTabClose);
      win.addEventListener('XULFrameLoaderCreated', gBrowser.privateListener);
      doc.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', this.contentContext);
      doc.getElementById('contentAreaContextMenu').removeEventListener('popuphidden', this.hideContext);
      doc.getElementById('tabContextMenu').removeEventListener('popupshowing', this.tabContext);
      win.MozElements.MozTab.prototype.getAttribute = this.orig_getAttribute;
      win.Object.defineProperty(gBrowser.tabContainer, 'allTabs', {
        get: (this.orig_allTabs),
        configurable: true
      });
      win.customElements.get('tabbrowser-tabs').prototype.insertBefore = this.orig_insertBefore;
      win.customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility = this.orig__updateNewTabVisibility;
      gBrowser.tabContainer.removeAttribute('hasadjacentnewprivatetabbutton');
      doc.getElementById('private-mask').removeAttribute('enabled');
      doc.getElementById('private-mask').removeAttribute('id');
    }, false);

    CustomizableUI.destroyWidget(this.BTN_ID);

    PlacesUIUtils.openTabset = this.orig_openTabset;
    PlacesUIUtils._openNodeIn = this.orig__openNodeIn;

    delete UC.privateTab;
  }
}

UC.privateTab.init();
