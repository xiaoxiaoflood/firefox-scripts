/* :::::::: Sub-Script/Overlay Loader v3.0.48 mod Xiao ::::::::::::::: */

// automatically includes all files ending in .uc.xul and .uc.js from the profile's chrome folder

// New Features:
// supports Greasemonkey-style metadata for userChrome scripts and overlays
// supports a "main" shortcut for the main browser window in include/exclude lines
// supports regexes in the include/exclude lines
// scripts without metadata will run only on the main browser window, for backwards compatibility

// original: https://github.com/alice0775/userChrome.js/blob/master/userChrome.js

(function() {
    "use strict";
    // -- config --
    const EXPERIMENT = false; //実験:するtrue, しない[false]
    const EXCLUDE_CHROMEHIDDEN = false; //chromehiddenなwindow(popup等)ではロード: しないtrue, する[false]
    const USE_0_63_FOLDER = true; //0.63のフォルダ規則を使う[true], 使わないfalse
    const FORCESORTSCRIPT = false; //強制的にスクリプトをファイル名順でソートするtrue, しない[false]
    const AUTOREMOVEBOM = false; //BOMを自動的に, 取り除く:true, 取り除かない[false](元ファイルは.BOMとして残る)
    const REPLACECACHE = false; //スクリプトの更新日付によりキャッシュを更新する: true , しない:[false]
    //=====================USE_0_63_FOLDER = falseの時===================
    var UCJS = new Array("UCJSFiles", "userContent", "userMenu"); //UCJS Loader 仕様を適用 (NoScriptでfile:///を許可しておく)
    var arrSubdir = new Array("", "xul", "TabMixPlus", "withTabMixPlus", "SubScript", "UCJSFiles", "userCrome.js.0.8", "userContent", "userMenu"); //スクリプトはこの順番で実行される
    //===================================================================
    const ALWAYSEXECUTE = 'rebuild_userChrome.uc.js'; //常に実行するスクリプト
    var INFO = true;
    var BROWSERCHROME = "chrome://browser/content/browser.xul"; //Firfox
    //var BROWSERCHROME = "chrome://navigator/content/navigator.xul"; //SeaMonkey:
    // -- config --
    /* USE_0_63_FOLDER true の時
     * chrome直下およびchrome/xxx.uc 内の *.uc.js および *.uc.xul
     * chrome/xxx.xul 内の  *.uc.js , *.uc.xul および *.xul
     * chrome/xxx.ucjs 内の *.uc.js は 特別に UCJS Loader 仕様を適用(NoScriptでfile:///を許可しておく)
     */

    /* USE_0.63_FOLDER false の時
     *[ フォルダは便宜上複数のフォルダに分けているだけで任意。 下のarrSubdirで指定する ]
     *[ UCJS Loaderを適用するフォルダをUCJSで指定する                                  ]
      プロファイル-+-chrome-+-userChrome.js(このファイル)
                            +-*.uc.jsまたは*.uc.xul群
                            |
                            +-SubScript--------+-*.uc.jsまたは*.uc.xul群
                            |
                            +-UCJSFiles--------+-*.uc.jsまたは*.uc.xul群
                            | (UCJS_loaderでしか動かないもの JavaScript Version 1.7/日本語)
                            |
                            +-xul--------------+-*.xul, *.uc.xulおよび付随File
                            |
                            +-userCrome.js.0.8-+-*.uc.jsまたは*.uc.xul群 (綴りが変なのはなぜかって? )
     */


    //chrome/aboutでないならスキップ
    if (!/^(chrome:|about:)/i.test(location.href)
          || /^(about:(blank|newtab|home))/i.test(location.href)
          || location.href == 'chrome://global/content/commonDialog.xul'
          || location.href == 'chrome://global/content/alerts/alert.xul'
          || /.html?$/i.test(location.href))
      return;
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    window.userChrome_js = {
        USE_0_63_FOLDER: USE_0_63_FOLDER,
        UCJS: UCJS,
        arrSubdir: arrSubdir,
        FORCESORTSCRIPT: FORCESORTSCRIPT,
        ALWAYSEXECUTE: ALWAYSEXECUTE,
        AUTOREMOVEBOM: AUTOREMOVEBOM,
        INFO: INFO,
        BROWSERCHROME: BROWSERCHROME,
        EXCLUDE_CHROMEHIDDEN: EXCLUDE_CHROMEHIDDEN,
        REPLACECACHE: REPLACECACHE,
        EXPERIMENT: EXPERIMENT,

        //スクリプトデータを作成
        getScripts: function() {
            const ds = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
            var Start = new Date().getTime();
            //getdir
            if (this.USE_0_63_FOLDER) {
                var o = [""];
                this.UCJS = [];
                this.arrSubdir = [];
                var workDir = ds.get("UChrm", Ci.nsIFile);
                var dir = workDir.directoryEntries;
                while (dir.hasMoreElements()) {
                    var file = dir.getNext().QueryInterface(Ci.nsIFile);
                    if (!file.isDirectory())
                      continue;
                    var dirName = file.leafName;
                    if (/(uc|xul|ucjs)$/i.test(dirName)) {
                        o.push(dirName);
                        if (/ucjs$/i.test(dirName))
                            this.UCJS.push(dirName);
                    }
                }
                if (this.FORCESORTSCRIPT)
                    o.sort(cmp_name);
                [].push.apply(this.arrSubdir, o);
            }

            var that = this;

            this.dirDisable = restoreState((xPref.get("userChrome.disable.directory") || '').split(','));
            this.scriptDisable = restoreState((xPref.get("userChrome.disable.script") || '').split(','));
            this.scripts = [];
            this.overlays = [];

            this.directory = {
                name: [],
                UCJS: [],
                enable: []
            };
            for (var i = 0, len = this.arrSubdir.length; i < len; i++) {
                var s = [],
                    o = [];
                try {
                    var dir = this.arrSubdir[i] == "" ? "root" : this.arrSubdir[i];
                    this.directory.name.push(dir);
                    this.directory.UCJS.push(this.checkUCJS(dir));

                    var workDir = ds.get("UChrm", Ci.nsIFile);
                    workDir.append(this.arrSubdir[i]);
                    var files = workDir.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
                    var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
                    while (files.hasMoreElements()) {
                        var file = files.getNext().QueryInterface(Ci.nsIFile);
                        if (/\.uc\.js$|\.uc\.xul$/i.test(file.leafName)
                              || /\.xul$/i.test(file.leafName) && /\xul$/i.test(this.arrSubdir[i])) {
                            var script = this.getScriptData(file);
                            script.dir = dir;
                            if (/\.uc\.js$/i.test(script.filename)) {
                                script.ucjs = this.checkUCJS(script.file.path);
                                s.push(script);
                            } else {
                                script.xul = '<?xul-overlay href=\"' + script.url + '\"?>\n';
                                o.push(script);
                            }
                        }
                    }
                } catch (e) {}
                if (this.FORCESORTSCRIPT) {
                    s.sort(cmp_fname);
                    o.sort(cmp_fname);
                }
                [].push.apply(this.scripts, s);
                [].push.apply(this.overlays, o);
            }
            this.debug('Parsing getScripts: ' + ((new Date()).getTime() - Start) + 'msec');

            //nameを比較する関数
            function cmp_name(a, b) {
                if (a.toLowerCase() == b.toLowerCase())
                    return a < b ? -1 : 1;
                else
                    return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
            }

            function cmp_fname(a, b) {
                return cmp_name(a.filename, b.filename);
            }

            function restoreState(a) {
                try {
                    var sd = [];
                    for (var i = 0, max = a.length; i < max; ++i) sd[a[i]] = true;
                    return sd;
                } catch (e) {
                    return [];
                }
            }
        },

        //メタデータ収集
        getScriptData: function (aFile) {
            var aContent = this.readFile(aFile);
            var charset, description, author, version;
            var header = (aContent.match(/^\/\/ ==UserScript==[ \t]*\n(?:.*\n)*?\/\/ ==\/UserScript==[ \t]*\n/m) || [""])[0];
            var match, rex = {
                include: [],
                exclude: []
            };
            var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
            if (mediator.getMostRecentWindow("navigator:browser"))
                var mainWindowURL = that.BROWSERCHROME;
            else if (mediator.getMostRecentWindow("mail:3pane"))
                var mainWindowURL = "chrome://messenger/content/messenger.xul";
            var findNextRe = /^\/\/ @(include|exclude)[ \t]+(\S+)/gm;
            while ((match = findNextRe.exec(header))) {
                rex[match[1]].push(match[2].replace(/^main$/i, mainWindowURL).replace(/\W/g, "\\$&").replace(/\\\*/g, ".*?"));
            }
            if (rex.include.length == 0) rex.include.push(mainWindowURL);
            var exclude = rex.exclude.length > 0 ? "(?!" + rex.exclude.join("$|") + "$)" : "";

            match = header.match(/\/\/ @charset\b(.+)\s*/i);
            charset = "";
            //try
            if (match)
                charset = match.length > 0 ? match[1].replace(/^\s+/, "") : "";

            match = header.match(/\/\/ @description\b(.+)\s*/i);
            description = "";
            //try
            if (match)
                description = match.length > 0 ? match[1].replace(/^\s+/, "") : "";
            //}catch(e){}
            if (description == "" || !description)
                description = aFile.leafName;

            // version
            match = header.match(/\/\/ @version\b(.+)\s*/i);
            version = "";
            if(match && match.length)
              version = match[1].replace(/^\s+/,"").split(" ")[0];

            // author
            match = header.match(/\/\/ @author\b(.+)\s*/i);
            author = "";
            if(match)
              author = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // name
            match = header.match(/\/\/ @name\b(.+)\s*/i);
            var name = "";
            if(match)
              name = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // namespace
            match = header.match(/\/\/ @namespace\b(.+)\s*/i);
            var namespace = "";
            if(match)
              namespace = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // homepageURL
            match = header.match(/\/\/ @homepage(?:URL)?\b(.+)\s*/i);
            var homepageURL = "";
            if(match)
              homepageURL = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // reviewURL
            match = header.match(/\/\/ @reviewURL\b(.+)\s*/i);
            var reviewURL = "";
            if(match)
              reviewURL = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // downloadURL
            match = header.match(/\/\/ @downloadURL\b(.+)\s*/i);
            var downloadURL = "";
            if(match)
              downloadURL = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // updateURL
            match = header.match(/\/\/ @updateURL\b(.+)\s*/i);
            var updateURL = "";
            if(match)
              updateURL = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // optionsURL
            match = header.match(/\/\/ @optionsURL\b(.+)\s*/i);
            var optionsURL = "";
            if(match)
              optionsURL = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // fullDescription
            match = header.match(/\/\/ @note\b(.+)\s*/ig);
            var fullDescription = "";
            var notes = [];
            if(match && match.length){
              for (var i = 0; i < match.length; i++) {
                notes[i] = match[i].replace(/^\/\/ @note\s+/i, "");
              }
              fullDescription = "\n" + notes.join("\n");
            }

            // id
            match = header.match(/\/\/ @id\b(.+)\s*/i);
            var id = "";
            if(match)
              id = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // inspect
            match = header.match(/\/\/ @inspect\b(.+)\s*/i);
            var inspect = "";
            if(match)
              inspect = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // startup
            match = header.match(/\/\/ @startup\b(.+)\s*/i);
            var startup = "";
            if(match)
              startup = match.length > 0 ? match[1].replace(/^\s+/,"") : ""

            // shutdown
            match = header.match(/\/\/ @shutdown\b(.+)\s*/i);
            var shutdown = "";
            if(match)
              shutdown = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            // config
            match = header.match(/\/\/ @config\b(.+)\s*/i);
            var config = "";
            if(match)
              config = match.length > 0 ? match[1].replace(/^\s+/,"") : "";

            var url = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile),
                filename = aFile.leafName || '';

            return {
                filename: filename,
                file: aFile,
                url: url,
                name: name,
                namespace: namespace,
                charset: charset,
                description: description,
                version: version,
                author: author,
                regex: new RegExp("^" + exclude + "(" + (rex.include.join("|") || ".*") + ")$", "i"),
                id: id ? id : filename + '@' + (namespace || author || 'userChromejs'),
                get type() {
                  return /\.uc(?:-\d+)?\.js$/i.test(this.filename) ? 'js' :
                               /\.uc(?:-\d+)?\.xul$/i.test(this.filename) ? 'xul' : '';
                },
                homepageURL: homepageURL,
                reviewURL: reviewURL,
                get downloadURL() {
                  return downloadURL;// || (userChromejs && userChromejs.store.get(filename, {}).installURL); savescript.js
                },
                updateURL: updateURL,
                optionsURL: optionsURL,
                fullDescription: fullDescription,

                inspect: inspect,
                get canInspect() {
                  return ('@mozilla.org/commandlinehandler/general-startup;1?type=inspector' in Cc) && !!this.inspect;
                },
                startup: startup,
                shutdown: shutdown,
                onlyonce: /\/\/ @onlyonce\b/.test(header),
                isRunning: false,
                config: config,
                get isEnabled() {
                  return !userChrome_js.scriptDisable[this.filename];
                },
                get canUpdate() {
                  return this.downloadURL && this.downloadURL.indexOf('http') === 0;
                }
            }
        },

        //スクリプトファイル文字コード変換読み込み
        deleteBOMreadFile: function (aFile, metaOnly) {
            var UI = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            UI.charset = "UTF-8";
            var bytes = this.readBinary(aFile);
            if (bytes.length > 3 && bytes.substring(0, 3) == String.fromCharCode(239, 187, 191)) {
                aFile.copyTo(null, aFile.leafName + ".BOM");
                bytes = bytes.substring(3, bytes.length);
                this.writeFile(aFile, bytes);
                return UI.ConvertToUnicode(bytes).replace(/\r\n?/g, "\n");
            }
            var charset = this.getCharset(bytes);
            //window.userChrome_js.debug(aFile.leafName + " " +charset);
            if (charset == "UTF-8" || charset == "us-ascii") {
                return UI.ConvertToUnicode(bytes).replace(/\r\n?/g, "\n");
            } else {
                UI.charset = charset;
                aFile.copyTo(null, aFile.leafName + "." + UI.charset);
                bytes = UI.ConvertToUnicode(bytes);
                UI.charset = "UTF-8";
                this.writeFile(aFile, UI.ConvertFromUnicode(bytes));
                return bytes.replace(/\r\n?/g, "\n");
            }
        },

        //スクリプトファイル読み込み
        readFile: function (aFile, metaOnly = false) {
            if (this.AUTOREMOVEBOM)
                return this.deleteBOMreadFile(aFile, metaOnly);
            var stream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            stream.init(aFile, 0x01, 0, 0);
            var cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
            cvstream.init(stream, "UTF-8", 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            var content = "",
                data = {};
            while (cvstream.readString(4096, data)) {
                content += data.value;
                if (metaOnly &&
                    content.indexOf('// ==/UserScript==') > 0)
                    break;
            }
            cvstream.close();
            return content.replace(/\r\n?/g, "\n");
        },

        checkUCJS: function (aPath) {
            for (var i = 0, len = this.UCJS.length; i < len; i++) {
                if (aPath.indexOf(this.UCJS[i], 0) > -1)
                    return true;
            }
            return false;
        },

        charCode: function (str) {
            if (/\x1B\x24(?:[\x40\x42]|\x28\x44)/.test(str))
                return 'ISO-2022-JP';
            if (/[\x80-\xFE]/.test(str)) {
                var buf = RegExp.lastMatch + RegExp.rightContext;
                if (/[\xC2-\xFD][^\x80-\xBF]|[\xC2-\xDF][\x80-\xBF][^\x00-\x7F\xC2-\xFD]|[\xE0-\xEF][\x80-\xBF][\x80-\xBF][^\x00-\x7F\xC2-\xFD]/.test(buf))
                    return (/[\x80-\xA0]/.test(buf)) ? 'Shift_JIS' : 'EUC-JP';
                if (/^(?:[\x00-\x7F\xA1-\xDF]|[\x81-\x9F\xE0-\xFC][\x40-\x7E\x80-\xFC])+$/.test(buf))
                    return 'Shift_JIS';
                if (/[\x80-\xA0]/.test(buf))
                    return 'UTF-8';
                return 'EUC-JP';
            } else
                return 'us-ascii';
        },

        //文字コードを得る
        getCharset: function (str) {
            var charset = this.charCode(str);
            if (charset == "UTF-8" || charset == "us-ascii")
                return charset;

            //判定に失敗している場合があるので, 再チェック (鈍くさ);
            var UI = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            try {
                UI.charset = "UTF-8";
                if (str === UI.ConvertFromUnicode(UI.ConvertToUnicode(str)))
                    return "UTF-8";
            } catch (ex) {}
            try {
                UI.charset = charset;
                if (str === UI.ConvertFromUnicode(UI.ConvertToUnicode(str)))
                    return charset;
            } catch (ex) {}
            return "UTF-8";
        },

        //バイナリ書き込み
        writeFile: function (aFile, aData) {
            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            // ファイル追記の際は、0x02 | 0x10 を使う
            foStream.init(aFile, 0x02 | 0x08 | 0x20, parseInt(664, 8), 0); // write, create, truncate
            foStream.write(aData, aData.length);
            foStream.close();
            return aData;
        },

        //バイナリ読み込み
        readBinary: function (aFile) {
            var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            istream.init(aFile, -1, -1, false);

            var bstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
            bstream.setInputStream(istream);
            return bstream.readBytes(bstream.available());
        },

        getLastModifiedTime: function(aScriptFile) {
            try {
                if (this.REPLACECACHE) {
                    var aLocalfile = Components.classes["@mozilla.org/file/local;1"]
                        .createInstance(Components.interfaces.nsIFile);
                    aLocalfile.initWithPath(aScriptFile.path);
                    return aLocalfile.lastModifiedTime;
                }
                return aScriptFile.lastModifiedTime;
            } catch (e) {}
            return "";
        },

        //window.userChrome_js.loadOverlay
        shutdown: false,
        everLoaded: [],
        overlayWait: 0,
        overlayUrl: [],
        loadOverlay: function(url, observer, doc) {
            window.userChrome_js.overlayUrl.push([url, observer, doc]);
            if (!window.userChrome_js.overlayWait)
              window.userChrome_js.load(++window.userChrome_js.overlayWait);

        },

        load: function() {
            if (!window.userChrome_js.overlayUrl.length)
              return --window.userChrome_js.overlayWait;
            var [url, aObserver, doc] = this.overlayUrl.shift();
            if (!!aObserver && typeof aObserver == 'function') {
                aObserver.observe = aObserver;
            }
            if (!doc)
              doc = document;
            if (!(doc instanceof XULDocument))
                return 0;
            var observer = {
                observe: function(subject, topic, data) {
                    if (topic == 'xul-overlay-merged') {
                        //XXX We just caused localstore.rdf to be re-applied (bug 640158)
                        if ("retrieveToolbarIconsizesFromTheme" in window)
                            retrieveToolbarIconsizesFromTheme();
                        if (!!aObserver && typeof aObserver.observe == 'function') {
                            try {
                                aObserver.observe(subject, topic, data);
                            } catch (ex) {
                                window.userChrome_js.error(url, ex);
                            }
                        }
                        if ('userChrome_js' in window)
                            window.userChrome_js.load();
                    }
                },
                QueryInterface: function(aIID) {
                    if (!aIID.equals(Components.interfaces.nsISupports) &&
                        !aIID.equals(Components.interfaces.nsIObserver))
                        throw Components.results.NS_ERROR_NO_INTERFACE;
                    return this
                }
            };
            //if (this.INFO) this.debug("document.loadOverlay: " + url);
            try {
                if (window.userChrome_js.shutdown)
                  return;
                doc.loadOverlay(url, observer);
            } catch (ex) {
                window.userChrome_js.error(url, ex);
            }
            return 0;
        },

        //xulを読み込む
        runOverlays: function(doc) {
            try {
                var dochref = doc.location.href.replace(/#.*$/, "");
            } catch (e) {
                return;
            }

            var overlay;

            if (!this.EXPERIMENT && true) { //← uc.jsでのloadOverlayに対応
                for (var m = 0, len = this.overlays.length; m < len; m++) {
                    overlay = this.overlays[m];
                    if (!!this.dirDisable['*']
                        || !!this.dirDisable[overlay.dir]
                        || !!this.scriptDisable[overlay.filename]) continue;

                    // decide whether to run the script
                    if (overlay.regex.test(dochref)) {
                        if (this.INFO) this.debug("loadOverlay: " + overlay.filename);
                        this.loadOverlay(overlay.url + "?" + this.getLastModifiedTime(overlay.file), null, doc);
                        overlay.isRunning = true;
                    }
                }
            } else {
                var XUL = '<?xml version="1.0"?>\n';
                var count = 0;
                for (var m = 0, len = this.overlays.length; m < len; m++) {
                    overlay = this.overlays[m];
                    if (!!this.dirDisable['*']
                        || !!this.dirDisable[overlay.dir]
                        || !!this.scriptDisable[overlay.filename]) continue;
                    // decide whether to run the script
                    if (overlay.regex.test(dochref)) {
                        XUL += overlay.xul;
                        count++;
                    }
                }
                if (count == 0) return;
                XUL += '<overlay id="userChrome.uc.js-overlay" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" xmlns:html="http://www.w3.org/1999/xhtml">\n</overlay>\n';
                try {
                    if (this.INFO) this.debug("loadOverlay: " + XUL);
                    this.loadOverlay("data:application/vnd.mozilla.xul+xml;charset=utf-8," + XUL, null, doc);
                    overlay.isRunning = true;
                } catch (ex) {
                    this.error(XUL, ex);
                }
            }
        },

        //uc.jsを読み込む
        runScripts: function(doc) {
            if (!(doc instanceof XULDocument))
                return;
            if (!!this.dirDisable['*']) return;

            const Cc = Components.classes;
            const Ci = Components.interfaces;

            for (var m = 0, len = this.scripts.length; m < len; m++) {
                this.loadScript(this.scripts[m], doc);
            }
        },
        
        loadScript: function (script, doc) {
            if (!script.regex.test(doc.location.href.replace(/#.*$/, ""))
                || (script.filename != this.ALWAYSEXECUTE
                    && (!!this.dirDisable[script.dir]
                        || !!this.scriptDisable[script.filename]))) {
                return;
            }
            if (script.onlyonce && script.isRunning) {
              if (script.startup) {
                var win = doc.defaultView;
                eval(script.startup);
              }
              return;
            }
            if (script.ucjs) { //for UCJS_loader
                if (this.INFO) this.debug("loadUCJSSubScript: " + script.filename);
                var aScript = doc.createElementNS("http://www.w3.org/1999/xhtml", "script");
                aScript.type = "application/javascript";
                aScript.src = script.url + "?" + this.getLastModifiedTime(script.file);
                try {
                    doc.documentElement.appendChild(aScript);
                } catch (ex) {
                    this.error(script.filename, ex);
                }
            } else { //Not for UCJS_loader
                if (this.INFO) this.debug("loadSubScript: " + script.filename);
                try {
                    if (script.charset)
                        Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader)
                          .loadSubScript(script.url + "?" + this.getLastModifiedTime(script.file), doc.defaultView, script.charset);
                    else
                        Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader)
                          .loadSubScript(script.url + "?" + this.getLastModifiedTime(script.file), doc.defaultView, "UTF-8");
                    script.isRunning = true;
                    if (script.startup) {
                      var win = doc.defaultView;
                      eval(script.startup);
                    }
                    if (!script.shutdown)
                      this.everLoaded.push(script.id);
                } catch (ex) {
                    this.error(script.filename, ex);
                }
            }
        },

        debug: function(aMsg) {
            Components.classes["@mozilla.org/consoleservice;1"]
                .getService(Components.interfaces.nsIConsoleService)
                .logStringMessage(aMsg);
        },

        error: function(aMsg, err) {
            const CONSOLE_SERVICE = Components.classes['@mozilla.org/consoleservice;1']
                .getService(Components.interfaces.nsIConsoleService);
            var error = Components.classes['@mozilla.org/scripterror;1']
                .createInstance(Components.interfaces.nsIScriptError);
            if (typeof(err) == 'object') error.init(aMsg + '\n' + err.name + ' : ' + err.message, err.fileName || null, null, err.lineNumber, null, 2, err.name);
            else error.init(aMsg + '\n' + err + '\n', null, null, null, null, 2, null);
            CONSOLE_SERVICE.logMessage(error);
        }
    };

    var that = window.userChrome_js;
    window.addEventListener("unload", function() {
        that.shutdown = true;
    }, false);

    //少しでも速くするためスクリプトデータの再利用
    if (xPref.get("userChrome.enable.reuse") != false) {
        //現在のメインウィンドウは一度もuserChrome.jsのスクリプトで初期化されていない?
        if (!that.getScriptsDone) {
            //Firefox or Thunderbard?
            var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
            if (mediator.getMostRecentWindow("navigator:browser"))
                var windowType = "navigator:browser";
            else if (mediator.getMostRecentWindow("mail:3pane"))
                var windowType = "mail:3pane";
            var enumerator = mediator.getEnumerator(windowType);
            //他の身内のメインウィンドウではどうかな?
            while (enumerator.hasMoreElements()) {
                var win = enumerator.getNext();
                //身内のメインウインドウは初期状態でない?
                if (win.userChrome_js && win.userChrome_js.getScriptsDone) {
                    //オブジェクトはたぶんこのウインドウのを複製すりゃいいんじゃぁないかな
                    that.UCJS = win.userChrome_js.UCJS;
                    that.arrSubdir = win.userChrome_js.arrSubdir;
                    that.scripts = win.userChrome_js.scripts;
                    that.overlays = win.userChrome_js.overlays;
                    that.dirDisable = win.userChrome_js.dirDisable;
                    that.scriptDisable = win.userChrome_js.scriptDisable;
                    that.getScriptsDone = true;
                    break;
                }
            }
        }
    }

    if (!that.getScriptsDone) {
        if (that.INFO) that.debug("getScripts");
        that.getScripts();
        that.getScriptsDone = true;
    } else {
        if (that.INFO) that.debug("skip getScripts");
    }
    
    var doc = document;

    //Bug 330458 Cannot dynamically load an overlay using document.loadOverlay
    //until a previous overlay is completely loaded

    if (that.INFO) that.debug("load " + location.href);

    //chromehiddenならロードしない
    if (location.href === that.BROWSERCHROME &&
        that.EXCLUDE_CHROMEHIDDEN &&
        document.documentElement.getAttribute("chromehidden") != "")
        return;

    if (!that.EXPERIMENT) {
        setTimeout(function(doc) {
            that.runScripts(doc);
            //面倒だからFirefox 3 の場合はeditBookmarkOverlay.xulを先読みしておく
            var delay = 500;
            if (location.href === that.BROWSERCHROME &&
                typeof StarUI != 'undefined' &&
                !(StarUI._overlayLoading || StarUI._overlayLoaded)) {
                // xxxx bug 726440
                StarUI._overlayLoading = true;
                that.loadOverlay(
                    "chrome://browser/content/places/editBookmarkOverlay.xul",
                    (function(aSubject, aTopic, aData) {
                        //XXX We just caused localstore.rdf to be re-applied (bug 640158)
                        if ("retrieveToolbarIconsizesFromTheme" in window)
                            retrieveToolbarIconsizesFromTheme();

                        // Move the header (star, title, button) into the grid,
                        // so that it aligns nicely with the other items (bug 484022).
                        let header = this._element("editBookmarkPanelHeader");
                        let rows = this._element("editBookmarkPanelGrid").lastChild;
                        rows.insertBefore(header, rows.firstChild);
                        header.hidden = false;

                        this._overlayLoading = false;
                        this._overlayLoaded = true;
                        //this._doShowEditBookmarkPanel(aItemId, aAnchorElement, aPosition);
                    }).bind(StarUI)
                );
                delay = 0;
            }
            setTimeout(function(doc) {
                that.runOverlays(doc);
            }, delay, doc);
        }, 500, doc);
    } else {
        that.runScripts(doc);
        //面倒だからFirefox 3 の場合はeditBookmarkOverlay.xulを先読みしておく
        if (location.href === that.BROWSERCHROME &&
            typeof StarUI != 'undefined' &&
            !(StarUI._overlayLoading || StarUI._overlayLoaded)) {
            // xxxx bug 726440
            StarUI._overlayLoading = true;
            that.loadOverlay(
                "chrome://browser/content/places/editBookmarkOverlay.xul",
                (function(aSubject, aTopic, aData) {
                    //XXX We just caused localstore.rdf to be re-applied (bug 640158)
                    if ("retrieveToolbarIconsizesFromTheme" in window)
                        retrieveToolbarIconsizesFromTheme();

                    // Move the header (star, title, button) into the grid,
                    // so that it aligns nicely with the other items (bug 484022).
                    let header = this._element("editBookmarkPanelHeader");
                    let rows = this._element("editBookmarkPanelGrid").lastChild;
                    rows.insertBefore(header, rows.firstChild);
                    header.hidden = false;

                    this._overlayLoading = false;
                    this._overlayLoaded = true;
                    //this._doShowEditBookmarkPanel(aItemId, aAnchorElement, aPosition);
                }).bind(StarUI)
            );
        }
        that.runOverlays(doc);
    }

    //Sidebar for Trunc
    if (location.href != that.BROWSERCHROME) return;
    window.document.addEventListener("load",
        function(event) {
            if (!event.originalTarget.location) return;
            if (/^(about:(blank|newtab|home))/i.test(event.originalTarget.location.href)) return;
            if (!/^(about:|chrome:)/.test(event.originalTarget.location.href)) return;
            var doc = event.originalTarget;
            var href = doc.location.href;
            if (that.INFO) that.debug("load Sidebar " + href);
            setTimeout(function(doc) {
                that.runScripts(doc);
                setTimeout(function(doc) {
                    that.runOverlays(doc);
                }, 0, doc);
            }, 0, doc);
            if (href != "chrome://browser/content/web-panels.xul") return;
            if (!window.document.getElementById("sidebar")) return;
            var sidebarWindow = window.document.getElementById("sidebar").contentWindow;
            if (sidebarWindow) {
                loadInWebpanel.init(sidebarWindow);
            }
        }, true);
    var loadInWebpanel = {
        sidebarWindow: null,
        init: function(sidebarWindow) {
            this.sidebarWindow = sidebarWindow;
            this.sidebarWindow.document.getElementById("web-panels-browser").addEventListener("load", this, true);
            this.sidebarWindow.addEventListener("unload", this, false);
        },
        handleEvent: function(event) {
            switch (event.type) {
                case "unload":
                    this.uninit(event);
                    break;
                case "load":
                    this.load(event);
                    break;
            }
        },
        uninit: function(event) {
            this.sidebarWindow.document.getElementById("web-panels-browser").removeEventListener("load", this, true);
            this.sidebarWindow.removeEventListener("unload", this, false);
        },
        load: function(event) {
            var doc = event.originalTarget;
            var href = doc.location.href;
            if (!/^chrome:/.test(href)) return;
            if (that.INFO) that.debug("load Webpanel " + href);
            setTimeout(function(doc) {
                that.runScripts(doc);
                setTimeout(function(doc) {
                    that.runOverlays(doc);
                }, 0, doc);
            }, 0, doc);
        }
    }
})();
