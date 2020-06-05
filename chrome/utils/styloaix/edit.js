const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
const {require} = ChromeUtils.import('resource://devtools/shared/Loader.jsm');
const {NetUtil} = ChromeUtils.import('resource://gre/modules/NetUtil.jsm');

docShell.cssErrorReportingEnabled = true;

let require2 = function require_mini (m) {
	let scope = {
		exports: {}
	};
	scope.module = {
		exports: scope.exports
  };
	let module = 'chrome://' + m + '.js';
	Services.scriptloader.loadSubScript(module, scope);
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
let unsaved = false;
let previewCode = Services.io.newURI('data:text/css;charset=UTF-8,');
let previewOrigin = 0;
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
        securityFlags: Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_INHERITS,
        contentPolicyType: Ci.nsIContentPolicy.TYPE_OTHER,
      },
      async function (stream) {
        let bstream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(stream);

        try {
          initialCode = bstream.readBytes(bstream.available());
        } catch {}

        stream.close();

        try {
          let converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
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
  document.getElementById('origin').value = origin;
	nameE.addEventListener('input', function () {
    unsaved = true;
    toggleUI('save-button', true);
  });

  document.getElementById('errors').addEventListener('click', function (e) {
    if (e.target == this)
      this.style.display = 'none';
  });

  isInstantPreview = xPref.get(UC.styloaix.PREF_INSTANTPREVIEW);
  document.getElementById('instant-preview').checked = isInstantPreview;
  isInstantCheck = xPref.get(UC.styloaix.PREF_INSTANTCHECK);
  document.getElementById('instant-check').checked = isInstantCheck;
  if (style?.enabled == false)
    toggleUI('preview-button', true);
  interval = xPref.get(UC.styloaix.PREF_INSTANTINTERVAL);
  xPref.addListener(UC.styloaix.PREF_INSTANTINTERVAL, function (ms) {
    interval = ms;
  });
}

function initEditor () {
  let Editor = require('devtools/client/shared/sourceeditor/editor');

  let extraKeys = {};
  extraKeys[Editor.accel('S')] = save;
  extraKeys['F3'] = 'findNext';
  extraKeys['Shift-F3'] = 'findPrev';

  let lineWrapping = xPref.get(UC.styloaix.PREF_LINEWRAPPING);
  document.getElementById('wrap-lines').checked = lineWrapping;
  sourceEditor = new Editor({
    mode: Editor.modes.css,
    contextMenu: 'sourceEditorContextMenu',
    extraKeys: extraKeys,
    lineNumbers: true,
    lineWrapping: lineWrapping,
    value: initialCode,
  });
  
  sourceEditor.setupAutoCompletion = function () {
    this.extend(require2('userchromejs/content/styloaix/autocomplete'));
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
    if (!timeoutRunning)
      instantTimeout();

    unsaved = true;
    toggleUI('save-button', true);
    if (!isInstantPreview)
      toggleUI('preview-button', true);
    if (!isInstantCheck)
    toggleUI('check-for-errors-button', true);
  });
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

  let finalTitle = nameE.value + (origin == 0 ? '.as' : origin == 1 ? '.us' : '') + '.css';
  let file = UC.styloaix.CSSDIR.clone();
  file.append(finalTitle);
  if(!file.exists())
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);

  let ostream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
  ostream.init(file, -1, -1, 0);

  let converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = 'UTF-8';
  let istream = converter.convertToInputStream(codeElementWrapper.value);

  NetUtil.asyncCopy(istream, ostream, function (aResult) {
    if (Components.isSuccessCode(aResult)) {
      let enabled = style ? style.enabled : true;

      if (style && finalTitle != style.fullName) {
        let oldFile = UC.styloaix.CSSDIR.clone()
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
      UC.styloaix.rebuildMenu();
      if (UC.styloaix.enabled && enabled)
        style.register();

      unsaved = false;
      
      if (previewActive) {
        _uc.sss.unregisterSheet(previewCode, previewOrigin);
        previewActive = false;
      }
      toggleUI('save-button', false);
      if (enabled)
        toggleUI('preview-button', false);
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
  if (style?.enabled)
    style.unregister();
	previewCode = Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(codeElementWrapper.value));
  previewOrigin = origin;
  _uc.sss.loadAndRegisterSheet(previewCode, previewOrigin);
  previewActive = true;

  checkForErrors();
	toggleUI('preview-button', false);
  sourceEditor.focus();
}

function checkForErrors () {
	let errors = document.getElementById('errors');
	errors.style.display = 'none';

	while (errors.hasChildNodes())
		errors.removeChild(errors.lastChild);

  let count = 0;

	let errorListener = {
		observe: function (message) {
      if (!count)
        errors.style.display = 'block';

      let error = message.QueryInterface(Ci.nsIScriptError);
      let newmessage = error.lineNumber + ':' + error.columnNumber + ' - ' + error.errorMessage;

      let label = document.createElement('label');
      label.appendChild(document.createTextNode(newmessage));
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

  let styleEl = document.createElement('style');
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
  let positionEnd = position + snippet.length;

	codeElementWrapper.setSelectionRange(positionEnd, positionEnd);
	sourceEditor.focus();
}

function insertCodeAtCaret (snippet) {
	let selectionStart = codeElementWrapper.selectionStart;
	let selectionEnd = selectionStart + snippet.length;
	codeElementWrapper.value = codeElementWrapper.value.substring(0, codeElementWrapper.selectionStart) + snippet + codeElementWrapper.value.substring(codeElementWrapper.selectionEnd, codeElementWrapper.value.length);
	codeElementWrapper.setSelectionRange(selectionEnd, selectionEnd);
	sourceEditor.focus();
}

function changeWordWrap (bool) {
	xPref.set(UC.styloaix.PREF_LINEWRAPPING, bool);
	sourceEditor.setOption('lineWrapping', bool);
  sourceEditor.focus();
}

function instantPreview (bool) {
  isInstantPreview = bool
  if (isInstantPreview && !timeoutRunning)
    instantTimeout();

  sourceEditor.focus();
}

function instantCheck (bool) {
  isInstantCheck = bool
  if (isInstantCheck && !timeoutRunning)
    instantTimeout();

  sourceEditor.focus();
}

function insertDataURI() {
	let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
	fp.init(window, 'Choose File…', Ci.nsIFilePicker.modeOpen);
	fp.open(res => {
    if (res != Ci.nsIFilePicker.returnOK) {  
      return;
    }
    let file = fp.file;
    let contentType = Cc['@mozilla.org/mime;1'].getService(Ci.nsIMIMEService).getTypeFromFile(file);
    let inputStream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
    inputStream.init(file, parseInt('01', 16), parseInt('0600', 8), 0);
    let stream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream);
    stream.setInputStream(inputStream);
    let encoded = btoa(stream.readBytes(stream.available()));
    stream.close();
    inputStream.close();
    insertCodeAtCaret('data:' + contentType + ';base64,' + encoded);
  });
}

let codeElementWrapper = {
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

let closeFn = window.close;
let shouldHandle = true;

if (isChromeWindow) {
  window.close = function () {
    if (!unsaved || confirm('Do you want to close and lose unsaved changes?')) {
      shouldHandle = false;
      setTimeout(closeFn);// por algum motivo precisa do setTimeout no Ctrl+W.
    }
  }
}

window.addEventListener('close', function (e) {
	e.preventDefault();
	window.close();
})

window.addEventListener('beforeunload', function (e) {
  if (shouldHandle && unsaved) {
    e.preventDefault();
  }
});

window.addEventListener('unload', function (event) {
  if (previewActive)
    _uc.sss.unregisterSheet(previewCode, previewOrigin);
  if (style?.enabled && previewActive)
    style.register();
});

window.addEventListener('DOMContentLoaded', init, {once: true});
