"use strict";
// ==UserScript==
// @name            Context to Search
// @author          Alex Vallat
// @version         0.6
// @description     Search context menu entry now sends search to search box
// @include         main
// @startup         UC.contextToSearch.startup(win);
// @shutdown        UC.contextToSearch.shutdown(win);
// @onlyonce
// ==/UserScript==

UC.contextToSearch = {

    startup: function (window) {
        //Check for navigator:browser
        if (!window.gNavToolbox)
            return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem) {
            menuItem.addEventListener('command', this.searchSelect);
        }
    },
    
    searchSelect: function (event) {
        const searchBar = this.ownerDocument.getElementById("searchbar");
        searchBar.value = this.searchTerms;
        searchBar.openSuggestionsPanel();
        event.stopPropagation();
    },

    shutdown: function (window) {
        //Check for navigator:browser
        if (!window.gNavToolbox)
            return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem) {
            menuItem.removeEventListener('command', this.searchSelect);
        }
    }
}