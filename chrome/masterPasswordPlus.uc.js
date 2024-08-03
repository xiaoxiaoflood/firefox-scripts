// ==UserScript==
// @name            Master Password+
// @author          xiaoxiaoflood
// @include         *
// @startup         UC.masterPasswordPlus.exec(win);
// @shutdown        UC.masterPasswordPlus.destroy();
// @onlyonce
// ==/UserScript==

UC.masterPasswordPlus = {
  exec: function (win) {
    if (!win.isChromeWindow || win != win.top)
      return;

    const { document, setTimeout } = win;

    let keyset =  _uc.createElement(document, 'keyset', { id: 'masterPassword-keyset' });
    let mainKeyset = document.getElementById('mainKeyset');
    if (mainKeyset)
      mainKeyset.insertAdjacentElement('afterend', keyset);
    else
      (document.body || document.documentElement).insertAdjacentElement('afterbegin', keyset);

    let k = _uc.createElement(document, 'key', {
      id: 'mpPk',
      modifiers: 'accel alt shift',
      key: 'W',
      oncommand: 'UC.masterPasswordPlus.lockAll()',
    });
    keyset.appendChild(k);

    let ovl = _uc.createElement(document, 'div', {
      id: 'mpPlus',
      style: 'position: fixed; display: none; width: 100%; height: 100%; top: 0; background-color: gray; z-index: 2147483647; cursor: pointer;'
    });
    document.documentElement.appendChild(ovl);

    let input = _uc.createElement(document, 'input', {
      id: 'mpPinput',
      type: 'password',
      value: this.typed,
      style: 'border: 1px solid black; text-align: center; position: absolute; top:0; bottom: 0; left: 0; right: 0; margin: auto; padding: 3px; width: fit-content; height: fit-content; appearance: textfield;'
    }, false);
    ovl.appendChild(input);

    input.addEventListener('blur', function () {
      setTimeout(() => {
        input.focus();
      });
    });

    if (this.mp.hasPassword && !this.mp.isLoggedIn()) {
      this.lock(document, win);
      input.selectionStart = input.value.length;
    }
  },

  mp: Cc['@mozilla.org/security/pk11tokendb;1'].getService(Ci.nsIPK11TokenDB).getInternalKeyToken(),

  handleEvent (ev) {
    const value = ev.composedTarget.value;
    switch (ev.type) {
      case 'keydown':
        const { altKey, code, ctrlKey, key } = ev;
        if (key == 'Enter') {
          this.typed = '';
          if (UC.masterPasswordPlus.mp.checkPassword(value)) {
            UC.masterPasswordPlus.unlock();
          } else {
            _uc.windows((doc, win) => {
              if (!'UC' in win || !win.isChromeWindow || win !== win.top || win === this)
                return;
              doc.getElementById('mpPinput').value = '';
            }, false);
          }
        } else if ((key.length > 2 &&
                    code.length == 2 &&
                    key != 'Dead' &&
                    key != 'Backspace' && key != 'Delete' && key != 'ArrowLeft' && key != 'ArrowRight' && key != 'Home' && key != 'End') || altKey || (ctrlKey && code != 'KeyA')) {
          ev.preventDefault();
        }
        break;
      case 'input':
        this.typed = value;
        _uc.windows((doc, win) => {
          if (!'UC' in win || !win.isChromeWindow || win !== win.top || win === this)
            return;
          doc.getElementById('mpPinput').value = value;
        }, false);
        break;
      case 'DOMAudioPlaybackStarted':
        const browser = ev.composedTarget;
        const tab = browser.ownerGlobal.gBrowser.getTabForBrowser(browser);
        tab.toggleMuteAudio();
        UC.masterPasswordPlus.muted.add(tab);
    }
  },

  muted: new Set(),

  typed: '',

  setFocus: function (e) {
    e.target.document.getElementById('mpPinput').focus();
  },

  onTitleChanged: function (win) {
    const { document, MutationObserver } = win;
    let observer = new MutationObserver(mutationsList => {
      if (mutationsList[0].oldValue !== document.title && document.title != '🞻🞻🞻🞻🞻🞻') {
        win.titulo = document.title;
        document.title = '🞻🞻🞻🞻🞻🞻';
      }
    });

    if (document.getElementsByTagName('title').length)
      observer.observe(document.getElementsByTagName('title')[0], { childList: true, characterData: true });
    else
      observer.observe(document.documentElement, { attributeFilter: ['title'], attributeOldValue: true });
    
    return observer;
  },

  observe: function () {
    this.unlock();
  },

  lock: function (doc, win) {
    win.addEventListener('keydown', this, true);
    let input = doc.getElementById('mpPinput');
    input.addEventListener('input', this, true);
    [...doc.getElementsByTagName('panel')].forEach(el => el.style.display = 'none');
    doc.getElementById('mpPlus').style.display = 'block';
    win.titulo = doc.title;
    doc.title = '🞻🞻🞻🞻🞻🞻';
    win.titObs = this.onTitleChanged(win);
    win.addEventListener('activate', this.setFocus);
    win.removeEventListener('AppCommand', win.HandleAppCommandEvent, true);
    input.focus();

    const { gBrowser } = win;
    gBrowser?._tabs?.forEach(tab => {
      if (tab.soundPlaying) {
        tab.toggleMuteAudio();
        this.muted.add(tab);
      }
    });
    gBrowser?.addEventListener('DOMAudioPlaybackStarted', this);
  },

  lockAll: function () {
    if (!this.mp.hasPassword)
      return;

    Services.obs.addObserver(this, 'passwordmgr-crypto-login');

    _uc.windows((doc, win) => {
      if ('UC' in win && win.isChromeWindow && win == win.top)
        this.lock(doc, win);
    }, false);

    this.mp.logoutSimple();
    _uc.sss.loadAndRegisterSheet(this.LOCKED_STYLE.url, this.LOCKED_STYLE.type);
  },

  unlock: function () {
    Services.obs.removeObserver(this, 'passwordmgr-crypto-login');

    _uc.sss.unregisterSheet(this.LOCKED_STYLE.url, this.LOCKED_STYLE.type);

    const windows = Services.wm.getEnumerator(null);
    while (windows.hasMoreElements()) {
      const win = windows.getNext();
      const doc = win.document;
      if (win.location.href === 'chrome://global/content/commonDialog.xhtml' &&
          win.args?.promptType === 'promptPassword')
        doc.getElementById('commonDialog').getButton('accept').click();
      
      if (!('UC' in win) || !win.isChromeWindow || win != win.top)
        continue;

      const input = doc.getElementById('mpPinput');
      input.value = '';
      doc.getElementById('mpPlus').style.display = 'none';
      [...doc.getElementsByTagName('panel')].forEach(el => el.style.display = '');
      win.titObs.disconnect();
      doc.title = win.titulo;
      win.gBrowser?.removeEventListener('DOMAudioPlaybackStarted', this);
      win.removeEventListener('keydown', this, true);
      input.removeEventListener('input', this, true);
      win.removeEventListener('activate', this.setFocus);
      win.addEventListener('AppCommand', win.HandleAppCommandEvent, true);
    }

    this.muted.forEach(tab => {
      tab.toggleMuteAudio();
      this.muted.delete(tab);
    });
  },

  LOCKED_STYLE: {
    url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
      menupopup {
        display: none !important;
      }
    `)),
    type: _uc.sss.USER_SHEET
  },

  destroy: function () {
    _uc.windows((doc, win) => {
      if (!'UC' in win || !win.isChromeWindow || win != win.top)
        return;
      let mpPlus = doc.getElementById('mpPlus');
      if (mpPlus) {
        doc.getElementById('mpPlus').remove();
      }
      doc.getElementById('masterPassword-keyset').remove();
    }, false);
    delete UC.masterPasswordPlus;
  }
}

if (UC.masterPasswordPlus.mp.hasPassword && !UC.masterPasswordPlus.mp.isLoggedIn()) {
  Services.obs.addObserver(UC.masterPasswordPlus, 'passwordmgr-crypto-login');
  _uc.sss.loadAndRegisterSheet(UC.masterPasswordPlus.LOCKED_STYLE.url, UC.masterPasswordPlus.LOCKED_STYLE.type);
}
