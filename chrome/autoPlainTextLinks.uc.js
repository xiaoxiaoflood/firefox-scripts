"use strict";
// ==UserScript==
// @name            Auto Plain Text Links
// @author          Alex Vallat
// @version         0.11
// @description     Allow opening right-clicked plain text links without requiring selection.
// @include         main
// @shutdown        UC.autoPlainTextLinks.unload();
// @onlyonce
// ==/UserScript==


UC.autoPlainTextLinks = {
    frameScript: 'data:application/javascript;charset=UTF-8,' + 
    encodeURIComponent('"use strict";\n(' + (function () {
//console.log("AutoPlainTextLinks framescript loading");

Cu.import("resource://gre/modules/SelectionUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("chrome://userchromejs/content/hookFunction.jsm");

const HookFlag = "AutoPlainTextLinks.Hooked";
const LastClickedPlainTextUrl = "AutoPlainTextLinks.LastClickedPlainTextUrl";

var unHookFunction; // Only set if the function is hooked

if (!SelectionUtils[HookFlag]) {
    SelectionUtils[HookFlag] = true;
    
    unHookFunction = hookFunction(SelectionUtils, "getSelectionDetails", null, function (preResult, baseArgs, baseResult) {
        let originalContent = baseArgs[0].content; // The current content may not be the one the context menu was triggered from, so get the actual content that was passed as an arg.
        
        const lastClickedPlainTextUrl = originalContent[LastClickedPlainTextUrl] 
        if (lastClickedPlainTextUrl && baseResult.text.length === 0) {
            baseResult.linkText = lastClickedPlainTextUrl;
            baseResult.linkURL = lastClickedPlainTextUrl;
            baseResult.text = lastClickedPlainTextUrl.substr(0, 150); // Only use the first 150 characters of the selection for the text bit, but text is required otherwise it simply won't show the text options.
        }
        
        // Do not delete the LastClickedPlainTextUrl as if multiprocess is disabled, this method will be called twice.
        
        return baseResult;
    });
}

const onContextMenu = function (event) {
    if (event.rangeParent.nodeType === event.rangeParent.TEXT_NODE) {
//console.log("AutoPlainTextLinks context menu interception");    
        let text = event.rangeParent.textContent;
        const clickedPosition = event.rangeOffset;
        // Roll back to just after the nearest space (never mind about other whitespace, it's not common)
        const startSearch = text.lastIndexOf(" ", clickedPosition) + 1;
        // Don't bother searching past the next space
        let endSearch = text.indexOf(" ", clickedPosition);
        if (endSearch <= startSearch) {
            endSearch = text.length;
        }
        
        // Find a url where the click position is within it (using similar strict constraints to Firefox in SelectionUtils.jsm - for forcing a url that doesn't match, user can still use selection)
        const re = /(?:https?|ftp):[!#$&-;=?-[\]_a-z~%]+/ig;
        re.lastIndex = startSearch;
        let match;
        while (re.lastIndex < endSearch && (match = re.exec(text)) !== null) {
            if (clickedPosition >= match.index && clickedPosition <= re.lastIndex) {
                // Found a probable URL with the clicked position in it
                try {
                    const lastClickedPlainTextUrl = Services.io.newURI(match[0]).spec;
                    // Store this on the Content object as Firefox may use a different framescript for actually displaying the menu on(!)
                    content[LastClickedPlainTextUrl] = lastClickedPlainTextUrl;
                    return;
                } catch (ex) { }
            }
        }
        delete content[LastClickedPlainTextUrl]; // No URL found
    }
};

addEventListener("contextmenu", onContextMenu, { passive: true });

function unload() {
    if (unHookFunction) {
        unHookFunction();
    }
    removeEventListener("contextmenu", onContextMenu, { passive: true });
    delete SelectionUtils[HookFlag];
    removeMessageListener("AutoPlainTextLinks@byalexv.co.uk:disable", unload);
    
    //console.log("AutoPlainTextLinks unloaded");
}
addMessageListener("AutoPlainTextLinks@byalexv.co.uk:disable", unload);

//console.log("AutoPlainTextLinks framescript loaded");
    }).toString() + ')();'),
    init: function() {
        const globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService();
        globalMessageManager.loadFrameScript(this.frameScript, true);
    },

    unload: function() {
        const globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService();
        globalMessageManager.broadcastAsyncMessage("AutoPlainTextLinks@byalexv.co.uk:disable");
        globalMessageManager.removeDelayedFrameScript(this.frameScript);
        
        delete UC.autoPlainTextLinks;
    }
}

UC.autoPlainTextLinks.init();