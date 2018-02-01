var EXPORTED_SYMBOLS = [];

// http://forum.mozilla-russia.org/viewtopic.php?pid=746461#p746461

try {(({Preferences, Services}, {classes: Cc, interfaces: Ci, utils: Cu}) => {
    if (parseInt(Services.appinfo.version) < 58) return;

    var urls = new Set(), file = Services.dirsvc.get("ProfD", Ci.nsIFile);

    var skip = addon =>
        addon.type != "extension" || addon.bootstrap
        || ("location" in addon && addon.location != "app-profile")
        || addon.userDisabled || addon.appDisabled || addon.softDisabled;

    var files = (dir, callback) => {
        if (!dir.exists() || !dir.isDirectory()) return;
        var en = dir.directoryEntries;
        while(en.hasMoreElements()) {
            var file = en.getNext().QueryInterface(Ci.nsIFile);
            if (file.isFile()) callback(file);
        }
    }
    var fromZip = file => {
        var zr = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
        try {
            zr.open(file);
            var prfx = "jar:" + Services.io.newFileURI(file).spec + "!/";
            var en = zr.findEntries("defaults/preferences/*.js$");
            while(en.hasMore()) urls.add(prfx + en.getNext());
        }
        finally {zr.close();}
    }
    var fromDir = dir => {
        ["defaults", "preferences"].forEach(dir.append);
        if (dir.exists() && dir.isDirectory()) files(dir, file =>
            file.leafName.endsWith(".js") && urls.add(Services.io.newFileURI(file).spec)
        );
    }
    var readFile = "readFile" in Cu ? "readFile" : "readUTF8File";

    var staged = file.clone(), stagedIds = new Set();
    ["extensions", "staged"].forEach(staged.append);
    if (staged.exists() && staged.isDirectory()) files(staged, file => {
        if (!file.leafName.endsWith(".json")) return;
        var addon = JSON.parse(Cu[readFile](file));
        if (skip(addon)) return;

        stagedIds.add(addon.id);
        file.initWithPath(file.path.replace(/\.json$/, ".xpi"));
        if (file.exists() && file.isFile()) fromZip(file);
        else {
            file.initWithPath(file.path.slice(0, -4));
            if (file.exists() && file.isDirectory()) fromDir(file);
        }
    });

    file.append("extensions.json");
    if (file.exists() && file.isFile()) {
        var {addons} = JSON.parse(Cu[readFile](file));
        addons.forEach(addon => {
            if (skip(addon) || stagedIds.has(addon.id)) return;
            file.initWithPath(addon.path);
            if (!file.exists()) return;

            if (file.isFile()) fromZip(file);
            else if (file.isDirectory()) fromDir(file);
        });
    }
    if (!urls.size) return;

    var prefs = new Preferences({defaultBranch: true});
    var obj = {
        pref: function(key, val) {
            if (!/^chrome:\/\/.+\.properties$/.test(val))
                return prefs.set(key, val);
            var pls = Cc["@mozilla.org/pref-localizedstring;1"]
                .createInstance(Ci.nsIPrefLocalizedString);
            pls.data = val;
            prefs._prefBranch.setComplexValue(key, Ci.nsIPrefLocalizedString, pls);
        }
    };
    urls.forEach(url => {try {
        Services.scriptloader.loadSubScript(url, obj);
    } catch(e) {}});

})(Components.utils.import("resource://gre/modules/Preferences.jsm", {}), Components);} catch(ex) {}
