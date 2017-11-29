// ==UserScript==
// @name            Open Link in Silent Tab
// @include         main
// @startup         UC.openLinkInSilentTab.exec(win);
// @shutdown        UC.openLinkInSilentTab.destroy();
// @onlyonce
// ==/UserScript==

// original: https://addons.mozilla.org/en-US/firefox/addon/open-link-in-silent-tab/

(function () {

  UC.openLinkInSilentTab = {
    exec: function (win) {
      XPCOMUtils.defineLazyServiceGetter(win, 'gSessionStore',
                                         '@mozilla.org/browser/sessionstore;1',
                                         'nsISessionStore');
      XPCOMUtils.defineLazyServiceGetter(win, 'gHistoryService',
                                         '@mozilla.org/browser/nav-history-service;1',
                                         'nsINavHistoryService');

      var document = win.document;
      var menuitem = document.createElement('menuitem');
      menuitem.setAttribute('id', 'context-openlinkinsilent');
      menuitem.setAttribute('label', 'Open Link in Silent Tab');
      menuitem.addEventListener('command', function () {
        if (win.gContextMenu.onLink)
            UC.openLinkInSilentTab.openLinkInSilentTab(win.gBrowser.selectedTab, win.gContextMenu.linkURL);
      }, false);
      var contextMenu = document.getElementById('contentAreaContextMenu');
      contextMenu.insertBefore(menuitem, document.getElementById('context-openlinkintab').nextSibling);
      contextMenu.addEventListener('popupshowing', UC.openLinkInSilentTab.onPopupShowing, false);
    },

    openLinkInSilentTab: function (tabbrowser, url) {
      // todo: funcionar no histórico e favoritos (sidebar e library)
      var win = tabbrowser.ownerGlobal;
      var tab = win.gBrowser.addTab(null, { relatedToCurrent: true });
      var title = '',
          icon = '',
          uri = Services.io.newURI(url, null, null);
      const { QUERY_TYPE_BOOKMARKS, QUERY_TYPE_HISTORY } = Ci.nsINavHistoryQueryOptions;
      var info = this.getInfoFromHistory(uri, QUERY_TYPE_HISTORY);
      if (!info)
        info = this.getInfoFromHistory(uri, QUERY_TYPE_BOOKMARKS);

      if (info) {
        if (info.title)
          title = info.title;
        if (info.icon)
          icon = info.icon.replace(/moz-anno:favicon:/g, '');
      } else {
        try {
          var hostPort = uri.hostPort;
          var path = uri.path;
          if (path == '/') {
            path = '';
          }
          title = hostPort + path;
        } catch (ex) {}
      }

      win.gSessionStore.setTabState(tab, JSON.stringify({
        entries: [{ url: url, title: title }],
        userTypedValue: url,
        userTypedClear: 2,
        lastAccessed: tab.lastAccessed,
        index: 1,
        image: icon
      }));
    },

    onPopupShowing: function (event) {
      if (event.target != event.currentTarget) {
        return;
      }

      var document = event.view.document;
      document.getElementById('context-openlinkinsilent').hidden = document.getElementById('context-openlinkintab').hidden;
    },

    getInfoFromHistory: function (aURI, aQueryType) {
      var options = gHistoryService.getNewQueryOptions();
      options.queryType = aQueryType;
      options.maxResults = 1;

      var query = gHistoryService.getNewQuery();
      query.uri = aURI;

      var result = gHistoryService.executeQuery(query, options);
      var root = result.root;
      root.containerOpen = true;

      if (!root.childCount) {
        root.containerOpen = false;
        return null;
      }

      var child = root.getChild(0);
      root.containerOpen = false;

      return {
        title: child.title,
        icon: child.icon
      };
    },

    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        var document = win.document;
        var elm = document.getElementById('context-openlinkinsilent');
        elm.parentNode.removeChild(elm);
        document.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', UC.openLinkInSilentTab.onPopupShowing, false);
      }
      delete UC.openLinkInSilentTab;
    }
  }

})()
