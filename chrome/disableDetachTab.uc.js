// ==UserScript==
// @name            Disable Detach Tab
// @include         main
// @startup         UC.patchForBug487263_489729.exec(win);
// @shutdown        UC.patchForBug487263_489729.destroy();
// @onlyonce
// ==/UserScript==

// original: https://github.com/alice0775/userChrome.js/blob/master/patchForBug487263_489729.uc.js

(function () {

  UC.patchForBug487263_489729 = {
    exec: function (win) {
      var gBrowser = win.gBrowser;
      gBrowser.tabContainer.addEventListener('dragend', UC.patchForBug487263_489729.dragend, true);

      if ('treeStyleTab' in gBrowser) {
        gBrowser.treeStyleTab.tabbarDNDObserver.onTabDragEnd = function TabbarDND_onTabDragEnd (aEvent) {
          gBrowser.treeStyleTab.tabbarDNDObserver.clearDropPosition(true);
          gBrowser.treeStyleTab.tabbarDNDObserver.collapseAutoExpandedTabs();
        }
      }
    },

    dragend: function (event) {
      var dt = event.dataTransfer;
      if (dt.mozTypesAt(0)[0] == TAB_DROP_TYPE) { // tab copy or move
        var draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
        // our drop then
        if (draggedTab) {
          gBrowser.tabContainer._finishAnimateTabMove();
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },

    orig: gBrowser.treeStyleTab.tabbarDNDObserver.onTabDragEnd.toString(),
    
    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.gBrowser.tabContainer.removeEventListener('dragend', UC.patchForBug487263_489729.dragend, true);
        win.eval('gBrowser.treeStyleTab.tabbarDNDObserver.onTabDragEnd = ' +
             UC.patchForBug487263_489729.orig);
      }
      delete UC.patchForBug487263_489729;
    }
  }

})()
