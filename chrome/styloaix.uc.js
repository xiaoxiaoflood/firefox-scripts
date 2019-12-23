// ==UserScript==
// @name            StyloaiX
// @include         main
// @startup         UC.styloaix.exec(win);
// @shutdown        UC.styloaix.destroy();
// @onlyonce
// ==/UserScript==

// inspired by legacy Stylish and https://github.com/Endor8/userChrome.js/blob/master/Updates%202019/UserCSSLoader.uc.js

/*
as for now, this script is recommended just as userChrome.css replacement. For better management of userstyles for sites I recommend (and I'm using) Stylus.

*** to do (to recover Stylish features and to not need Stylish anymore) ***
- allow to update remote styles (when set to manual, provide option to ignore specific available updates [by checksum or lastmodified])
- right click menu per style to: edit, reload, check for update (for remote styles), auto install updates [checkbox] and delete;
- add new style;
- own editor;
- "find styles for this site"
- agent_sheet
- allow subfolders
- ==UserStyle== (.user.css) compatibility
- allow to install from userstyles.org and freestyler.ws
- options popup:
  - use own editor or external editor;
  - allow to specify external editor other than view_source.editor.path;
  - open own editor in window or tab
  - interval to check for updates
*/

(function () {

  UC.styloaix = {
    init: function() {
      xPref.lock(this.PREF_MOZDOCUMENT, true);
      xPref.set(this.PREF_DISABLED, false, true);
      xPref.set(this.PREF_STYLESDISABLED, '', true);
      this.prefListener = xPref.addListener(this.PREF_STYLESDISABLED, (sDisabled) => {
        let listDisabled = sDisabled.split('|');
        this.styles.forEach(style => {
          if ( (style.enabled && listDisabled.includes(style.name)) ||
               (!style.enabled && !listDisabled.includes(style.name)) )
             UC.styloaix.toggleStyle(style, {byPref: true});
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

      if (!this.enabled)
        this.btnClasses.reverse();

      this.loadStyles();

      CustomizableUI.createWidget({
        id: 'styloaix-button',
        type: 'custom',
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: (doc) => {
          let btn = _uc.createElement(doc, 'toolbarbutton', {
            id: 'styloaix-button',
            label: 'StyloaiX',
            tooltiptext: 'StyloaiX',
            type: 'menu',
            class: 'toolbarbutton-1 chromeclass-toolbar-additional ' + this.btnClasses[1],
            onclick: 'if (event.button === 1 && event.target.id == this.id) UC.styloaix.enabled = !UC.styloaix.enabled;'
          });

          let popup = _uc.createElement(doc, 'menupopup', {id: 'styloaix-popup'});
          popup.addEventListener('popupshowing', this.populateMenu);
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

          let openFolderBtn = _uc.createElement(doc, 'menuitem', {
            id: 'styloaix-open-folder',
            label: 'Open folder',
            oncommand: 'UC.styloaix.CSSDIR.launch();'
          });
          popup.appendChild(openFolderBtn);

          let reloadAllBtn = _uc.createElement(doc, 'menuitem', {
            id: 'styloaix-reload-all',
            label: 'Reload Styles',
            oncommand: 'UC.styloaix.toggleAll({reload: true});'
          });
          popup.appendChild(reloadAllBtn);

          popup.appendChild(menuseparator.cloneNode());

          this.styles.forEach(style => {
            this.addStyleInMenu(style, popup);
          });

          return btn;
        }
      });

      this.toggleStyle(this.STYLE, {aStatus: true, changeStatus: false, forced: true});
    },

    exec: function (win) {
    },

    get enabled () {
      return !xPref.get(this.PREF_DISABLED);
    },

    set enabled (val) {
      xPref.set(this.PREF_DISABLED, !val);
    },

    loadStyles: function() {
      // remove scripts from button to avoid duplicates
      let buttons = this.buttons;
      if (buttons.length) {
        buttons.forEach(btn => {
          let styles = btn.getElementsByClassName('styloaix-style');
          while (styles.length) {
            styles[0].remove();
          }
        })
      }

      let files = this.CSSDIR.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
      while (files.hasMoreElements()) {
        let file = files.getNext().QueryInterface(Ci.nsIFile);
        if (file.leafName.endsWith('.css')) {
          let style = new UserStyle(file);
          buttons.forEach(btn => {
            this.addStyleInMenu(style, btn.menupopup);
          });
        }
      }
    },

    toggleAll: function ({disable = this.enabled, reload = false} = {}) {
      this.styles.forEach(style => {
        if (style.enabled)
          this.toggleStyle(style, {aStatus: !disable, changeStatus: false, forced: true});
      });
      if (reload) {
        this.styles = [];
        this.loadStyles();
      }
    },

    toggleStyle: function (style, {aStatus = !style.enabled, changeStatus = true, forced = false, byPref = false} = {}) {
      if (this.enabled || forced) {
        let method = aStatus ? 'loadAndRegisterSheet' : 'unregisterSheet';
        _uc.sss[method](style.url, style.type);
      }
      if (changeStatus) {
        this.changeStatus(style, aStatus, byPref);
      }
    },

    changeStatus: function (style, aStatus, byPref = false) {
      style.enabled = aStatus;
      _uc.windows((doc) => {
        let menuitem = doc.getElementById('styloaix-popup').getElementsByAttribute('styleid', style.id)[0];
        menuitem.setAttribute('checked', aStatus);
      });
      if (!byPref) {
        if (aStatus) {
          xPref.set(this.PREF_STYLESDISABLED, this.disabledStyles.replace(new RegExp('^' + style.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\||$)|\\\|' + style.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|\\|)'), '$1'));
        } else {
          xPref.set(this.PREF_STYLESDISABLED, (this.disabledStyles.length ? this.disabledStyles + '|' : '') + style.name);
        }
      }
    },

    addStyleInMenu (style, popup) {
        let menuitem = _uc.createElement(popup.ownerDocument, 'menuitem', {
          label: style.name,
          type: 'checkbox',
          class: 'styloaix-style',
          checked: style.enabled,
          oncommand: 'UC.styloaix.toggleStyle(this._style);',
          onclick: 'if (event.button === 1) UC.styloaix.toggleStyle(this._style);',
          styleid: style.id
        });
        popup.appendChild(menuitem);
        menuitem._style = style;      
    },

    get disabledStyles () {
      return xPref.get(this.PREF_STYLESDISABLED);
    },

    get CSSDIR () {
      let cssFolder = _uc.chromedir.clone();
      cssFolder.append('UserStyles');
      if (!cssFolder.exists() || !cssFolder.isDirectory())
        cssFolder.create(Ci.nsIFile.DIRECTORY_TYPE, 0664);
      return this.CSSDIR = cssFolder;
    },

    btnClasses: ['icon-white', 'icon-colored'],

    get buttons () {
      let arr = [];
      let widget = CustomizableUI.getWidget('styloaix-button');
      if (widget && 'label' in widget) { // check if button exists
        widget.instances.forEach(btn => {
          arr.push(btn.node);
        });
      }
      return arr;
    },

    PREF_DISABLED: 'userChromeJS.styloaix.allDisabled',
    PREF_STYLESDISABLED: 'userChromeJS.styloaix.stylesDisabled',
    PREF_MOZDOCUMENT: 'layout.css.moz-document.content.enabled',

    STYLE: {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}') {
          #styloaix-button.icon-white {
            list-style-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAAOwQAADsEBuJFr7QAAAAd0SU1FB9sJEwExOWMLOcEAAAHNSURBVDjLpZO/aiJRFIe/uxrC6ESUCDNgEdB+mC5VILVvIHkAyzyET2ArYq+1ASGYaBlC/oxNUNAIiqQIwhQjDI5zttiN7GTWKr/ycu7HOd+9RwHCD5IEEIkzVqsVnuehlELXdQzDQCkVqVFK/QH8m4eHB3q9Hrlcjmw2i4jgeR7r9RpN06hWq+i6HrkjX3l+fpZ6vS7L5VK+JwgCubu7k9lstj8DJNJBv9+nUqlQKBQQEVarFb7vk8lkOD095eTkJDbqr2+tUCgUALi/v2c0GpFIJFgsFrTbbRzHiUGSh+yenZ1xe3vL4+MjuVwO27a5uLj4b+1+pna7LfP5PDK77/vy/v4u3W5XarWauK4bcRABBEEgjUZDHMeR7XYbEzmdTqXVakUAEQefn59cXV2RTqe5ubmh0+kwGAzwPA+AYrGI7/uHHTSbTY6Pj8nn81iWhWmajEYjhsMh5XIZgFQqdRiQTCa5vr7m7e2N6XTK6+srmqZxeXm5f6UwDA8DwjDk6OgIy7KwLCtm++XlhfPz8+h3/isRgKenJ8bjMYZhYJomuq6jlMJ1XSaTCaVSCdu2I7sQAXxlt9vx8fHBZrMBIJPJYBhGrKM94Cfr/Bv7uSv7p31nCQAAAABJRU5ErkJggg==');
          }
          #styloaix-button.icon-colored {
            list-style-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOwQAADsEBuJFr7QAAAAd0SU1FB9sJEwETHfi6mzAAAAIVSURBVDjLpZNPaJJxGICfbzjXEiJRcaCQkWQgHUwclSBWc0ZFjSQWsyDqEASxS4tuptiC1lUKlqOD1SljpqMtwpGsQiYuolFEuLHL4GuLr6JNa9/XQRyJ87Tn+r6/5/fy/hEAhU2gAkhOXWwIlL4s8X1pBZWqhZv9L3jldTTkHJksVgX/83L0M/fuTGG1WrFYLMjyX+x2O8fezqIVFGL7drNd3VpfQY3XE1+ZeLpIPp/H5XLViSuVCtFolFLqCY5mgsT9acaeZ3G5XMiyTKFQQJIkzGYzNpsNk8nEr416UEOQt67/HAqFmJ1PceCQBZ8vRfceKz+1Bi63tTYKTrtHADAYDOsBj8dD+nqa0ccZACyV3/S2rQJb6gQtADPDA8wMD+DcqSOXywHg8/koFotIkkQ2m0V1tIcTbz6yXP7TKKhx69JxAoEAiUSCcrkMgEajwev1EovFSGUy3P4031wwt7iMKIqYdRe4ekXH2d7DhMNhRFEEoKurC3nHruaCc4OPMBqNDN6VcXeucqM/x4oUIRKJrOfo9frmU1Cr1ZRKJZLJJOPj4zxIlNBqtYTD1U1VFIUf5TXmh55VH+y31AtkWaa9vZ1gMEgwGGxY3Xg8zsGe880ruHbGg9PpxO/343A46OjoQBAEFhYWSGfG2GbrpLP7ZHPBKfdeQg+HmJ78QPG9gvhNQRCgr2+NkXdzG16jsNlz/gcHerkUp11MYQAAAABJRU5ErkJggg==');
          }
        }
      `)),
      type: _uc.sss.AUTHOR_SHEET
    },

    styles: [],

    destroy: function () {
      xPref.unlock(this.PREF_MOZDOCUMENT);
      xPref.removeListener(this.prefListener);
      xPref.removeListener(this.prefListenerAll);
      CustomizableUI.destroyWidget('styloaix-button');
      this.toggleStyle(this.STYLE, {aStatus: false, changeStatus: false, forced: true});
      this.toggleAll({disable: true});
      delete UC.styloaix;
    }
  }

  class UserStyle {
    constructor(file, registrationMethod = _uc.sss.AUTHOR_SHEET) {
      this.name = file.leafName.replace(/(?:\.(?:user|as))?\.css$/, '');
      this.lastModified = file.lastModifiedTime;
      this.url = Services.io.newURI('resource://userchromejs/UserStyles/' + file.leafName);
      this.enabled = UC.styloaix.disabledStyles.split('|').indexOf(this.name) == -1;
      this.type = registrationMethod;
      if (UC.styloaix.enabled && this.enabled)
        _uc.sss.loadAndRegisterSheet(this.url, this.type);
      this.id = UC.styloaix.styles.length;
      UC.styloaix.styles.push(this);
    }
  }

  UC.styloaix.init();

})()