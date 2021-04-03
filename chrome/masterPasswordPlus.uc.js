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

    let document = win.document;

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
      style: 'border: 1px solid black; text-align: center; position: absolute; top:0; bottom: 0; left: 0; right: 0; margin: auto;'
    }, false);
    ovl.appendChild(input);

    input.addEventListener('blur', function () {
      setTimeout(() => {
        input.focus();
      });
    });

    if (this.mp.hasPassword && !this.mp.isLoggedIn()) {
      this.lock(document, win);
    }
  },

  mp: Cc['@mozilla.org/security/pk11tokendb;1'].getService(Ci.nsIPK11TokenDB).getInternalKeyToken(),

  handleEvent (ev) {
    const value = ev.composedTarget.value;
    switch (ev.type) {
      case 'keydown':
        const { altKey, code, ctrlKey, key } = ev;
        if (key == 'Enter') {
          if (UC.masterPasswordPlus.mp.checkPassword(value)) {
            _uc.sss.unregisterSheet(UC.masterPasswordPlus.LOCKED_STYLE.url, UC.masterPasswordPlus.LOCKED_STYLE.type);

            _uc.windows((doc, win) => {
              if (!'UC' in win || !win.isChromeWindow || win != win.top)
                return;
              const input = doc.getElementById('mpPinput');
              input.value = '';
              doc.getElementById('mpPlus').style.display = 'none';
              [...doc.getElementsByTagName('panel')].forEach(el => el.style.display = '');
              win.titObs.disconnect();
              doc.title = win.titulo;
              win.removeEventListener('keydown', UC.masterPasswordPlus, true);
              input.removeEventListener('input', UC.masterPasswordPlus, true);
              win.removeEventListener('activate', UC.masterPasswordPlus.setFocus);
              win.addEventListener('AppCommand', win.HandleAppCommandEvent, true);
            }, false);
          } else {
            _uc.windows((doc, win) => {
              if (!'UC' in win || !win.isChromeWindow || win !== win.top || win === this)
                return;
              doc.getElementById('mpPinput').value = '';
            }, false);
          }
        } else if ((key.length > 2 && // teclas digitáveis quase sempre =1, exceto acento seguido de char não acentuável, aí =2.
                    code.length == 2 && // F1 a F9 possuem key.length =2, mas são as únicas com code.length = 2, demais são > (como KeyA).
                    key != 'Dead' && // teclas de acento, que aguardam a tecla seguinte
                    key != 'Backspace' && key != 'Delete' && key != 'ArrowLeft' && key != 'ArrowRight' && key != 'Home' && key != 'End') || altKey || (ctrlKey && code != 'KeyA')) {
          ev.preventDefault();
        }
        break;
      case 'input':
        _uc.windows((doc, win) => {
          if (!'UC' in win || !win.isChromeWindow || win !== win.top || win === this)
            return;
          doc.getElementById('mpPinput').value = value;
        }, false);
    }
  },

  setFocus: function (e) {
    e.target.document.getElementById('mpPinput').focus();
  },

  onTitleChanged: function (win) {
    let document = win.document;
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

  lock: function (doc, win) {
    win.addEventListener('keydown', this, true);
    let input = doc.getElementById('mpPinput');
    input.value = '';
    input.addEventListener('input', this, true);
    [...doc.getElementsByTagName('panel')].forEach(el => el.style.display = 'none');
    doc.getElementById('mpPlus').style.display = 'block';
    win.titulo = doc.title;
    doc.title = '🞻🞻🞻🞻🞻🞻';
    win.titObs = this.onTitleChanged(win);
    win.addEventListener('activate', this.setFocus);
    win.removeEventListener('AppCommand', win.HandleAppCommandEvent, true);
    input.focus();
  },

  lockAll: function () {
    if (!this.mp.hasPassword)
      return;

    _uc.windows((doc, win) => {
      if ('UC' in win && win.isChromeWindow && win == win.top)
        this.lock(doc, win);
    }, false);

    _uc.sss.loadAndRegisterSheet(this.LOCKED_STYLE.url, this.LOCKED_STYLE.type);
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

if (!UC.masterPasswordPlus.mp.isLoggedIn())
  _uc.sss.loadAndRegisterSheet(UC.masterPasswordPlus.LOCKED_STYLE.url, UC.masterPasswordPlus.LOCKED_STYLE.type);
