// ==UserScript==
// @name            Remove Dropmarker from Extension Buttons
// @include         main
// @startup         UC.rightMenu.exec(win);
// @shutdown        UC.rightMenu.destroy();
// @onlyonce
// ==/UserScript==

// original: https://github.com/ghwokai/firefoxProfile/blob/003983b9febc19f919b0a7af220102bf3ae778e0/Profiles/myUse/chrome/Wingsmix/rightMenu.uc.js

( function () {

  UC.rightMenu = {
    exec: function (win) {
      var document = win.document;

      var greasemonkeyTBB = document.getElementById('greasemonkey-tbb');
      if (!greasemonkeyTBB)
        return;
      greasemonkeyTBB.addEventListener('click', UC.rightMenu.greasemonkey, false);

      [ ['tiletabs-buttonmenu', 'tiletabs-buttonmenu-popup'], 
        ['QuickFoxNotes-toolbar-button', 'qfn-backpopup'] ].forEach(function (ids) {
        var btnMenu = document.getElementById(ids[0]);
        if (!btnMenu )
          return;
        btnMenu.popup = ids[1];
        btnMenu.addEventListener('click', UC.rightMenu.common, false);
      });

      var sspi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css,' + encodeURIComponent(UC.rightMenu.style) + '"'
      );
      document.insertBefore(sspi, document.documentElement);
      UC.rightMenu.styles.push(sspi);
    },

    greasemonkey: function (e) {
      var win = e.view;
			if (e.button == 0) {
				e.preventDefault();
				e.currentTarget.firstChild.openPopup(this, 'after_start', 0, 0, false, false);
			}
			else if (e.button == 2) {
				GM_util.setEnabled(!GM_util.getEnabled());
				win.GM_BrowserUI.refreshStatus();
				e.preventDefault();
				e.stopPropagation();
				setTimeout( function () {
					win.document.getElementById('toolbar-context-menu').hidePopup();
				}, 0);
			}
		},

    common: function (e) {
      var win = e.view;
      var document = win.document;
			if (e.button == 2) {
				document.getElementById(e.currentTarget.popup).openPopup(this, 'after_start', 0, 0, false, false);
				e.preventDefault();
				e.stopPropagation();
				setTimeout( function () {
					document.getElementById('toolbar-context-menu').hidePopup();
				}, 0);
			}
		},
    
    style: `
      @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
      :-moz-any(#tiletabs-buttonmenu,
                #greasemonkey-tbb,
                #QuickFoxNotes-toolbar-button) > .toolbarbutton-menubutton-dropmarker {
        display:none !important;
      }
    `,

    styles: [],

    destroy: function () {
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        var document = win.document;

        var greasemonkeyTBB = document.getElementById('greasemonkey-tbb');
        if (!greasemonkeyTBB)
          return;
        greasemonkeyTBB.removeEventListener('click', UC.rightMenu.greasemonkey, false);

        [ ['tiletabs-buttonmenu', 'tiletabs-buttonmenu-popup'], 
          ['QuickFoxNotes-toolbar-button', 'qfn-backpopup'] ].forEach(function (ids) {
          var btnMenu = document.getElementById(ids[0]);
          if (!btnMenu )
            return;
          delete btnMenu.popup;
          btnMenu.removeEventListener('click', UC.rightMenu.common, false);
        });
      }
      UC.rightMenu.styles.forEach(s => s.parentNode.removeChild(s));
      delete UC.rightMenu;
    }
  }

})();
