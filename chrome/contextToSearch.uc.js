"use strict";
// ==UserScript==
// @name            Context to Search
// @author          Alex Vallat
// @version         0.4
// @description     Search context menu entry now sends search to search box
// @include         main
// @startup         UC.contextToSearch.startup(win);
// @shutdown        UC.contextToSearch.shutdown(win);
// @onlyonce
// ==/UserScript==

UC.contextToSearch = {

    originalHandler: null,

    startup: function (window) {
        //Check for navigator:browser
        if (!window.gNavToolbox)
            return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem) {
            this.originalHandler = menuItem.getAttribute("oncommand");
            menuItem.setAttribute("oncommand", "BrowserSearch.searchBar.value = this.searchTerms; BrowserSearch.searchBar.openSuggestionsPanel();");
        }
    },

    shutdown: function (window) {
        //Check for navigator:browser
        if (!window.gNavToolbox)
            return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem && this.originalHandler) {
            menuItem.setAttribute("oncommand", this.originalHandler);
        }
    }
}