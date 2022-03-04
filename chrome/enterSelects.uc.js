// ==UserScript==
// @name            Enter Selects
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.enterSelects.exec(win);
// @shutdown        UC.enterSelects.destroy();
// @onlyonce
// ==/UserScript==

// inspired by: https://web.archive.org/web/20171129174355/https://addons.mozilla.org/en-US/firefox/addon/enter-selects/

UC.enterSelects = {
  AUTOSELECT_WITH_SPACE: false,

  init: function () {
    this.orig_receiveResults = this.controller.receiveResults;
    this.controller.receiveResults = function (queryContext) {
      let result = UC.enterSelects.orig_receiveResults.call(this, queryContext);
      let gURLBar = this.browserWindow.gURLBar;
      if (UC.enterSelects.shouldSelect(gURLBar, queryContext))
        gURLBar.view._selectElement(gURLBar.view._rows.children[1], { updateInput: false });

      return result;
    };

    xPref.lock('browser.urlbar.autoFill', false);
    xPref.lock('browser.urlbar.showSearchSuggestionsFirst', false);
  },

  exec: function (win) {
    let observe = () => {
      win.gURLBar.textbox.addEventListener('keydown', this.keyD, true);
      Services.obs.removeObserver(observe, 'browser-window-before-show');
    }
    Services.obs.addObserver(observe, 'browser-window-before-show');
  },

  controller: ChromeUtils.import('resource:///modules/UrlbarController.jsm').UrlbarController.prototype,

  shouldSelect: function (gURLBar, queryContext) {
    if (gURLBar.searchMode?.engineName || queryContext.results.length < 2 || gURLBar.view.selectedRowIndex > 0)
      return false;

    let search = gURLBar.value.trim();

    try {
      // Test if is URL
      return !Services.eTLD.getBaseDomainFromHost(search);
    } catch (ex) {}

    if (!this.AUTOSELECT_WITH_SPACE && /\s/.test(search))
      return false;

    // Test about:about, chrome://blabla ... 
    if (/[a-zA-Z][\w-]*:(\/\/)?[\w-]+/.test(search))
      return false;

    // Check if the first word is a keyword (search or bookmark) or search suggestion (if enabled and there is no result)
    if (!!queryContext.results[0].payload.keyword || !queryContext.results[1].payload.displayUrl)
      return false;

    return true;
  },
  keyD: function (e) {
    let gURLBar = e.view.gURLBar;
    if (e.keyCode == e.DOM_VK_TAB) {
      let url = gURLBar.view._queryContext.results[1].payload.url;
      if (gURLBar.view.selectedRowIndex == 1 &&
          gURLBar.value != url &&
          new RegExp(/^(https?:\/\/(www\.)?)?/.source + gURLBar.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).test(url) &&
          gURLBar.value != url.match(/(\w*:\/\/)?[^/]+\//)[0]) {
        gURLBar.inputField.value = gURLBar._untrimmedValue = gURLBar._trimValue(url.match(/(\w*:\/\/)?[^/]+\//)[0] + '/').slice(0, -1);
        gURLBar.view.close();
        e.preventDefault();
        e.stopPropagation();
      } else if (gURLBar.view.selectedRowIndex == -1) {
        gURLBar.view.selectedRowIndex = 1;
        gURLBar.value = url;
        e.preventDefault();
        e.stopPropagation();
      } else if (gURLBar.view.selectedRowIndex == 1 && gURLBar.value != url) {
        gURLBar.value = url;
        e.preventDefault();
        e.stopPropagation();
      }
    }
  },

  destroy: function () {
    xPref.unlock('browser.urlbar.autoFill');
    xPref.unlock('browser.urlbar.showSearchSuggestionsFirst');
    _uc.windows((doc, win) => {
      this.controller.receiveResults = this.orig_receiveResults;
      win.gURLBar.textbox.removeEventListener('keydown', this.keyD, true);
    });
    delete UC.enterSelects;
  }
}

UC.enterSelects.init();
