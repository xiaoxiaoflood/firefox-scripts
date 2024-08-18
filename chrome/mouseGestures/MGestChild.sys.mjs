// resource:///actors/ContextMenuChild.sys.mjs

export class MGestChild extends JSWindowActorChild {
  // PUBLIC
  constructor () {
    super();

    this.context = {};
    this.evalCache = {};
  }

  async receiveMessage (msg) {
    let { action, code, direction, encode, fallback, name, type, templateURL } = msg.data;
    let useFallback = false;
    let context = this.context;
    let url;

    if (type == 'image')
      url = context.bgImageURL || context.mediaURL;
    else
      url = context.mediaURL || context.linkURL || context.bgImageURL;

    switch (action) {
      case 'copyURL':
        if (url)
          Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(url);
        else
          useFallback = true;
        break;
      case 'copyImage':
        function request (url) {
          return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
              if (this.status >= 200 && this.status < 300)
                resolve(xhr);
              else
                reject();
            };
            xhr.onerror = reject;
            xhr.send();
          });
        }

        let response = await request(context.bgImageURL || context.mediaURL);
        let mimeType = response?.getResponseHeader('Content-Type');

        let imageData;
        if (mimeType?.startsWith('image')) {
          imageData = response.response;
        } else {
          let canvas = this.document.createElement('canvas');
          canvas.width = context.target.naturalWidth;
          canvas.height = context.target.naturalHeight;
          canvas.getContext('2d').drawImage(context.target, 0, 0);

          mimeType = 'image/png';
          let blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType));
          imageData = await blob.arrayBuffer();
        }

        let imgTools = Cc['@mozilla.org/image/tools;1'].getService(Ci.imgITools);
        let img = imgTools.decodeImageFromArrayBuffer(imageData, mimeType);

        let transferable = Cc['@mozilla.org/widget/transferable;1'].createInstance(Ci.nsITransferable);          
        transferable.init(null);
        let kNativeImageMime = 'application/x-moz-nativeimage';
        transferable.addDataFlavor(kNativeImageMime);
        transferable.setTransferData(kNativeImageMime, img);
        Services.clipboard.setData(transferable, null, Services.clipboard.kGlobalClipboard);
        break;
      case 'copySelection':
        let focusedWindow = {};
        let focusedElement = Services.focus.getFocusedElementForWindow(this.contentWindow, true, focusedWindow);
        focusedWindow = focusedWindow.value;
        
        let selectionStr = focusedWindow.getSelection().toString();

        // https://searchfox.org/mozilla-central/rev/cc9d803f98625175ed20111d9736e77f3d430cd5/toolkit/modules/SelectionUtils.jsm#70-82
        // try getting a selected text in text input.
        if (!selectionStr && focusedElement) {
          // Don't get the selection for password fields. See bug 565717.
          if (
            ChromeUtils.getClassName(focusedElement) === 'HTMLTextAreaElement' ||
            (ChromeUtils.getClassName(focusedElement) === 'HTMLInputElement' &&
              focusedElement.mozIsTextField(true))
          ) {
            selectionStr = focusedElement.editor.selection.toString();
          }
        }

        if (selectionStr)
          Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(selectionStr);
        else
          useFallback = true;
        break;
      case 'newTab':
        if (url)
          this.sendAsyncMessage(action, { url: this.parseTemplate(url, templateURL, encode) });
        else
          useFallback = true;
        break;
      case 'scroll':
        context.target.tabIndex = -1;
        context.target.focus();
        this.sendAsyncMessage('scroll-' + direction);
        break;
      case 'eval':
        if (this.evalCache[name])
          this.evalCache[name].call(null, this.contentWindow);
        else
          eval('(this.evalCache["' + name + '"] = ' + code + ').call(null, this.contentWindow)');
    }

    if (fallback && useFallback) {
      msg.data.action = fallback;
      delete msg.data.fallback;
      this.receiveMessage(msg);
    }
  }

  // PRIVATE
  _isXULTextLinkLabel (aNode) {
    const XUL_NS =
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    return (
      aNode.namespaceURI == XUL_NS &&
      aNode.tagName == "label" &&
      aNode.classList.contains("text-link") &&
      aNode.href
    );
  }

  // Generate fully qualified URL for clicked-on link.
  _getLinkURL () {
    let href = this.context.link.href;

    if (href) {
      // Handle SVG links:
      if (typeof href == "object" && href.animVal) {
        return this._makeURLAbsolute(this.context.link.baseURI, href.animVal);
      }

      return href;
    }

    href =
      this.context.link.getAttribute("href") ||
      this.context.link.getAttributeNS("http://www.w3.org/1999/xlink", "href");

    if (!href || !href.match(/\S/)) {
      // Without this we try to save as the current doc,
      // for example, HTML case also throws if empty
      throw new Error("Empty href");
    }

    return this._makeURLAbsolute(this.context.link.baseURI, href);
  }

  // Returns a "url"-type computed style attribute value, with the url() stripped.
  _getComputedURL (aElem, aProp) {
    let urls = aElem.ownerGlobal.getComputedStyle(aElem).getCSSImageURLs(aProp);

    if (!urls.length) {
      return null;
    }

    if (urls.length != 1) {
      throw new Error("found multiple URLs");
    }

    return urls[0];
  }

  _makeURLAbsolute (aBase, aUrl) {
    return Services.io.newURI(aUrl, null, Services.io.newURI(aBase)).spec;
  }

  _isMediaURLReusable (aURL) {
    if (aURL.startsWith("blob:")) {
      return URL.isValidObjectURL(aURL);
    }

    return true;
  }

  async handleEvent (evt) {
    this.context = {};
    const context = this.context;
    context.target = evt.composedTarget;

    // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1151-1177
    let elem = context.target;

    while (elem) {
      if (elem.nodeType == elem.ELEMENT_NODE) {
        // Link?
        const XLINK_NS = "http://www.w3.org/1999/xlink";

        if (
          !context.onLink &&
          // Be consistent with what hrefAndLinkNodeForClickEvent
          // does in browser.js
          (this._isXULTextLinkLabel(elem) ||
            (this.contentWindow.HTMLAnchorElement.isInstance(elem) &&
              elem.href) ||
            (this.contentWindow.SVGAElement.isInstance(elem) &&
              (elem.href || elem.hasAttributeNS(XLINK_NS, "href"))) ||
            (this.contentWindow.HTMLAreaElement.isInstance(elem) &&
              elem.href) ||
            this.contentWindow.HTMLLinkElement.isInstance(elem) ||
            elem.getAttributeNS(XLINK_NS, "type") == "simple")
        ) {
          // Target is a link or a descendant of a link.
          context.onLink = true;

          // Remember corresponding element.
          context.link = elem;
          context.linkURL = this._getLinkURL();
          // fim
        // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1198-1220
        }

        // Background image?  Don't bother if we've already found a
        // background image further down the hierarchy.  Otherwise,
        // we look for the computed background-image style.
        if (!context.hasBGImage && !context.hasMultipleBGImages) {
          let bgImgUrl = null;

          try {
            bgImgUrl = this._getComputedURL(elem, "background-image");
            context.hasMultipleBGImages = false;
          } catch (e) {
            context.hasMultipleBGImages = true;
          }

          if (bgImgUrl &&
              !elem.textContent &&
              elem != this.document.body &&
              elem != this.document.documentElement) {
            const computedStyle = this.contentWindow.getComputedStyle(elem);
            const computedStyleParent = this.contentWindow.getComputedStyle(elem.parentElement);
            if (computedStyle.height == computedStyleParent.height &&
                computedStyle.width == computedStyleParent.width &&
                computedStyle.height != this.document.documentElement.clientHeight &&
                computedStyle.width != this.document.documentElement.clientWidth) {
              context.hasBGImage = true;
              context.bgImageURL = this._makeURLAbsolute(elem.baseURI, bgImgUrl);
            }
          }
        }
      }

      elem = elem.flattenedTreeParentNode;
      // fim
    }
    
    //https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#978-981
    if (
      context.target instanceof Ci.nsIImageLoadingContent &&
      (context.target.currentRequestFinalURI || context.target.currentURI)
    ) {
    // fim
    
    // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1031-1041
      context.mediaURL = (() => {
        let finalURI = context.target.currentRequestFinalURI?.spec;
        if (finalURI && this._isMediaURLReusable(finalURI)) {
          return finalURI;
        }
        let currentURI = context.target.currentURI?.spec;
        if (currentURI && this._isMediaURLReusable(currentURI)) {
          return currentURI;
        }
        return "";
      })();
      // fim
    // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1055-1060
    } else if (this.contentWindow.HTMLVideoElement.isInstance(context.target)) {
      const mediaURL = context.target.currentSrc || context.target.src;

      if (this._isMediaURLReusable(mediaURL)) {
        context.mediaURL = mediaURL;
      }
      // fim
    // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1081-1087
    } else if (this.contentWindow.HTMLAudioElement.isInstance(context.target)) {
      context.onAudio = true;
      const mediaURL = context.target.currentSrc || context.target.src;

      if (this._isMediaURLReusable(mediaURL)) {
        context.mediaURL = mediaURL;
      }
      // fim
    // https://searchfox.org/mozilla-central/rev/404408660a4d976e2ac25881cb1e1f2712f2d430/browser/actors/ContextMenuChild.sys.mjs#1114-1135
    } else if (this.contentWindow.HTMLHtmlElement.isInstance(context.target)) {
      const bodyElt = context.target.ownerDocument.body;

      if (bodyElt) {
        let computedURL;

        try {
          computedURL = this._getComputedURL(bodyElt, "background-image");
          context.hasMultipleBGImages = false;
        } catch (e) {
          context.hasMultipleBGImages = true;
        }

        if (computedURL) {
          context.hasBGImage = true;
          context.bgImageURL = this._makeURLAbsolute(
            bodyElt.baseURI,
            computedURL
          );
        }
      }
    }
    // fim
    this.sendAsyncMessage('mousedown', context);
  }

  parseTemplate (url, templateURL, encode) {
    if (encode)
      url = encodeURIComponent(url);
    return templateURL?.replace(/%s/, url) || url;
  }
}
