"use strict";
// ==UserScript==
// @name            Auto Plain Text Links
// @author          Alex Vallat
// @version         0.10
// @description     Allow opening right-clicked plain text links without requiring selection.
// @include         main
// @shutdown        UC.autoPlainTextLinks.unload();
// @onlyonce
// ==/UserScript==


UC.autoPlainTextLinks = {
    frameScriptUri: Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromDir(_uc.chromedir) + "autoPlainTextLinks.framescript.js",
    init: function() {
        const globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService();
        globalMessageManager.loadFrameScript(this.frameScriptUri, true);
    },

    unload: function() {
        const globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService();
        globalMessageManager.broadcastAsyncMessage("AutoPlainTextLinks@byalexv.co.uk:disable");
        globalMessageManager.removeDelayedFrameScript(this.frameScriptUri);
        
        delete UC.autoPlainTextLinks;
    }
}

UC.autoPlainTextLinks.init();