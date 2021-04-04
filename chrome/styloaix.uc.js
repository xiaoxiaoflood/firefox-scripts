// ==UserScript==
// @name            StyloaiX
// @author          xiaoxiaoflood
// @include         main
// @shutdown        UC.styloaix.destroy();
// @onlyonce
// ==/UserScript==

// inspired by legacy Stylish and https://github.com/Endor8/userChrome.js/blob/master/Updates%202019/UserCSSLoader.uc.js
// editor forked from Stylish - minor changes to edit.xhtml, but edit.js almost completely rewritten, with improvements and bug fixes.
// icon from old Stylish

// search for "userChromeJS.styloaix" in about:config to change settings.

(function () {

  UC.styloaix = {
    init: function () {
      xPref.lock(this.PREF_MOZDOCUMENT, true);
      xPref.set(this.PREF_DISABLED, false, true);
      xPref.set(this.PREF_STYLESDISABLED, '[]', true);
      xPref.set(this.PREF_INSTANTCHECK, true, true);
      xPref.set(this.PREF_INSTANTPREVIEW, true, true);
      xPref.set(this.PREF_INSTANTINTERVAL, 500, true);
      xPref.set(this.PREF_LINEWRAPPING, true, true);
      xPref.set(this.PREF_OPENINWINDOW, true, true);

      this.prefListener = xPref.addListener(this.PREF_STYLESDISABLED, (sDisabled) => {
        let newSet;
        try {
          newSet = new Set(JSON.parse(sDisabled));
        } catch {
          xPref.set(this.PREF_STYLESDISABLED, JSON.stringify([...this.disabledStyles]));
          return;
        }

        this.styles.forEach(style => {
          if ((style.enabled && newSet.has(style.fullName)) ||
              (!style.enabled && !newSet.has(style.fullName)))
            this.toggleStyle(style);
        });
      });
      this.prefListenerAll = xPref.addListener(this.PREF_DISABLED, (disabled) => {
        this.toggleAll({disable: disabled});
        this.btnClasses.reverse();
        _uc.windows((doc) => {
          let enabledBtn = doc.getElementById('styloaix-enabled');
          enabledBtn.label = disabled ? 'Disabled' : 'Enabled';
          enabledBtn.setAttribute('checked', !disabled);
          doc.getElementById('styloaix-button').classList.replace(...this.btnClasses);
        });
      });

      this.disabledStyles = new DisabledSet(JSON.parse(xPref.get(this.PREF_STYLESDISABLED)).sort((a, b) => a[0].localeCompare(b[0])));

      this.UserStyle = UserStyle;

      if (!this.enabled)
        this.btnClasses.reverse();

      if (AppConstants.MOZ_APP_NAME !== 'thunderbird') {
        CustomizableUI.createWidget({
          id: 'styloaix-button',
          type: 'custom',
          defaultArea: CustomizableUI.AREA_NAVBAR,
          onBuild: (doc) => {
            return this.createButton(doc);
          }
        });
      } else {
        let btn = this.createButton(document);
        btn.setAttribute('removable', true);
        const currentSet = Services.xulStore.getValue('chrome://messenger/content/messenger.xhtml', 'mail-bar3', 'currentset').split(',');
        const position = currentSet.indexOf('styloaix-button');
        if (position !== -1)
          document.getElementById('mail-bar3').insertBefore(btn, document.getElementById(currentSet[position + 1]));
        else
          document.getElementById('mail-bar3').insertBefore(btn, document.getElementById('gloda-search'));
        this.tbButton = btn;

        this.rebuildMenu();
      }

      this.loadStyles();

      _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
    },

    createButton (doc) {
      let btn = _uc.createElement(doc, 'toolbarbutton', {
        id: 'styloaix-button',
        label: 'StyloaiX',
        tooltiptext: 'StyloaiX',
        type: 'menu',
        class: 'toolbarbutton-1 chromeclass-toolbar-additional ' + this.btnClasses[1],
        onclick: 'if (event.button === 1 && event.target.id == this.id) UC.styloaix.enabled = !UC.styloaix.enabled;'
      });

      let popup = _uc.createElement(doc, 'menupopup', {id: 'styloaix-popup'});
      btn.appendChild(popup);

      let disabled = xPref.get(this.PREF_DISABLED);
      let toggleBtn = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-enabled',
        label: disabled ? 'Disabled' : 'Enabled',
        type: 'checkbox',
        checked: !disabled,
        oncommand: 'UC.styloaix.enabled = !UC.styloaix.enabled;'
      });
      popup.appendChild(toggleBtn);
      
      let menuseparator = _uc.createElement(doc, 'menuseparator');
      popup.appendChild(menuseparator);

      let reloadAllBtn = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-reload-all',
        label: 'Reload All Styles',
        oncommand: 'UC.styloaix.toggleAll({reload: true});'
      });
      popup.appendChild(reloadAllBtn);

      let openFolderBtn = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-open-folder',
        label: 'Open folder',
        oncommand: 'UC.styloaix.CSSDIR.launch();'
      });
      popup.appendChild(openFolderBtn);

      let newStyleMenu = _uc.createElement(doc, 'menu', {
        id: 'styloaix-new-style',
        label: 'New Style'
      });

      let newStylePopup = _uc.createElement(doc, 'menupopup', {id: 'styloaix-newstyle-popup'});

      let newPageStyleBtn = _uc.createElement(doc, 'menuitem', {
        label: 'For this page',
        oncommand: 'UC.styloaix.openEditor({url: gBrowser.currentURI.specIgnoringRef, type: "url"});'
      });
      newStylePopup.appendChild(newPageStyleBtn);

      let newSiteStyleBtn = _uc.createElement(doc, 'menuitem', {
        label: 'For this site',
        oncommand: 'let host = gBrowser.currentURI.asciiHost; UC.styloaix.openEditor({url: host || gBrowser.currentURI.specIgnoringRef, type: host ? "domain" : "url"});'
      });
      newStylePopup.appendChild(newSiteStyleBtn);

      let newStyle = _uc.createElement(doc, 'menuitem', {
        label: 'Blank Style',
        oncommand: 'UC.styloaix.openEditor();'
      });
      newStylePopup.appendChild(newStyle);

      newStyleMenu.appendChild(newStylePopup);
      popup.appendChild(newStyleMenu);

      let separatorBeforeStyles = _uc.createElement(doc, 'menuseparator');
      separatorBeforeStyles.hidden = !this.styles.size;
      popup.appendChild(separatorBeforeStyles);
      btn._separator = separatorBeforeStyles;

      let stylePopup = _uc.createElement(doc, 'menupopup', {id: 'styloaix-style-context'});

      let styleEdit = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-style-edit',
        label: 'Edit',
        oncommand: 'UC.styloaix.openEditor({id: document.popupNode._style.fullName})'
      });
      stylePopup.appendChild(styleEdit);

      let styleReload = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-style-reload',
        label: 'Reload',
        oncommand: 'document.popupNode._style.reload()'
      });
      stylePopup.appendChild(styleReload);

      let styleDelete = _uc.createElement(doc, 'menuitem', {
        id: 'styloaix-style-delete',
        label: 'Delete',
        oncommand: 'document.popupNode._style.delete()'
      });
      stylePopup.appendChild(styleDelete);

      doc.getElementById('mainPopupSet').appendChild(stylePopup);

      this.styles.forEach(style => {
        this.addStyleInMenu(style, popup);
      });
      
      return btn;
    },

    get enabled () {
      return !xPref.get(this.PREF_DISABLED);
    },

    set enabled (val) {
      xPref.set(this.PREF_DISABLED, !val);
    },

    loadStyles: function() {
      let files = this.CSSDIR.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
      while (files.hasMoreElements()) {
        let file = files.getNext().QueryInterface(Ci.nsIFile);
        if (file.leafName.endsWith('.css')) {
          let style = new UserStyle(file);
        }
      }

      if (this.enabled)
        this.toggleAll({disable: false});
    },

    toggleAll: function ({disable = this.enabled, reload = false} = {}) {
      this.styles.forEach(style => {
        if (style.enabled)
          this.toggleStyle(style, {aStatus: !disable, changeStatus: false, forced: true});
      });
      if (reload) {
        this.styles = new Map();
        this.loadStyles();
        this.rebuildMenu();
      }
    },

    toggleStyle: function (style, {aStatus = !style.enabled, changeStatus = true, forced = false} = {}) {
      if (this.enabled || forced) {
        if (aStatus)
          style.register();
        else
          style.unregister();
      }
      if (changeStatus) {
        this.changeStatus(style, aStatus);
      }
    },

    changeStatus: function (style, aStatus) {
      style.enabled = aStatus;
      _uc.windows((doc) => {
        let menuitem = doc.getElementById('styloaix-popup').getElementsByAttribute('styleid', style.fullName)[0];
        menuitem.setAttribute('checked', aStatus);
      });
      if (aStatus) {
        this.disabledStyles.delete(style.fullName);
      } else {
        this.disabledStyles.add(style.fullName);
      }
    },

    addStyleInMenu (style, popup) {
      let menuitem = _uc.createElement(popup.ownerDocument, 'menuitem', {
        label: style.name,
        type: 'checkbox',
        class: 'styloaix-style' + (style.type == _uc.sss.AUTHOR_SHEET ?
                                     '' :
                                     ' styloaix-' + (style.type == _uc.sss.USER_SHEET ?
                                       'user' :
                                       'agent') + 'sheet'),
        checked: style.enabled,
        context: 'styloaix-style-context',
        oncommand: 'UC.styloaix.toggleStyle(this._style);',
        styleid: style.fullName
      });
      menuitem.addEventListener('click', function (e) {
        if (e.button == 1)
          UC.styloaix.toggleStyle(this._style);
      });
      popup.appendChild(menuitem);
      menuitem._style = style;      
    },

    rebuildMenu () {
      let buttons = this.buttons;
      if (buttons.length) {
        buttons.forEach(btn => {
          let styles = btn.getElementsByClassName('styloaix-style');
          while (styles.length) {
            styles[0].remove();
          }
        })
      }

      let sortedMap = new Map([...this.styles.entries()].sort((a, b) => a[0].localeCompare(b[0])));
      sortedMap.forEach(style => {
        buttons.forEach(btn => {
          this.addStyleInMenu(style, btn.menupopup);
        });
      });
    },

    openEditor ({id, url, type} = {}) {
      let win = Services.wm.getMostRecentBrowserWindow();
      if (xPref.get(this.PREF_OPENINWINDOW)) {
        win.openDialog(this.EDITOR_URI, (id || win.Math.random()) + ' - StyloaiX Editor', 'centerscreen,chrome,resizable,dialog=no', {id, url, type});
      } else {
        let appendUrl = '';
        if (id != undefined)
          appendUrl = '?id=' + id;
        else if (url)
          appendUrl = '?url=' + encodeURIComponent(url) + '&type=' + type;
        win.switchToTabHavingURI(this.EDITOR_URI + appendUrl, true);
      }
    },

    get CSSDIR () {
      let cssFolder = _uc.chromedir.clone();
      cssFolder.append('UserStyles');
      if (!cssFolder.exists() || !cssFolder.isDirectory())
        cssFolder.create(Ci.nsIFile.DIRECTORY_TYPE, 0664);
      Object.defineProperty(this, 'CSSDIR', { value: cssFolder });
      return cssFolder;
    },

    btnClasses: ['icon-white', 'icon-colored'],

    get buttons () {
      let arr = [];
      let widget = CustomizableUI.getWidget('styloaix-button');

      if (widget.instances.length && widget.instances[0].label) {
        widget.instances.forEach(btnWidget => {
          let btn = btnWidget.node;
          btn._separator.hidden = !this.styles.size;
          arr.push(btn);
        });
      } else if (this.tbButton) {
        arr.push(this.tbButton)
      }

      return arr;
    },

    PREF_DISABLED: 'userChromeJS.styloaix.allDisabled',
    PREF_STYLESDISABLED: 'userChromeJS.styloaix.stylesDisabled',
    PREF_INSTANTCHECK: 'userChromeJS.styloaix.instantCheck',
    PREF_INSTANTPREVIEW: 'userChromeJS.styloaix.instantPreview',
    PREF_INSTANTINTERVAL: 'userChromeJS.styloaix.instantInterval',
    PREF_OPENINWINDOW: 'userChromeJS.styloaix.openInWindow',
    PREF_LINEWRAPPING: 'userChromeJS.styloaix.lineWrapping',
    PREF_MOZDOCUMENT: 'layout.css.moz-document.content.enabled',
    EDITOR_URI: 'chrome://userchromejs/content/styloaix/edit.xhtml',
    STYLESDIR: 'resource://userchromejs/' + (_uc.scriptsDir ? _uc.scriptsDir + '/' : '') + 'UserStyles/',

    STYLE: {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}'), url('chrome://messenger/content/customizeToolbar.xhtml') {
          #styloaix-button.icon-white {
            list-style-image: url('chrome://userchromejs/content/styloaix/16w.png');
          }
          #styloaix-button.icon-colored {
            list-style-image: url('chrome://userchromejs/content/styloaix/16.png');
          }
        }
        @-moz-document url('${_uc.BROWSERCHROME}') {
          .styloaix-usersheet label:after {
            content:"US";
            color: blue;
          }
          .styloaix-agentsheet label:after {
            content:"AG";
            color: green;
          }
        }
      `)),
      type: _uc.sss.AUTHOR_SHEET
    },

    styles: new Map(),

    destroy: function () {
      xPref.unlock(this.PREF_MOZDOCUMENT);
      xPref.removeListener(this.prefListener);
      xPref.removeListener(this.prefListenerAll);
      CustomizableUI.destroyWidget('styloaix-button');
      this.tbButton?.remove();
      _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
      this.toggleAll({disable: true});
      delete UC.styloaix;
    }
  }

  class DisabledSet extends Set {
    constructor (iterable) {
      super(iterable);
    }

    add (item) {
      let cache_add = Set.prototype.add.call(this, item);
      xPref.set(UC.styloaix.PREF_STYLESDISABLED, JSON.stringify([...this]));
      return cache_add;
    }

    delete (item) {
      let cache_delete = Set.prototype.delete.call(this, item);
      xPref.set(UC.styloaix.PREF_STYLESDISABLED, JSON.stringify([...this]));
      return cache_delete;
    }
  }

  class UserStyle {
    constructor(file) {
      this.type = file.leafName.endsWith('us.css') ?
                    _uc.sss.USER_SHEET :
                  file.leafName.endsWith('as.css') ?
                    _uc.sss.AGENT_SHEET :
                    _uc.sss.AUTHOR_SHEET;
      this.file = file;
      this.fullName = file.leafName;
      this.name = file.leafName.replace(/(?:\.(?:user|as|us))?\.css$/, '');
      this.url = Services.io.newURI(UC.styloaix.STYLESDIR + file.leafName);
      this.enabled = !UC.styloaix.disabledStyles.has(this.fullName);
      UC.styloaix.styles.set(this.fullName, this);
    }
    register () {
      _uc.sss.loadAndRegisterSheet(this.url, this.type);
    }
    unregister () {
      _uc.sss.unregisterSheet(this.url, this.type);
    }
    reload () {
      if (this.enabled)
        this.unregister();
      UC.styloaix.toggleStyle(this, {aStatus: true});
    }
    delete () {
      if (Services.prompt.confirm(null, 'StyloaiX', 'Delete "' + this.fullName + '" permanently?')) {
        UC.styloaix.styles.delete(this.fullName);
        if (this.enabled)
          this.unregister();
        else
          UC.styloaix.disabledStyles.delete(this.fullName);
        UC.styloaix.rebuildMenu();
        this.file.remove(false);
      }
    }
  }

  UC.styloaix.init();

})()
