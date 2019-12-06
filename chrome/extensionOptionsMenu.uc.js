// ==UserScript==
// @name            Extension Options Menu
// @include         main
// @startup         UC.extensionOptionsMenu.exec(win);
// @shutdown        UC.extensionOptionsMenu.destroy();
// @onlyonce
// ==/UserScript==

// original: https://addons.mozilla.org/en-US/firefox/addon/extension-options-menu/

(function () {
  'use strict';

  UC.extensionOptionsMenu = {
    exec: function (win) {
      var document = win.document;
      var sspi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css,' + encodeURIComponent(UC.extensionOptionsMenu.style) + '"'
      );
      document.insertBefore(sspi, document.documentElement);
      UC.extensionOptionsMenu.styles.push(sspi);
    },

    // config
    showVersion:    true,
    showHidden:     false,
    showDisabled:   true,
    autoRestart:    false,
    enabledFirst:   true,
    blackListArray: [],

    populateMenu: function (event) {
      var prevState;
      var showItem = true;
      var popup = event.currentTarget;
      var document = event.view.document;

      while (popup.hasChildNodes())
        popup.removeChild(popup.firstChild);

      var addons;
      (async () => {
        addons = await AddonManager.getAddonsByTypes(['extension']);
      })();

      var thread = Services.tm.mainThread;
      while (addons === undefined)
        thread.processNextEvent(true);

      addons.sort((a, b) => {
        var enabledFirst = UC.extensionOptionsMenu.enabledFirst;
        var ka = (enabledFirst ? a.isActive ? '0' : '1' : '') + ' ' + a.name.toLowerCase();
        var kb = (enabledFirst ? b.isActive ? '0' : '1' : '') + ' ' + b.name.toLowerCase();
        return (ka < kb) ? -1 : 1;
      }).forEach(addon => {
        if (!addon.appDisabled && ((addon.isActive && addon.optionsURL)
            || ((addon.userDisabled && UC.extensionOptionsMenu.showDisabled)
            || (!addon.hidden || UC.extensionOptionsMenu.showHidden)))) {
          var state = addon.isActive;
          if (UC.extensionOptionsMenu.enabledFirst && (prevState && state !== prevState))
            popup.appendChild(document.createXULElement('menuseparator'));
          prevState = state;

          var mi = document.createXULElement('menuitem');
          var label = addon.name;
          if (UC.extensionOptionsMenu.showVersion)
            label = label += ' ' + addon.version;
          mi.setAttribute('label', label);
          mi.setAttribute('class', 'menuitem-iconic');
          mi.setAttribute('tooltiptext', addon.description + '\nID : ' + addon.id + '\n' + Math.floor(addon.size / 1024) + ' KB' + '\n\nLeft-Click: Options\nMiddle-Click: Open Homepage\nRight-Click: Enable/Disable\nCtrl + Left-Click: View Source\nCtrl + Middle-Click: Copy ID\nCtrl + Right-Click: Uninstall');
          var icon = addon.iconURL || addon.iconURL64 || UC.extensionOptionsMenu.iconURL || '';
          mi.setAttribute('image', icon);
          mi.addEventListener('click', UC.extensionOptionsMenu.handleClick);
          mi._Addon = addon;

          UC.extensionOptionsMenu.setDisable(mi, addon, 0);

          if (UC.extensionOptionsMenu.blackListArray) {
            for (var i = 0; i < UC.extensionOptionsMenu.blackListArray.length; i++) {
              if (UC.extensionOptionsMenu.blackListArray[i] == addon.id.toLowerCase()) {
                showItem = false;
                break;
              } else {
                showItem = true;
              }
            }
          }
          if (showItem)
            popup.appendChild(mi);
        }
      });
    },

    handleClick: function(event) {
      var win = event.view;
      var mi = event.currentTarget;
      if (!('_Addon' in mi)) {
        return;
      }

      var addon = mi._Addon;
      var pending = addon.pendingOperations & AddonManager.PENDING_UNINSTALL;
      var hasMdf = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

      switch (event.button) {
        case 0:
          if (addon.optionsURL && !hasMdf)
            UC.extensionOptionsMenu.openAddonOptions(addon, win);
          else if (event.ctrlKey)
            UC.extensionOptionsMenu.browseDir(addon);
          break;
        case 1:
          if (addon.homepageURL && !hasMdf) {
            openURL(addon.homepageURL);
            closeMenus(mi);
          } else if (event.ctrlKey) {
            Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(addon.id);
            closeMenus(mi);
          }
          break;
        case 2:
          if (!hasMdf) {
            if (addon.userDisabled)
              addon.enable();
            else
              addon.disable();
            UC.extensionOptionsMenu.setDisable(mi, addon, 1);
            if (addon.operationsRequiringRestart && UC.extensionOptionsMenu.autoRestart)
              if ('BrowserUtils' in window)
                BrowserUtils.restartApplication();
              else
                Application.restart();
          } else if (event.ctrlKey) {
            if (Services.prompt.confirm(null, null, 'Delete ' + addon.name + ' permanently?')) {
              if (pending)
                addon.cancelUninstall();
              else {
                addon.uninstall();
                return;
              }
              cls.remove('restartless');
              cls.remove('enabling');
              cls.remove('disabling');
              cls.add('uninstalling');
              cls.add('disabled');
            }
          }
      }
    },

    setDisable: function (mi, addon, toggling) {
      var cls = mi.classList;
      
      if (!addon.operationsRequiringRestart) {
        cls.add('restartless');
        
        if (toggling) {
          if (addon.isActive) {
            if (addon.optionsURL)
              cls.remove('noOptions');
            cls.remove('disabled');
            cls.remove('disabling');
            cls.add('enabling');
          } else {
            cls.remove('enabling');
            cls.add('disabling');
          }
        }
      } else {
        if (toggling)
          if (addon.userDisabled)
            if (addon.isActive)
              cls.add('disabling');
            else
              cls.remove('enabling');
          else
            if (addon.isActive)
              cls.remove('disabling');
            else
              cls.add('enabling');
        else if (addon.userDisabled && addon.isActive)
          cls.add('disabling');
        else if (!addon.userDisabled && !addon.isActive)
          cls.add('enabling');
      }

      if (!addon.isActive)
        cls.add('disabled');

      if (!addon.optionsURL)
        cls.add('noOptions');
    },

    openAddonOptions: function (addon, win) {
      var optionsURL = addon.optionsURL;
      if (!addon.isActive || !optionsURL)
        return;

      switch (Number(addon.optionsType)) {
        case 2:
        case 5:
          BrowserOpenAddonsMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
          break;
        case 3:
          'switchToTabHavingURI' in win ? win.switchToTabHavingURI(optionsURL, true) : openTab('contentTab', { contentPage: optionsURL });
          break;
        default:
          openDialog(optionsURL, addon.name, 'chrome,titlebar,toolbar,resizable,scrollbars,centerscreen,dialog=no,modal=no');
      }
    },

    browseDir: function (addon) {
      var dir = Services.dirsvc.get('ProfD', Ci.nsIFile);
      var nsLocalFile = Components.Constructor('@mozilla.org/file/local;1', 'nsIFile', 'initWithPath');
      dir.append('extensions');
      dir.append(addon.id);
      if (!dir.exists()) {
          dir = dir.parent;
          dir.append(addon.id + '.xpi');
      }
      dir.launch();
    },

    iconURL:      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVQ4y6WTW0sCQRiG/SEpVBDUVVfphbAEhWAlqYhrLWUlER2IIgrqYkEp6SBmudWiFf0SiSCwpAI7bJnprq6H/sTbGhJiEyt28fAN7zfz8DHDaABo/oPqBpovX7j4T1gOS6dNCcYiZbhOSrCHi2hugqNCwskVYNmXbxoSuPkCN3NWhCdahLLGKCfDcSBjOJiHeTeHPr8EyifCwGb9RMF0RIaHl+E+zoMJ5+AM5WALSBjaEWHayqLXm4GR/YB+Iw2iYIKTMB6WwIRE0EER9r0s+r1pGNZT6F55ReeigPb5F7TOPpMFTDCDkUAGA753GFYFdC08QedJEvkR2DbfzuntFBz+1K2ZFdCz9Ii2qQfo3Pck2MoZpVI/AqtXQAXjchIdk3fQMok/Ib6CaS0Z1c8pdlc8pqXjUOF7AqVSxDvQOq7RKERBi/UKdbDVnK3vkQWWS9Si1vstGIyxCqiBquZUXc429BfU+AL9Tqy8Q2Za8AAAAABJRU5ErkJggg==',
    
    style: `
      @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
      .restartless label:after {content:"*"; }
      .enabling label:after { content:"+" !important; }
      .disabling label:after { content:"-" !important; }
      .uninstalling label:after { content: '!' !important; }
      .noOptions { color: gray; }
      .disabled { color: gray; font-style: italic; }
    `,

    styles: [],

    init: function() {
      CustomizableUI.createWidget({
        id: 'eom-button',
        type: 'custom',
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: function (aDocument) {
          var toolbaritem = aDocument.createXULElement('toolbarbutton');
          var props = {
            id: 'eom-button',
            label: 'Extension Options Menu',
            tooltiptext: 'Extension Options Menu',
            type: 'menu',
            class: 'toolbarbutton-1 chromeclass-toolbar-additional',
            style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVQ4y6WTW0sCQRiG/SEpVBDUVVfphbAEhWAlqYhrLWUlER2IIgrqYkEp6SBmudWiFf0SiSCwpAI7bJnprq6H/sTbGhJiEyt28fAN7zfz8DHDaABo/oPqBpovX7j4T1gOS6dNCcYiZbhOSrCHi2hugqNCwskVYNmXbxoSuPkCN3NWhCdahLLGKCfDcSBjOJiHeTeHPr8EyifCwGb9RMF0RIaHl+E+zoMJ5+AM5WALSBjaEWHayqLXm4GR/YB+Iw2iYIKTMB6WwIRE0EER9r0s+r1pGNZT6F55ReeigPb5F7TOPpMFTDCDkUAGA753GFYFdC08QedJEvkR2DbfzuntFBz+1K2ZFdCz9Ii2qQfo3Pck2MoZpVI/AqtXQAXjchIdk3fQMok/Ib6CaS0Z1c8pdlc8pqXjUOF7AqVSxDvQOq7RKERBi/UKdbDVnK3vkQWWS9Si1vstGIyxCqiBquZUXc429BfU+AL9Tqy8Q2Za8AAAAABJRU5ErkJggg==)',
            onclick: 'if (event.button === 1) BrowserOpenAddonsMgr("addons://list/extension");'
          };
          for (var p in props) {
            toolbaritem.setAttribute(p, props[p]);
          }
          var mp = toolbaritem.appendChild(document.createXULElement('menupopup'));
          mp.setAttribute('id', 'eom-button-popup');
          mp.setAttribute('onclick', 'event.preventDefault(); event.stopPropagation(); setTimeout(function () { document.getElementById("toolbar-context-menu").hidePopup(); }, 0);');
          mp.addEventListener('popupshowing', UC.extensionOptionsMenu.populateMenu);

          return toolbaritem;
        }
      });
    },

    destroy: function () {
      CustomizableUI.destroyWidget('eom-button');
      UC.extensionOptionsMenu.styles.forEach(s => s.parentNode.removeChild(s));
      delete UC.extensionOptionsMenu;
    }
  }

  UC.extensionOptionsMenu.init();

})()