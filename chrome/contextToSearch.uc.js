"use strict";
// ==UserScript==
// @name            Context to Search
// @author          Alex Vallat
// @version         0.5
// @description     Search context menu entry now sends search to search box
// @include         main
// @startup         UC.contextToSearch.startup(win);
// @shutdown        UC.contextToSearch.shutdown(win);
// @onlyonce
// ==/UserScript==

/* Changelog
V0.5
    - Fixed functionality for Firefox V129.0 via AI
    - Added comments
*/

UC.contextToSearch = {

    originalHandler: null,

    startup: function (window) {
        // Check for navigator:browser
        if (!window.gNavToolbox) return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem) {
            // Store the original oncommand handler
            this.originalHandler = menuItem.getAttribute("oncommand");

            // Set new oncommand handler
            const newHandler = `
                // Prevent default action and stop event propagation
                event.preventDefault();
                event.stopPropagation();
                
                // Update search bar with selected text
                BrowserSearch.searchBar.value = this.searchTerms;
                
                // Focus on the search bar
                BrowserSearch.searchBar.openSuggestionsPanel(); // Alternate method if needed: BrowserSearch.searchBar.focus();
                
            `;
            menuItem.setAttribute("oncommand", newHandler);

            // Override the default click behavior
            menuItem.addEventListener("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, true);
        }
    },

    shutdown: function (window) {
        // Check for navigator:browser
        if (!window.gNavToolbox) return;

        const menuItem = window.document.getElementById("context-searchselect");
        if (menuItem && this.originalHandler) {
            // Restore original oncommand handler
            menuItem.setAttribute("oncommand", this.originalHandler);
            
            // Remove the click event listener
            menuItem.removeEventListener("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, true);
        }
    }
}
