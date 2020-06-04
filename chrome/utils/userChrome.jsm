let EXPORTED_SYMBOLS = [];

const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
const {xPref} = ChromeUtils.import('chrome://userchromejs/content/xPref.jsm');

let UC = {};

let _uc = {
  ALWAYSEXECUTE: 'rebuild_userChrome.uc.js',
  BROWSERCHROME: 'chrome://browser/content/browser.xhtml',
  PREF_ENABLED: 'userChromeJS.enabled',
  PREF_SCRIPTSDISABLED: 'userChromeJS.scriptsDisabled',
  BASE_FILEURI: Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromDir(Services.dirsvc.get('UChrm', Ci.nsIFile)),

  chromedir: Services.dirsvc.get('UChrm', Ci.nsIFile),
  sss: Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),

  getScripts: function () {
    this.scripts = {};
    let files = this.chromedir.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
    while (files.hasMoreElements()) {
      let file = files.getNext().QueryInterface(Ci.nsIFile);
      if (/\.uc\.js$/i.test(file.leafName)) {
        _uc.getScriptData(file);
      }
    }
  },

  getScriptData: function (aFile) {
    let aContent = this.readFile(aFile);
    let header = (aContent.match(/^\/\/ ==UserScript==\s*\n(?:.*\n)*?\/\/ ==\/UserScript==\s*\n/m) || [''])[0];
    let match, rex = {
      include: [],
      exclude: []
    };
    let findNextRe = /^\/\/ @(include|exclude)\s+(.+)\s*$/gm;
    while ((match = findNextRe.exec(header))) {
      rex[match[1]].push(match[2].replace(/^main$/i, _uc.BROWSERCHROME).replace(/\*/g, '.*?'));
    }
    if (!rex.include.length) {
      rex.include.push(_uc.BROWSERCHROME);
    }
    let exclude = rex.exclude.length ? '(?!' + rex.exclude.join('$|') + '$)' : '';

    let def = ['', ''];
    let author = (header.match(/\/\/ @author\s+(.+)\s*$/im) || def)[1];
    let filename = aFile.leafName || '';

    return this.scripts[filename] = {
      filename: filename,
      file: aFile,
      url: this.BASE_FILEURI + filename,
      name: (header.match(/\/\/ @name\s+(.+)\s*$/im) || def)[1],
      charset: (header.match(/\/\/ @charset\s+(.+)\s*$/im) || def)[1],
      description: (header.match(/\/\/ @description\s+(.+)\s*$/im) || def)[1],
      version: (header.match(/\/\/ @version\s+(.+)\s*$/im) || def)[1],
      author: (header.match(/\/\/ @author\s+(.+)\s*$/im) || def)[1],
      regex: new RegExp('^' + exclude + '(' + (rex.include.join('|') || '.*') + ')$', 'i'),
      id: (header.match(/\/\/ @id\s+(.+)\s*$/im) || ['', filename.split('.uc.js')[0] + '@' + (author || 'userChromeJS')])[1],
      homepageURL: (header.match(/\/\/ @homepageURL\s+(.+)\s*$/im) || def)[1],
      downloadURL: (header.match(/\/\/ @downloadURL\s+(.+)\s*$/im) || def)[1],
      updateURL: (header.match(/\/\/ @updateURL\s+(.+)\s*$/im) || def)[1],
      optionsURL: (header.match(/\/\/ @optionsURL\s+(.+)\s*$/im) || def)[1],
      startup: (header.match(/\/\/ @startup\s+(.+)\s*$/im) || def)[1],
      shutdown: (header.match(/\/\/ @shutdown\s+(.+)\s*$/im) || def)[1],
      onlyonce: /\/\/ @onlyonce\b/.test(header),
      isRunning: false,
      get isEnabled() {
        return (xPref.get(_uc.PREF_SCRIPTSDISABLED) || '').split(',').indexOf(this.filename) == -1;
      }
    }
  },

  readFile: function (aFile, metaOnly = false) {
    let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
    stream.init(aFile, 0x01, 0, 0);
    let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
    cvstream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    let content = '',
        data = {};
    while (cvstream.readString(4096, data)) {
      content += data.value;
      if (metaOnly && content.indexOf('// ==/UserScript==') > 0) {
        break;
      }
    }
    cvstream.close();
    return content.replace(/\r\n?/g, '\n');
  },

  everLoaded: [],
  
  loadScript: function (script, win) {
    if (!script.regex.test(win.location.href) || (script.filename != this.ALWAYSEXECUTE && !script.isEnabled)) {
      return;
    }

    if (script.onlyonce && script.isRunning) {
      if (script.startup) {
        eval(script.startup);
      }
      return;
    }

    try {
      if (script.charset) {
        Services.scriptloader.loadSubScript(script.url + '?' + script.file.lastModifiedTime, win, script.charset);
      } else {
        Services.scriptloader.loadSubScript(script.url + '?' + script.file.lastModifiedTime, win, 'UTF-8');
      }
      script.isRunning = true;
      if (script.startup) {
        eval(script.startup);
      }
      if (!script.shutdown) {
        this.everLoaded.push(script.id);
      }
    } catch (ex) {
      this.error(script.filename, ex);
    }
  },

  windows: function (fun, onlyBrowsers = true) {
    let windows = Services.wm.getEnumerator(onlyBrowsers ? 'navigator:browser' : null);
    while (windows.hasMoreElements()) {
      let win = windows.getNext();
      if (!win._uc)
        continue;
      if (!onlyBrowsers) {
        let frames = win.docShell.getAllDocShellsInSubtree(Ci.nsIDocShellTreeItem.typeAll, Ci.nsIDocShell.ENUMERATE_FORWARDS);
        let res = frames.some(frame => {
          let fWin = frame.domWindow;
          let {document, location} = fWin;
          if (fun(document, fWin, location))
            return true;
        });
        if (res)
          break;
      } else {
        let {document, location} = win;
        if (fun(document, win, location))
          break;
      }
    }
  },

  createElement: function (doc, tag, atts, XUL = true) {
    let el = XUL ? doc.createXULElement(tag) : doc.createElement(tag);
    for (let att in atts) {
      el.setAttribute(att, atts[att]);
    }
    return el
  },

  error: function (aMsg, err) {
    let error = Cc['@mozilla.org/scripterror;1'].createInstance(Ci.nsIScriptError);
    if (typeof err == 'object') {
      error.init(aMsg + '\n' + err.name + ' : ' + err.message, err.fileName || null, null, err.lineNumber, null, 2, err.name);
    } else {
      error.init(aMsg + '\n' + err + '\n', null, null, null, null, 2, null);
    }
    Services.console.logMessage(error);
  }
};

if (xPref.get(_uc.PREF_ENABLED) === undefined) {
  xPref.set(_uc.PREF_ENABLED, true, true);
}

if (xPref.get(_uc.PREF_SCRIPTSDISABLED) === undefined) {
  xPref.set(_uc.PREF_SCRIPTSDISABLED, '', true);
}

function UserChrome_js() {
  _uc.getScripts();
  Services.obs.addObserver(this, 'chrome-document-global-created', false);
}

UserChrome_js.prototype = {
  observe: function (aSubject) {
    aSubject.addEventListener('DOMContentLoaded', this, {once: true});
  },

  handleEvent: function (aEvent) {
    let document = aEvent.originalTarget;
    let window = document.defaultView;
    let location = window.location;
    if (/^(chrome:(?!\/\/(global\/content\/commonDialog|browser\/content\/webext-panels)\.x?html)|about:(?!blank))/i.test(location.href)) {
      window.UC = UC;
      window._uc = _uc;
      window.xPref = xPref;
      if (window._gBrowser) // bug 1443849
        window.gBrowser = window._gBrowser;

      if (xPref.get(_uc.PREF_ENABLED)) {
        Object.values(_uc.scripts).forEach(script => {
          _uc.loadScript(script, window);
        });
      } else if (!UC.rebuild) {
        _uc.loadScript(_uc.scripts[_uc.ALWAYSEXECUTE], window);
      }
    }
  }
};

if (!Services.appinfo.inSafeMode)
  new UserChrome_js();
