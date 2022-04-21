const { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
const { NetUtil } = ChromeUtils.import('resource://gre/modules/NetUtil.jsm');

let require;
try {
  ({ require } = ChromeUtils.import('resource://devtools/shared/loader/Loader.jsm'));
} catch (e) {
  // tb91
  ({ require } = ChromeUtils.import('resource://devtools/shared/Loader.jsm'));
}

docShell.cssErrorReportingEnabled = true;

function require_mini (m) {
	let scope = {
    exports: {}
  };
	Services.scriptloader.loadSubScript('chrome://' + m + '.js', scope);
	return scope.exports;
};

let url;
let type;
let id;
let style;

if (isChromeWindow) {
  let params = window.arguments[0];
  url = params.url;
  type = params.type;
  id = params.id;
} else {
  let params = new URLSearchParams(location.search);
  url = params.get('url');
  type = params.get('type');
  id = params.get('id');
}

origin = 2;
let lastOrigin;
let unsaved = false;
let previewCode;
let previewOrigin;
let previewActive = false;
let isInstantPreview;
let isInstantCheck;
let timeoutRunning = false;
let interval;
let nameE;
let initialCode = '';
let sourceEditor;

function init () {
  if (id)
    style = UC.styloaix.styles.get(id);
  if (style) {
    origin = style.type;
    NetUtil.asyncFetch(
      {
        uri: style.url,
        loadingNode: document,
        securityFlags: Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_INHERITS_SEC_CONTEXT || Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_INHERITS,
        contentPolicyType: Ci.nsIContentPolicy.TYPE_OTHER,
      },
      async function (stream) {
        const bstream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(stream);

        try {
          initialCode = bstream.readBytes(bstream.available());
        } catch {}

        stream.close();

        try {
          const converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
          converter.charset = 'utf-8';
          initialCode = converter.ConvertToUnicode(initialCode);
        } catch {}
       
        initEditor();
      }
    );
  } else {
    if (url)
      initialCode = '@-moz-document ' + type + '("' + url + '") {\n\n\n}';
    initEditor();
  }

	nameE = document.getElementById('name');
  nameE.value = style?.name || '';
  updateTitle();
	nameE.addEventListener('input', function () {
    unsaved = true;
    toggleUI('save-button', true);
  });

  document.getElementById('origin').value = origin;

  document.getElementById('errors').addEventListener('click', function (e) {
    if (e.target == this)
      this.style.display = 'none';
  });

  isInstantPreview = xPref.get(UC.styloaix.PREF_INSTANTPREVIEW);
  document.getElementById('instant-preview').checked = isInstantPreview;
  isInstantCheck = xPref.get(UC.styloaix.PREF_INSTANTCHECK);
  document.getElementById('instant-check').checked = isInstantCheck;
  if (style?.enabled === false)
    toggleUI('preview-button', true);
  interval = xPref.get(UC.styloaix.PREF_INSTANTINTERVAL);
  xPref.addListener(UC.styloaix.PREF_INSTANTINTERVAL, function (ms) {
    interval = ms;
  });
}

function initEditor () {
  const Editor = require('devtools/client/shared/sourceeditor/editor');

  const extraKeys = {
    [Editor.accel('S')]: save,
    'F3': 'findNext',
    'Shift-F3': 'findPrev'
  };

  const lineWrapping = xPref.get(UC.styloaix.PREF_LINEWRAPPING);
  document.getElementById('wrap-lines').checked = lineWrapping;

  sourceEditor = new Editor({
    mode: Editor.modes.css,
    contextMenu: 'sourceEditorContextMenu',
    extraKeys: extraKeys,
    lineNumbers: true,
    lineWrapping: lineWrapping,
    value: initialCode,
    maxHighlightLength: 10000
  });
  
  sourceEditor.setupAutoCompletion = function () {
    this.extend(require_mini('userchromejs/content/styloaix/autocomplete'));
    this.initializeAutoCompletion();
  };

  document.getElementById('editor').selectedIndex = 1;

  sourceEditor.appendTo(document.getElementById('sourceeditor')).then(function () {
    sourceEditor.insertCommandsController();
    sourceEditor.focus();
    if (isInstantCheck)
      checkForErrors();
  });

  sourceEditor.on('change', function () {
    changed();
    if (!isInstantCheck)
      toggleUI('check-for-errors-button', true);
  });
}

function changed () {  
  if ((isInstantPreview || isInstantCheck) && !timeoutRunning)
    instantTimeout();

  unsaved = true;
  toggleUI('save-button', true);
  if (!isInstantPreview)
    toggleUI('preview-button', true);
}

function instantTimeout () {
  timeoutRunning = true;
  setTimeout(() => {
    if (isInstantPreview) {
      if (previewActive)
        _uc.sss.unregisterSheet(previewCode, previewOrigin);
      else if (style?.enabled)
        style.unregister();
      previewCode = Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(codeElementWrapper.value));
      previewOrigin = origin;
      previewActive = true;
      _uc.sss.loadAndRegisterSheet(previewCode, previewOrigin);
      toggleUI('preview-button', false);
      if (origin === _uc.sss.AGENT_SHEET || lastOrigin === _uc.sss.AGENT_SHEET) {
        lastOrigin = origin;
        UC.styloaix.forceRefresh();
      }
    }
    if (isInstantCheck)
      checkForErrors();
    timeoutRunning = false;
  }, interval)
}

function save () {
  if (!nameE.value)
    return alert('Style name must not be empty.');

  if (style)
    style.unregister();

  const finalTitle = nameE.value + (origin == 0 ? '.as' : origin == 1 ? '.us' : '') + '.css';
  const file = UC.styloaix.CSSDIR.clone();
  file.append(finalTitle);
  if (!file.exists())
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);

  const ostream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
  ostream.init(file, -1, -1, 0);

  const converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = 'UTF-8';

  const istream = converter.convertToInputStream(codeElementWrapper.value);

  NetUtil.asyncCopy(istream, ostream, function (aResult) {
    if (Components.isSuccessCode(aResult)) {
      const enabled = style ? style.enabled : true;

      if (style && finalTitle != style.fullName) {
        const oldFile = UC.styloaix.CSSDIR.clone()
        oldFile.append(style.fullName);
        oldFile.remove(false);
        UC.styloaix.styles.delete(style.fullName);
        if (!enabled) {
          UC.styloaix.disabledStyles.add(finalTitle);
          UC.styloaix.disabledStyles.delete(oldFile.leafName);
        }
      }

      style = new UC.styloaix.UserStyle(file);
      style.enabled = enabled;
      updateTitle();
      UC.styloaix.styles.set(style.fullName, style);
      if (UC.styloaix.enabled && enabled) {
        style.register();
        toggleUI('preview-button', false);
        if (previewActive) {
          _uc.sss.unregisterSheet(previewCode, previewOrigin);
          previewActive = false;
          if (origin === _uc.sss.AGENT_SHEET || lastOrigin === _uc.sss.AGENT_SHEET)
            UC.styloaix.forceRefresh();
        }
      }

      unsaved = false;

      toggleUI('save-button', false);
    } else {
      alert('Error!');
    }
  })

  sourceEditor.focus();
}

function updateTitle () {
  document.title = (style?.fullName || 'New Style') + ' - StyloaiX Editor';
}

function toggleUI (id, state) {
  document.getElementById(id).disabled = !state;
}

function preview () {
  if (previewActive)
    _uc.sss.unregisterSheet(previewCode, previewOrigin);
  else if (style?.enabled)
    style.unregister();
	previewCode = Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(codeElementWrapper.value));
  previewOrigin = origin;
  _uc.sss.loadAndRegisterSheet(previewCode, previewOrigin);
  previewActive = true;
  if (origin === _uc.sss.AGENT_SHEET || lastOrigin === _uc.sss.AGENT_SHEET) {
    lastOrigin = origin;
    UC.styloaix.forceRefresh();
  }

  checkForErrors();
	toggleUI('preview-button', false);
  sourceEditor.focus();
}

function checkForErrors () {
	const errors = document.getElementById('errors');
	errors.style.display = 'none';

	while (errors.hasChildNodes())
		errors.lastChild.remove();

  let count = 0;

	const errorListener = {
		observe: (message) => {
      if (!count)
        errors.style.display = 'block';

      const error = message.QueryInterface(Ci.nsIScriptError);
      const errMsg = error.lineNumber + ':' + error.columnNumber + ' - ' + error.errorMessage;

      const label = document.createElement('label');
      label.appendChild(document.createTextNode(errMsg));
      label.addEventListener('click', function () {
        goToLine(error.lineNumber, error.columnNumber);
      });
      errors.appendChild(label);
      errors.appendChild(document.createElement('br'));
      count++;

      if (count == 10) {
        errors.appendChild(document.createTextNode('...'));
        Services.console.unregisterListener(this);
      }
		}
	}

  Services.console.registerListener(errorListener);

  const styleEl = document.createElement('style');
  styleEl.appendChild(document.createTextNode(codeElementWrapper.value));
  document.documentElement.appendChild(styleEl);
  styleEl.remove();

  setTimeout(() => {
    if (count < 10)
      Services.console.unregisterListener(errorListener);
  });

	toggleUI('check-for-errors-button', false);
  sourceEditor.focus();
}

function goToLine (line, col) {
	sourceEditor.focus();
  sourceEditor.setCursor({line: line - 1, ch: col});
}

function insertCodeAtStart (snippet) {
	let position = codeElementWrapper.value.indexOf(snippet);
	if (position == -1) {
		codeElementWrapper.value = snippet + '\n' + codeElementWrapper.value;
    position = 0;
	}
  const positionEnd = position + snippet.length;

	codeElementWrapper.setSelectionRange(positionEnd, positionEnd);
	sourceEditor.focus();
}

function insertCodeAtCaret (snippet) {
	const selectionStart = codeElementWrapper.selectionStart;
	const selectionEnd = selectionStart + snippet.length;
	codeElementWrapper.value = codeElementWrapper.value.substring(0, codeElementWrapper.selectionStart) + snippet + codeElementWrapper.value.substring(codeElementWrapper.selectionEnd, codeElementWrapper.value.length);
	codeElementWrapper.setSelectionRange(selectionEnd, selectionEnd);
	sourceEditor.focus();
}

function changeWordWrap (bool, persist) {
	if (persist)
    xPref.set(UC.styloaix.PREF_LINEWRAPPING, bool);
	sourceEditor.setOption('lineWrapping', bool);
  sourceEditor.focus();
}

function instantPreview (bool, persist) {
  if (persist)
    xPref.set(UC.styloaix.PREF_INSTANTPREVIEW, bool);
  isInstantPreview = bool
  if (isInstantPreview && !timeoutRunning)
    instantTimeout();

  sourceEditor.focus();
}

function instantCheck (bool, persist) {
  if (persist)
    xPref.set(UC.styloaix.PREF_INSTANTCHECK, bool);
  isInstantCheck = bool
  if (isInstantCheck && !timeoutRunning)
    instantTimeout();

  sourceEditor.focus();
}

function insertDataURI() {
	const fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
	fp.init(window, 'Choose File…', Ci.nsIFilePicker.modeOpen);
	fp.open(res => {
    if (res != Ci.nsIFilePicker.returnOK)
      return;

    const contentType = Cc['@mozilla.org/mime;1'].getService(Ci.nsIMIMEService).getTypeFromFile(fp.file);
    const inputStream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
    inputStream.init(fp.file, parseInt('01', 16), parseInt('0600', 8), 0);
    const stream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream);
    stream.setInputStream(inputStream);
    const encoded = btoa(stream.readBytes(stream.available()));
    stream.close();
    inputStream.close();
    insertCodeAtCaret('data:' + contentType + ';base64,' + encoded);
  });
}

const codeElementWrapper = {
	get value() {
		return sourceEditor.getText();
	},

	set value(v) {
		sourceEditor.setText(v);
	},

	setSelectionRange: function (start, end) {
		sourceEditor.setSelection(sourceEditor.getPosition(start), sourceEditor.getPosition(end));
	},

	get selectionStart() {
		return sourceEditor.getOffset(sourceEditor.getCursor('start'));
	},

	get selectionEnd() {
		return sourceEditor.getOffset(sourceEditor.getCursor('end'));
	},

}

const closeFn = window.close;
let shouldHandle = true;

if (isChromeWindow) {
  window.close = function () {
    if (!unsaved || confirm('Do you want to close and lose unsaved changes?')) {
      shouldHandle = false;
      setTimeout(closeFn);
    }
  }
}

window.addEventListener('close', function (e) {
	e.preventDefault();
	window.close();
})

window.addEventListener('beforeunload', function (e) {
  if (shouldHandle && unsaved)
    e.preventDefault();
});

window.addEventListener('unload', function (event) {
  if (previewActive) {
    _uc.sss.unregisterSheet(previewCode, previewOrigin);
    if (origin === _uc.sss.AGENT_SHEET || lastOrigin === _uc.sss.AGENT_SHEET)
      UC.styloaix.forceRefresh();
  }

  if (style?.enabled && previewActive)
    style.register();
});

window.addEventListener('DOMContentLoaded', init, {once: true});
