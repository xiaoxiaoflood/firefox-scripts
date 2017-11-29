let EXPORTED_SYMBOLS = ['xPref'];

let {
  classes: Cc,
  interfaces: Ci,
  utils: Cu
} = Components;

Cu.import('resource://gre/modules/Services.jsm');

let xPref = {
  // Retorna o valor da preferência, seja qual for o tipo, mas não
  // testei com tipos complexos como nsIFilem, não sei como detectar
  // uma preferência assim, na verdade nunca vi uma
  get: function (prefPath, def = false) {
    let sPrefs = def ?
                   Services.prefs.getDefaultBranch(null) :
                   Services.prefs;

    switch (sPrefs.getPrefType(prefPath)) {
      case 32:
        return sPrefs.getStringPref(prefPath);
      case 64:
        return sPrefs.getIntPref(prefPath);
      case 128:
        return sPrefs.getBoolPref(prefPath);
    }
    return;
  },

  set: function (prefPath, value, def = false) {
    let sPrefs = def ?
                   Services.prefs.getDefaultBranch(null) :
                   Services.prefs;

    switch (typeof value) {
      case 'string':
        return sPrefs.setCharPref(prefPath, value);
      case 'number':
        return sPrefs.setIntPref(prefPath, value);
      case 'boolean':
        return sPrefs.setBoolPref(prefPath, value);
    }
    return;
  },

  lock: function (prefPath, value) {
    let sPrefs = Services.prefs;
    xPref.lockedBackupDef[prefPath] = xPref.get(prefPath, true);
    if (sPrefs.prefIsLocked(prefPath))
      sPrefs.unlockPref(prefPath);

    xPref.set(prefPath, value, true);
    sPrefs.lockPref(prefPath);
  },

  lockedBackupDef: {},

  unlock: function (prefPath) {
    Services.prefs.unlockPref(prefPath);
    xPref.set(prefPath, xPref.lockedBackupDef[prefPath], true);
  },

  clear: Services.prefs.clearUserPref,

  // Detecta mudanças na preferência e retorna:
  // return[0]: valor da preferência alterada
  // return[1]: nome da preferência alterada
  // Guardar chamada numa var se quiser interrompê-la depois
  addListener: function (prefPath, trat) {
    this.observer = function (aSubject, aTopic, prefPath) {
      return trat(xPref.get(prefPath), prefPath);
    }

    Services.prefs.addObserver(prefPath, this.observer);
    return {
      prefPath: prefPath,
      observer: this.observer
    };
  },

  // Encerra pref observer
  // Só precisa passar a var definida quando adicionou
  removeListener: function (obs) {
    Services.prefs.removeObserver(obs.prefPath, obs.observer);
  }
}
