// ==UserScript==
// @name            Open in Unloaded Tab
// @author          xiaoxiaoflood
// @include         main
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @startup         UC.openInUnloadedTab.exec(win);
// @shutdown        UC.openInUnloadedTab.destroy();
// @onlyonce
// ==/UserScript==

// based on https://addons.mozilla.org/en-US/firefox/addon/open-link-in-silent-tab/

const {
  BrowserWindowTracker,
  PlacesUtils
} = window;

UC.openInUnloadedTab = {
  useLinkAsTabTitle: true, // if Fx can't retrieve title from history or bookmarks (so you never visited the link), should the new tab title be the text link or the url?

  exec: function (win) {
    let {document} = win;

    let openAll = document.getElementById('placesContext_openContainer:tabs');
    let openAllUnloaded = _uc.createElement(document, 'menuitem', {
      id: 'openAllUnloaded',
      label: 'Open All in Unloaded Tabs',
      accesskey: 'u',
      disabled: 'true',
      hidden: 'true',
      oncommand: 'let view = PlacesUIUtils.getViewForNode(PlacesUIUtils.lastContextMenuTriggerNode); UC.openInUnloadedTab.openTabs(window, view.selectedNode || view.selectedNodes || view.result.root);',
    });
    openAll.insertAdjacentElement('beforebegin', openAllUnloaded);

    let openAllLinks = document.getElementById('placesContext_openLinks:tabs');
    let openAllLinksUnloaded = _uc.createElement(document, 'menuitem', {
      id: 'openAllLinksUnloaded',
      label: 'Open All in Unloaded Tabs',
      accesskey: 'u',
      disabled: 'true',
      hidden: 'true',
      oncommand: 'let view = PlacesUIUtils.getViewForNode(PlacesUIUtils.lastContextMenuTriggerNode); UC.openInUnloadedTab.openTabs(window, view.selectedNode || view.selectedNodes || view.result.root);',
    });
    openAllLinks.insertAdjacentElement('afterend', openAllLinksUnloaded);

    let openTab = document.getElementById('placesContext_openContainer:tabs');
    let openUnloaded = _uc.createElement(document, 'menuitem', {
      id: 'openUnloaded',
      label: 'Open in a New Unloaded Tab',
      accesskey: 'u',
      disabled: 'true',
      hidden: 'true',
      oncommand: 'let view = PlacesUIUtils.getViewForNode(PlacesUIUtils.lastContextMenuTriggerNode); UC.openInUnloadedTab.openTab(window, view.selectedNode.uri);',
    });
    openTab.insertAdjacentElement('beforebegin', openUnloaded);

    document.getElementById('placesContext').addEventListener('popupshowing', this.placesContext);

    if (win.location.href != _uc.BROWSERCHROME)
      return;

    let menuitem = _uc.createElement(document, 'menuitem', {
          id: 'openLinkInUnloadedTab',
          label: 'Open Link in Unloaded Tab',
          hidden: true
        });
    menuitem.addEventListener('command', () => this.openTab(win, win.gContextMenu.linkURL, win.gContextMenu.linkTextStr, true));

    let contextMenu = document.getElementById('contentAreaContextMenu');
    document.getElementById('context-openlinkinusercontext-menu').insertAdjacentElement('beforebegin', menuitem);
    contextMenu.addEventListener('popupshowing', this.contentContext);
    contextMenu.addEventListener('popuphidden', this.hideContext);
  },

  openTab: async function (win, url, linkText, relatedToCurrent = false) {
    if (!win.gBrowser)
      win = BrowserWindowTracker.getTopWindow();
    let {gBrowser} = win;
    let tab = gBrowser.addTab(null, {
      triggeringPrincipal: gBrowser.selectedBrowser.contentPrincipal,
      relatedToCurrent
    });
    let uri = Services.io.newURI(url);
    const { QUERY_TYPE_BOOKMARKS, QUERY_TYPE_HISTORY } = Ci.nsINavHistoryQueryOptions;
    let info = this.getInfoFromHistory(uri, QUERY_TYPE_HISTORY) || this.getInfoFromHistory(uri, QUERY_TYPE_BOOKMARKS);

    win.SessionStore.setTabState(tab, {
      entries: [{ url: url,
                  title: info?.title || (this.useLinkAsTabTitle && linkText),
                  triggeringPrincipal_base64: win.E10SUtils.serializePrincipal(gBrowser.selectedBrowser.contentPrincipal) }],
      lastAccessed: tab.lastAccessed,
    });

    let iconURL;
    let isReady = false;

    PlacesUtils.favicons.getFaviconURLForPage(uri, async function (url) {
      if (!url)
        return
      let blob = await fetch(url.spec).then(r => r.blob());
      let reader = new FileReader();
      reader.onloadend = function () {
        iconURL = reader.result;
        UC.openInUnloadedTab.maybeSetIcon(tab, iconURL, isReady);
      }
      reader.readAsDataURL(blob);
    })

    tab.addEventListener('SSTabRestoring', function () {
      isReady = true;
      UC.openInUnloadedTab.maybeSetIcon(tab, iconURL, isReady);
    }, { once: true });
  },

  openTabs: function (win, nodes) {
    if (!win.gBrowser)
      win = BrowserWindowTracker.getTopWindow();
    let {gBrowser} = win;
    if (PlacesUtils.nodeIsContainer(nodes))
      nodes = PlacesUtils.getURLsForContainerNode(nodes);
    nodes.forEach(node => this.openTab(win, node.uri));
  },

  maybeSetIcon: function (tab, iconURL, isReady) {
    if (iconURL && isReady)
      tab.ownerGlobal.gBrowser.setIcon(tab, iconURL, null);
  },

  contentContext: function (e) {
    let win = e.view;
    let {gContextMenu} = win;
    gContextMenu.showItem('openLinkInUnloadedTab', gContextMenu.onSaveableLink || gContextMenu.onPlainTextLink);
  },

  hideContext: function (e) {
    if (e.target == this)
      e.view.document.getElementById('openLinkInUnloadedTab').hidden = true;
  },

  placesContext: function (e) {
    let win = e.view;
    let {document} = win;
    let browserWindow = BrowserWindowTracker.getTopWindow();
    document.getElementById('openAllUnloaded').disabled = !browserWindow || document.getElementById('placesContext_openBookmarkContainer:tabs').disabled;
    document.getElementById('openAllUnloaded').hidden = !browserWindow || document.getElementById('placesContext_openBookmarkContainer:tabs').hidden;
    document.getElementById('openAllLinksUnloaded').disabled = !browserWindow || document.getElementById('placesContext_openLinks:tabs').disabled;
    document.getElementById('openAllLinksUnloaded').hidden = !browserWindow || document.getElementById('placesContext_openLinks:tabs').hidden;
    document.getElementById('openUnloaded').disabled = !browserWindow || document.getElementById('placesContext_open:newtab').disabled;
    document.getElementById('openUnloaded').hidden = !browserWindow || document.getElementById('placesContext_open:newtab').hidden;
  },

  getInfoFromHistory: function (aURI, aQueryType) {
    let options = PlacesUtils.history.getNewQueryOptions();
    options.queryType = aQueryType;
    options.maxResults = 1;

    let query = PlacesUtils.history.getNewQuery();
    query.uri = aURI;

    let result = PlacesUtils.history.executeQuery(query, options);
    let root = result.root;
    root.containerOpen = true;

    if (!root.childCount) {
      root.containerOpen = false;
      return null;
    }

    let child = root.getChild(0);
    root.containerOpen = false;

    return {
      title: child.title,
      icon: child.icon
    };
  },

  destroy: function () {
    _uc.windows(doc => {
      if (!doc.getElementById('openAllUnloaded'))
        return;
      doc.getElementById('openAllUnloaded').remove();
      doc.getElementById('openAllLinksUnloaded').remove();
      doc.getElementById('openUnloaded').remove();
      doc.getElementById('placesContext').removeEventListener('popupshowing', this.placesContext);
      doc.getElementById('openLinkInUnloadedTab')?.remove();
      doc.getElementById('contentAreaContextMenu')?.removeEventListener('popupshowing', this.contentContext);
      doc.getElementById('contentAreaContextMenu')?.removeEventListener('popuphidden', this.hideContext);
    }, false);

    delete UC.openInUnloadedTab;
  }
}
