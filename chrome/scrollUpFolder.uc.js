// ==UserScript==
// @name      scrollUpFolder.uc.js
// @include   main
// ==/UserScript==

(function () {
  // sdk\url.js
  var ios = Services.io;
  var URLParser = Cc["@mozilla.org/network/url-parser;1?auth=no"]
                  .getService(Ci.nsIURLParser);

  function newURI(uriStr, base) {
    try {
      let baseURI = base ? ios.newURI(base) : null;
      return ios.newURI(uriStr, null, baseURI);
    }
    catch (e) {
      if (e.result == Cr.NS_ERROR_MALFORMED_URI) {
        throw new Error("malformed URI: " + uriStr);
      }
      if (e.result == Cr.NS_ERROR_FAILURE ||
          e.result == Cr.NS_ERROR_ILLEGAL_VALUE) {
        throw new Error("invalid URI: " + uriStr);
      }
    }
  }

  function URL(url, base) {
    if (!(this instanceof URL)) {
       return new URL(url, base);
    }

    var uri = newURI(url, base);

    var userPass = null;
    try {
      userPass = uri.userPass ? uri.userPass : null;
    }
    catch (e) {
      if (e.result != Cr.NS_ERROR_FAILURE) {
        throw e;
      }
    }

    var host = null;
    try {
      host = uri.host;
    }
    catch (e) {
      if (e.result != Cr.NS_ERROR_FAILURE) {
        throw e;
      }
    }

    var port = null;
    try {
      port = uri.port == -1 ? null : uri.port;
    }
    catch (e) {
      if (e.result != Cr.NS_ERROR_FAILURE) {
        throw e;
      }
    }

    let fileName = "/";
    try {
      fileName = uri.QueryInterface(Ci.nsIURL).fileName;
    } catch (e) {
      if (e.result != Cr.NS_NOINTERFACE) {
        throw e;
      }
    }

    let uriData = [uri.pathQueryRef, uri.pathQueryRef.length, {}, {}, {}, {}, {}, {}];
    URLParser.parsePath.apply(URLParser, uriData);
    let [{ value: filepathPos }, { value: filepathLen },
      { value: queryPos }, { value: queryLen },
      { value: refPos }, { value: refLen }] = uriData.slice(2);

    let hash = uri.ref ? "#" + uri.ref : "";
    let pathname = uri.pathQueryRef.substr(filepathPos, filepathLen);
    let search = uri.pathQueryRef.substr(queryPos, queryLen);
    search = search ? "?" + search : "";

    this.__defineGetter__("fileName", () => fileName);
    this.__defineGetter__("scheme", () => uri.scheme);
    this.__defineGetter__("userPass", () => userPass);
    this.__defineGetter__("host", () => host);
    this.__defineGetter__("hostname", () => host);
    this.__defineGetter__("port", () => port);
    this.__defineGetter__("pathQueryRef", () => uri.pathQueryRef);
    this.__defineGetter__("pathname", () => pathname);
    this.__defineGetter__("hash", () => hash);
    this.__defineGetter__("href", () => uri.spec);
    this.__defineGetter__("origin", () => uri.prePath);
    this.__defineGetter__("protocol", () => uri.scheme + ":");
    this.__defineGetter__("search", () => search);

    Object.defineProperties(this, {
      toString: {
        value() {
          return new String(uri.spec).toString();
        },
        enumerable: false
      },
      valueOf: {
        value() {
          return new String(uri.spec).valueOf();
        },
        enumerable: false
      },
      toSource: {
        value() {
          return new String(uri.spec).toSource();
        },
        enumerable: false
      },
      // makes more sense to flatten to string, easier to travel across JSON
      toJSON: {
        value() {
          return new String(uri.spec).toString();
        },
        enumerable: false
      }
    });

    return this;
  };
  URL.prototype = Object.create(String.prototype);
  // end sdk


	/**
	 * Generate paths for a tab.
	 * @param	tab		The tab to generate paths.
	 */
	function processPaths (currentUrl) {
		// Declare current URL index
		let currentIndex;
    var SUFPaths;
		// Check if paths was not already generated or if they are not matching the current URL
		if (typeof SUFPaths === 'undefined' || (currentIndex = SUFPaths.indexOf(currentUrl)) === -1) {
			// Set path to current tab
			SUFPaths = computePaths(currentUrl);
			// Set initial pointer position
			var SUFPointer = 0;
			// Stop path processing
			//return;
		}
		// Define pointer set status
		let pointerSet = false;
		// Get URL in urlbar
		let urlbarUrl = gURLBar.untrimmedValue;
		// Check urlbar URL
		if (urlbarUrl !== null) {
			// Check if urlbar URL maches one of path
			let urlbarIndex = SUFPaths.indexOf(urlbarUrl);
			if (urlbarIndex !== -1) {
				// Set pointer to urlbar URL index
				SUFPointer = urlbarIndex;
				// Mark pointer as set
				pointerSet = true;
			} else {
				// Compute paths for urlbar URL
				let urlbarPaths = computePaths(urlbarUrl);
				// Check each computed paths from urlbar URL
				for (let urlbarPathsIndex = 1, urlbarPathsCount = urlbarPaths.length; urlbarPathsIndex<urlbarPathsCount; urlbarPathsIndex++) {
					// Check if urlbar URL path matches one of computed paths
					urlbarIndex = SUFPaths.indexOf(urlbarPaths[urlbarPathsIndex]);
					if (urlbarIndex !== -1) {
						// Set pointer to urlbar URL index
						SUFPointer = urlbarIndex;
						// Mark pointer as set
						pointerSet = true;
						break;
					}
				}
			}
		}
		// Check if pointer was set
		if (!pointerSet) {
			// Set pointer to current URL index
			SUFPointer = currentIndex;
		}
    return { SUFPaths: SUFPaths,
             SUFPointer: SUFPointer };
	}

	/**
	 * Compute paths from an URL.
	 * @param	path	The base URL to compute paths.
	 * @return			An array of the computed paths.
	 */
	function computePaths (path) {
		// Initialize paths
		let paths = new Array();
		// Prevent path computation on about page
		if (path.substr(0, 6) !== 'about:') {
			// Create paths
			while (path != null) {
				paths.push(path);
				path = computeUpperUrl(path);
			}
		}
		// Return computed paths
		return paths;
	}

	/**
	 * Compute upper URL from a base URL.
	 * @param	baseUrl					The base URL for computation.
	 * @return							The upper URL from base URL, null if there no upper URL.
	 */
	function computeUpperUrl (baseUrl) {
    if (baseUrl.substr(0, 6) === 'about:')
      return null;
		// Valid baseUrl making an URL
		let url = null;
		try {
			url = new URL(baseUrl);
		} catch (exception) {
			return null;
		}

    // Get anchor index
    let indexAnchor = baseUrl.lastIndexOf('#');
    if (indexAnchor !== -1) {
      if (++indexAnchor != baseUrl.length)
        return baseUrl.substring(0, indexAnchor);
      else
        return baseUrl.substring(0, indexAnchor - 1);
    }

    // Get GET parameters index
    let indexGetParams = baseUrl.indexOf('?');
    if (indexGetParams !== -1) {
      // Get GET parameters separator index
      let indexGetSeparator = baseUrl.lastIndexOf('&');
      if (indexGetSeparator !== -1 && indexGetSeparator > indexGetParams) {
        while(baseUrl.match(/.+[=&]/g)){
          baseUrl = baseUrl.slice(0,-1);
          if(baseUrl.match(/.+[=&]/g))
            return baseUrl.match(/.+[=&]/g)[0];
          else
            return baseUrl.match(/.+\?/g)[0];
        }
      }
      // Return URL without GET parameters
      return baseUrl.substring(0, indexGetParams);
    }

		// Try to go one directory up
		if (baseUrl.charAt(baseUrl.length - 1) === '/') {
			// Get one directory up URL
			let resolvedUrl = new URL('..', baseUrl).href;
			// Check the URL resolution
			if (baseUrl != resolvedUrl && resolvedUrl.substr(resolvedUrl.length - 2, 2) != '..' && resolvedUrl.substr(resolvedUrl.length - 3, 3) != '../') {
				// Return one directory up URL
				return resolvedUrl;
			}
		}
		// Try to resolve current place
		else {
			let resolvedUrl = new URL('.', baseUrl).href;
			if (resolvedUrl !== baseUrl) {
				return resolvedUrl;
			}
		}
		// Get domain URI
		let domain = url.host;
		// Check if domain is IPv4 URL
		if (domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
			return null;
		}
		// Compute upper domain
		let upperDomain = domain.replace(/.*?\./, '');
		// Get dot matches
		let dotMatches = upperDomain.match(/\./g);
		// Check computed upper domain
		if (upperDomain == domain || dotMatches === null) {
			return null;
		}
		// Get URL scheme
		let scheme = url.scheme;
		// Declare resolved URL
		let resolvedUrl = null;
		// Check top level domain name
		if (dotMatches.length <= 1) {
			// Add default www subdomain to TLD name
			resolvedUrl = scheme + '://www.' + upperDomain + '/';
		} else {
			// Resolve URL from upper domain
			resolvedUrl = scheme + '://' + upperDomain + '/';
		}
		// Check resolved URL
		if (resolvedUrl == baseUrl) {
			return null;
		}
		// Return resolved URL
		return resolvedUrl;
	}

  function sUFscroll (event) {
    // Compute paths
    let url = gBrowser.currentURI;
    if (url)
      var currentTab = processPaths(url.spec);
    else
      return;
    // Stop event propagation (for other addon compatibility as Xclear)
    event.stopPropagation();
    // Go up in paths list
    let goUp = event.detail < 0;
    if (goUp && currentTab.SUFPointer < currentTab.SUFPaths.length - 1) {
      // Update curent pointer
      currentTab.SUFPointer++;
    }
    // Go down in paths list
    else if (!goUp && currentTab.SUFPointer > 0) {
      // Update curent pointer
      currentTab.SUFPointer--;
    }
    // Display the path to the urlbar URL
    if (UrlbarPrefs.get('trimURLs') && gURLBar.valueFormatter._getUrlMetaData().schemeWSlashes == 'http://') {
      gURLBar.value = gURLBar.trimValue(currentTab.SUFPaths[currentTab.SUFPointer]);
      gURLBar._untrimmedValue = 'http://' + gURLBar.value;
    } else {
      gURLBar.value = currentTab.SUFPaths[currentTab.SUFPointer];
    }
    let urlength = gURLBar.value.length;
    gURLBar.focus();
    gURLBar.inputField.setSelectionRange(urlength, urlength);
  }

  function sUFclick (event) {
    // Getting chosen URL
    let url = gURLBar.untrimmedValue;
    // Check event (only middle-click) and URL
    if (event.button != 1 || url == null || url.length <= 0) {
      return;
    }
    // Stop event propagation (for X server/linux)
    event.stopPropagation();
		// Create valid URL from given URL
		let cleanedUrl = new URL(url);
		// Load valid URL
    openLinkIn(cleanedUrl && cleanedUrl.href, 'current', {allowThirdPartyFixup: true, targetBrowser: gBrowser.selectedBrowser, indicateErrorPageLoad: true, allowPinnedTabHostChange: true, disallowInheritPrincipal: true, allowPopups: false, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});
  }

  gURLBar.addEventListener('DOMMouseScroll', sUFscroll, false);
  gURLBar.textbox.addEventListener('click', sUFclick, false);
})()