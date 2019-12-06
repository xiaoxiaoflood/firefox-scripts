// ==UserScript==
// @name            Master Password+
// @include         *
// @startup         UC.masterPasswordPlus.exec(win);
// @shutdown        UC.masterPasswordPlus.destroy();
// @onlyonce
// ==/UserScript==

(function () {

  UC.masterPasswordPlus = {
    exec: function (win) {
      if (!win.isChromeWindow || win != win.top)
        return;

      let document = win.document;
      if (document.getElementsByTagName('keyset').length) {
        let key = document.getElementById('mpPk');
        if (key) {
          this.atalho(key);
        } else {
          let k = document.createXULElement('key');
          k.id = 'mpPk';
          this.atalho(k);
          document.getElementsByTagName('keyset')[0].appendChild(k);
        }
      }
      let ovl = document.createXULElement('div');
      ovl.id = 'mpPlus';
      ovl.setAttribute('style', 'position: fixed; display: none; width: 100%; height: 100%; top: 0; background-color: gray; z-index: 2; cursor: pointer;');
      document.documentElement.appendChild(ovl);

      let input = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
      input.id = 'mpPinput';
      input.setAttribute('type', 'password');
      input.setAttribute('style', 'border: 1px solid black; text-align: center; position: absolute; top:0; bottom: 0; left: 0; right: 0; margin: auto;');

      input.addEventListener('keypress', function (e) {
        if (e.keyCode === 13) {
          if (UC.masterPasswordPlus.mp.checkPassword(e.target.value)) {
            _uc.windows((doc, win2) => {
              e.target.value = '';
              doc.getElementById('mpPlus').style.display = 'none';
              win2.titObs.disconnect();
              doc.title = win2.titulo;
            }, false);
            UC.masterPasswordPlus.locked = false;
          } else {
            e.target.value = '';
          }
        } else if ((e.which === 0 && e.keyCode != 35 && e.keyCode != 36 && e.keyCode != 37 && e.keyCode != 39 && e.keyCode != 46) || ((e.altKey || e.ctrlKey) && e.shiftKey) || (e.altKey && !e.ctrlKey && (e.which < 48 || e.which > 57)) || (e.ctrlKey && !e.altKey && (e.which != 97))) {
          e.preventDefault();
        }
      });
      ovl.appendChild(input);

      input.addEventListener('blur', function () {
        setTimeout(() => {
          input.focus();
        });
      });
      win.addEventListener('activate', function () {
        input.focus();
      });

      if (this.mp.hasPassword && this.locked) {
        this.lock(document, win);
      }
    },

    mp: Cc['@mozilla.org/security/pk11tokendb;1'].getService(Ci.nsIPK11TokenDB).getInternalKeyToken(),

    atalho: function (el) {
        el.setAttribute('oncommand', 'UC.masterPasswordPlus.lockAll();');
        el.setAttribute('modifiers', 'accel alt shift');
        el.setAttribute('key', 'W');
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
      let input = doc.getElementById('mpPinput');
      input.value = '';
      doc.getElementById('mpPlus').style.display = 'block';
      win.titulo = doc.title;
      doc.title = '🞻🞻🞻🞻🞻🞻';
      win.titObs = this.onTitleChanged(win);
      input.focus();
    },

    lockAll: function () {
      if (!UC.masterPasswordPlus.mp.hasPassword)
        return;

      this.locked = true;
      _uc.windows((doc, win) => {
        this.lock(doc, win);
      }, false);
    },

    locked: true,
    
    destroy: function () {
      _uc.windows((doc) => {
        let mpPlus = doc.getElementById('mpPlus');
        if (mpPlus) {
          doc.getElementById('mpPlus').remove();
        }
        let mpPk = doc.getElementById('mpPk');
        if (mpPk) {
          mpPk.setAttribute('modifiers', '');
          mpPk.setAttribute('oncommand', '');
          mpPk.setAttribute('key', '');
        }
      }, false);
      delete UC.masterPasswordPlus;
    }
  }

})()
