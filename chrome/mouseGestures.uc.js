// ==UserScript==
// @name            Mouse Gestures
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.MGest.exec(win);
// @shutdown        UC.MGest.destroy();
// @onlyonce
// ==/UserScript==

// initially forked from https://web.archive.org/web/20131025160814/http://www.cnblogs.com/ziyunfei/archive/2011/12/15/2289504.html

const { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
XPCOMUtils.defineLazyGetter(this, 'SelectionUtils', function() {
  let { SelectionUtils } = Cu.import('resource://gre/modules/SelectionUtils.jsm');
  return SelectionUtils;
});

UC.MGest = {
  // 0, 1, 2: mouse buttons
  // -, +: mousewheel direction
  // UDLR: up, down, left, right / gesture direction
  // FB: forward, back / for mouses with extra buttons
  // note: extra buttons must be the last part of the gesture because they are only triggered on 'click' (button release), there's no 'mousedown' for them
  GESTURES: {
    '1-': {
      name: 'Zoom in',
      cmd: function (win) {
        win.FullZoom.enlarge();
      }
    },
    '1+': {
      name: 'Zoom out',
      cmd: function (win) {
        win.FullZoom.reduce();
      }
    },
    '10': {
      name: 'Zoom reset',
      cmd: function (win) {
        win.FullZoom.reset();
      }
    },
    '2+': {
      name: 'Next tab',
      cmd: function (win) {
        win.gBrowser.tabContainer.advanceSelectedTab(1, true);
      }
    },
    '2-': {
      name: 'Previous tab',
      cmd: function (win) {
        win.gBrowser.tabContainer.advanceSelectedTab(-1, true);
      }
    },
    '2R': {
      name: 'Open URL in new tab',
      cmd: function (win) {
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'newTab' });
      }
    },
    '2L': {
      name: 'Copy URL from element',
      cmd: function (win) {
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'copyURL' });
      }
    },
    '1R': {
      name: 'Paste',
      cmd: function (win) {
        win.goDoCommand('cmd_paste');
      }
    },
    '1L': {
      name: 'Copy text / Image',
      cmd: function (win) {
        let selection = SelectionUtils.getSelectionDetails(win).text;
        if (selection)
          Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(selection);
        else
          win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'copySelection', fallback: 'copyImage' });
      }
    },
    '2U': {
      name: 'Go to top of page (strict)',
      cmd: function (win) {
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'scroll', direction: 'up' });
      }
    },
    '2D': {
      name: 'Go to bottom of page (strict) / Image search',
      cmd: function (win) {
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', {
          action: 'newTab',
          type: 'image',
          templateURL: 'http://www.google.com.br/searchbyimage?image_url=%s',
          encode: true,
          fallback: 'scroll',
          direction: 'down' });
      }
    },
    '20': {
      name: 'Switch to last selected tab',
      cmd: function (win) {
        const { gBrowser } = win;
        let previousTab = gBrowser.selectedTab;
        let lastAccessed = 0;
        for (let tab of gBrowser.tabs) {
          if (tab.everSelected && tab._lastAccessed > lastAccessed && tab != gBrowser.selectedTab) {
            lastAccessed = tab._lastAccessed;
            previousTab = tab;
          }
        }
        gBrowser.selectedTab = previousTab;
      }
    },
    '01': {
      name: 'Duplicate tab',
      cmd: function (win) {
        const { gBrowser } = win;
        gBrowser.selectedTab = gBrowser.duplicateTab(gBrowser.selectedTab);
      }
    },
    '02': {
      name: 'Reload current tab',
      cmd: function (win) {
        const { gBrowser, openLinkIn } = win;
        openLinkIn(gBrowser.currentURI.spec, 'current', {
          allowThirdPartyFixup: true,
          targetBrowser: gBrowser.selectedBrowser,
          indicateErrorPageLoad: true,
          allowPinnedTabHostChange: true,
          triggeringPrincipal: gBrowser.selectedBrowser.contentPrincipal
        });
      }
    },
    '21': {
      name: 'Close current tab',
      cmd: function (win) {
        win.gBrowser.removeCurrentTab();
      }
    },
    '0F': {
      name: 'Switch to next group',
      cmd: function (win) {
        UC.webExts.get(UC.MGest.webExts.get('SDB')).messageManager.sendAsyncMessage('UCJS:MGest', 'next_panel');
      }
    },
    '0B': {
      name: 'Switch to previous group',
      cmd: function (win) {
        UC.webExts.get(UC.MGest.webExts.get('SDB')).messageManager.sendAsyncMessage('UCJS:MGest', 'prev_panel');
      }
    },
    '1F': {
      name: 'Video 2× speed',
      cmd: function (win) {
        function speedUpVideo () {
          let video = content.document.querySelector('html > div > video');
          if (video)
            video.playbackRate = video.playbackRate == video.defaultPlaybackRate ? 2 : video.defaultPlaybackRate;
        };
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'eval', code: speedUpVideo.toString(), name: this.name });
      }
    },
    '2F': {
      name: 'Video advance 5 seconds',
      cmd: function (win) {
        function advanceVideo () {
          let video = content.document.querySelector('html > div > video');
          if (video)
            video.currentTime += 5;
        };
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'eval', code: advanceVideo.toString(), name: this.name });
      }
    },
    '2B': {
      name: 'Video rewind 5 seconds',
      cmd: function (win) {
        function rewindVideo () {
          let video = content.document.querySelector('html > div > video');
          if (video)
            video.currentTime -= 5;
        };
        win.gBrowser.selectedBrowser.messageManager.sendAsyncMessage('chromeToContent', { action: 'eval', code: rewindVideo.toString(), name: this.name });
      }
    },
  },

  webExts: new Map([
    ['SDB', '{3c078156-979c-498b-8990-85f7987dd929}'] // Sidebery
  ]),

  exec: function (win) {
    const { customElements, document, gBrowser } = win;

    ['contextmenu', 'mousedown', 'mouseup'].forEach(type => {
      document.addEventListener(type, this, true);
    });

    win._HandleAppCommandEvent = win.HandleAppCommandEvent;
    win.removeEventListener('AppCommand', win.HandleAppCommandEvent, true);

    win.orig_selected = Object.getOwnPropertyDescriptor(customElements.get('tabbrowser-tab').prototype, '_selected').set;
    Object.defineProperty(customElements.get('tabbrowser-tab').prototype, '_selected', {
      set: function (val) {
        if (val && !this.everSelected)
          this.everSelected = true;

        return win.orig_selected.call(this, val);
      }
    });

    win.HandleAppCommandEvent = (evt) => {
      if (UC.MGest.directionChain) {
        let executed;
        switch (evt.command) {
          case 'Forward':
            executed = this.checkAndRunGest('F', win);
            break;
          case 'Back':
            executed = this.checkAndRunGest('B', win);
        }

        if (executed)
          return;
      }

      return win._HandleAppCommandEvent.call(win, evt);
    };
    win.addEventListener('AppCommand', win.HandleAppCommandEvent, true);
  },

  init: function () {
    xPref.lock('ui.context_menus.after_mouseup', true);

    this.webExts.forEach(id => {
      if (UC.webExts.get(id)?.messageManager)
        this.addListener(id);
    });

    Services.obs.addObserver(this, 'UCJS:WebExtLoaded');

    Services.mm.loadFrameScript(this.frameScript, true);
    Services.mm.addMessageListener('contentToChrome', this.chromeListener);
  },

  addListener: function (id) {
    switch (id) {
      case this.webExts.get('SDB'):
        UC.webExts.get(id).messageManager.loadFrameScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function (id) {
          let { browser } = content.wrappedJSObject;
          let contentListener = async function (msg) {
            switch (msg.data) {
              case 'next_panel':
                browser.runtime.sendMessage(id, 'next_panel');
                break;
              case 'prev_panel':
                browser.runtime.sendMessage(id, 'prev_panel');
                break;
              case 'destroy':
                removeMessageListener('UCJS:MGest', contentListener);
                delete contentListener;
            }
          }

          addMessageListener('UCJS:MGest', contentListener);
        }).toString() + ')(\'' + id + '\');'), false);
        break;
    }
  },

  observe: function (subject, topic, data) {
    for (let id of this.webExts.values()) {
      if (id == data) {
        this.addListener(data);
        break;
      }
    }
  },

  chromeListener: function (message) {
    const { document, gBrowser } = message.target.ownerGlobal;
    const { action, cmd, url } = message.data;

    switch (cmd) {
      case 'scroll-up':
        document.commandDispatcher.getControllerForCommand('cmd_moveTop').doCommand('cmd_moveTop');
        break;
      case 'scroll-down':
        document.commandDispatcher.getControllerForCommand('cmd_moveBottom').doCommand('cmd_moveBottom');
        break;
      case 'newTab':
        gBrowser.addTab(url, {
          owner: gBrowser.selectedTab,
          relatedToCurrent: true,
          triggeringPrincipal: gBrowser.selectedBrowser.contentPrincipal
        });
    }
  },

  frameScript: 'data:application/javascript;charset=UTF-8,' + 
    encodeURIComponent('(' + (function () {
      let preventDrag = false;
      addEventListener('blur', function () {
        preventDrag = true;
      }, true);
      addEventListener('mousedown', function (evt) {
        if (evt.button === 0)
          preventDrag = false;
      }, true);
      addEventListener('dragstart', function (evt) {
        if (preventDrag) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      }, true);

      // https://searchfox.org/mozilla-central/rev/d45dd05bf412e7468b3770a52519e9d546d6325c/browser/actors/ContextMenuChild.jsm#1156-1224
      // https://searchfox.org/mozilla-central/rev/d45dd05bf412e7468b3770a52519e9d546d6325c/browser/actors/ContextMenuChild.jsm#325-338
      // https://searchfox.org/mozilla-central/rev/d45dd05bf412e7468b3770a52519e9d546d6325c/browser/actors/ContextMenuChild.jsm#981-1138

      function _isXULTextLinkLabel (aNode) {
        return (
          aNode.namespaceURI == 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul' &&
          aNode.tagName == 'label' &&
          aNode.classList.contains('text-link') &&
          aNode.href
        );
      }

      function _isMediaURLReusable (aURL) {
        if (aURL.startsWith('blob:')) {
          return URL.isValidURL(aURL);
        }
        return true;
      }
      
      function _makeURLAbsolute (aBase, aUrl) {
        return Services.io.newURI(aUrl, null, Services.io.newURI(aBase)).spec;
      }

      function _getComputedURL (aElem, aProp) {
        let urls = aElem.ownerGlobal.getComputedStyle(aElem).getCSSImageURLs(aProp);

        if (!urls.length) {
          return null;
        }

        if (urls.length != 1) {
          throw new Error('found multiple URLs');
        }

        return urls[0];
      }

      let clickedElement;
      let data = {};

      let mouseDown = function (e) {
        data = {};
        clickedElement = e.composedTarget;

        if (clickedElement.nodeType != clickedElement.ELEMENT_NODE)
          return;

        const XLINK_NS = 'http://www.w3.org/1999/xlink';

        let elem = clickedElement;
        let hasBGImage;
        let hasMultipleBGImages;
        let win = elem.ownerDocument.defaultView;

        while (elem) {
          if (elem.nodeType == elem.ELEMENT_NODE) {
            if (
              (_isXULTextLinkLabel(elem) ||
                (content.HTMLAnchorElement.isInstance(elem) &&
                  elem.href) ||
                (content.SVGAElement.isInstance(elem) &&
                  (elem.href || elem.hasAttributeNS(XLINK_NS, 'href'))) ||
                (content.HTMLAreaElement.isInstance(elem) && elem.href) ||
                content.HTMLLinkElement.isInstance(elem) ||
                elem.getAttributeNS(XLINK_NS, 'type') == 'simple')
            ) {
              // Target is a link or a descendant of a link.
              let href = elem.href;

              if (href) {
                // Handle SVG links:
                if (typeof href == 'object' && href.animVal) {
                  data.linkURL = _makeURLAbsolute(elem.baseURI, elem.animVal);
                }

                data.linkURL = href;
              } else {
                href =
                  elem.getAttribute('href') ||
                  elem.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

                data.linkURL = _makeURLAbsolute(elem.baseURI, href);
              }
            }

            // Background image?  Don't bother if we've already found a
            // background image further down the hierarchy.  Otherwise,
            // we look for the computed background-image style.
            if (!hasBGImage && !hasMultipleBGImages) {
              let bgImgUrl = null;

              try {
                bgImgUrl = _getComputedURL(elem, 'background-image');
                hasMultipleBGImages = false;
              } catch (e) {
                hasMultipleBGImages = true;
              }

              if (bgImgUrl &&
                  !elem.textContent &&
                  elem != win.document.body &&
                  elem != win.document.documentElement &&
                  win.getComputedStyle(elem).height == win.getComputedStyle(elem.parentElement).height &&
                  win.getComputedStyle(elem).width == win.getComputedStyle(elem.parentElement).width &&
                  win.getComputedStyle(elem).height != document.documentElement.clientHeight &&
                  win.getComputedStyle(elem).width != document.documentElement.clientWidth) {
                hasBGImage = true;
                data.bgImageURL = _makeURLAbsolute(elem.baseURI, bgImgUrl);
              }
            }
          }

          elem = elem.parentNode;
        }

        if (
          clickedElement instanceof Ci.nsIImageLoadingContent &&
          (clickedElement.currentRequestFinalURI || clickedElement.currentURI)
        ) {
          // The actual URL the image was loaded from (after redirects) is the
          // currentRequestFinalURI.  We should use that as the URL for purposes of
          // deciding on the filename, if it is present. It might not be present
          // if images are blocked.
          //
          // It is important to check both the final and the current URI, as they
          // could be different blob URIs, see bug 1625786.
          data.imageURL = (() => {
            let finalURI = clickedElement.currentRequestFinalURI?.spec;
            if (finalURI && _isMediaURLReusable(finalURI)) {
              return finalURI;
            }
            let currentURI = clickedElement.currentURI?.spec;
            if (currentURI && _isMediaURLReusable(currentURI)) {
              return currentURI;
            }
            return '';
          })();
        } else if (content.HTMLVideoElement.isInstance(clickedElement)) {
          const mediaURL = clickedElement.currentSrc || clickedElement.src;

          if (_isMediaURLReusable(mediaURL)) {
            data.videoURL = mediaURL;
          }
        } else if (content.HTMLAudioElement.isInstance(clickedElement)) {
          const mediaURL = clickedElement.currentSrc || clickedElement.src;

          if (_isMediaURLReusable(mediaURL)) {
            data.audioURL = mediaURL;
          }
        } else if (content.HTMLHtmlElement.isInstance(clickedElement)) {
          const bodyElt = clickedElement.ownerDocument.body;

          if (bodyElt) {
            let computedURL;

            try {
              computedURL = _getComputedURL(bodyElt, 'background-image');
              hasMultipleBGImages = false;
            } catch (e) {
              hasMultipleBGImages = true;
            }

            if (computedURL) {
              hasBGImage = true;
              data.bgImageURL = _makeURLAbsolute(
                bodyElt.baseURI,
                computedURL
              );
            }
          }
        }
      }
      addEventListener('mousedown', mouseDown, true);

      function parseTemplate(url, templateURL, encode) {
        if (encode)
          url = encodeURIComponent(url);
        return templateURL?.replace(/%s/, url) || url;
      }

      let evalCache = {};

      contentListener = async function (msg) {
        let { action, code, direction, encode, fallback, name, type, templateURL, url } = msg.data;
        let useFallback = false;

        if (type == 'image')
          url = data.bgImageURL || data.imageURL;
        else if (type)
          url = data[type];
        else
          url = data.videoURL || data.audioURL || data.linkURL || data.bgImageURL || data.imageURL;

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

            let response = await request(data.bgImageURL || data.imageURL);
            let mimeType = response?.getResponseHeader('Content-Type');

            let imageData;
            if (mimeType?.startsWith('image')) {
              imageData = response.response;
            } else {
              let canvas = content.document.createElement('canvas');
              canvas.width = clickedElement.naturalWidth;
              canvas.height = clickedElement.naturalHeight;
              canvas.getContext('2d').drawImage(clickedElement, 0, 0);

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
            let focusedElement = Services.focus.getFocusedElementForWindow(content, true, focusedWindow);
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
              sendAsyncMessage('contentToChrome', { cmd: action, url: parseTemplate(url, templateURL, encode) });
            else
              useFallback = true;
            break;
          case 'scroll':
            clickedElement.tabIndex = -1;
            clickedElement.focus();
            sendAsyncMessage('contentToChrome', { cmd: 'scroll-' + direction });
            break;
          case 'eval':
            if (evalCache[name])
              evalCache[name]();
            else
              eval('(evalCache["' + name + '"] = ' + code + ').call()');
            break;
          case 'destroy':
            removeEventListener('mousedown', mouseDown, true);
            removeMessageListener('chromeToContent', contentListener);
            delete mouseDown;
            delete contentListener;
        }

        if (fallback && useFallback) {
          msg.data.action = fallback;
          delete msg.data.fallback;
          contentListener(msg);
        }
      }
      addMessageListener('chromeToContent', contentListener);
    }).toString() + ')();'),

  directionChain: '',
  firstButton: undefined,

  stoppedOutside: async function (win) {
    return new Promise(resolve => {
      let start = undefined;
      const step = function (timestamp) {
        if (start === undefined && timestamp)
          start = timestamp;

        if (timestamp - start < 20 && !this.cancel) // Stop the animation after 20ms
          win.requestAnimationFrame(step);
        else
          resolve();
      }

      win.requestAnimationFrame(step);
    });
  },

  stopGesture: async function (gst, win) {
    if (this.GESTURES[gst]) {
      let topWin = win.windowRoot.ownerGlobal;
      this.prevent = true;
      this.hideAutoScroll(topWin.gBrowser);
      if  (/[UDLR]/.test(gst))
        await this.stoppedOutside(win);
      win.document.documentElement.removeEventListener('mouseleave', this, false);
      if (!this.cancel)
        this.GESTURES[gst].cmd(topWin);
    }
  },

  handleEvent: function (event) {
    const { button, composedTarget, screenX, screenY } = event;
    const win = event.view.windowRoot.ownerGlobal;
    const { document: doc } = win;
    let delX,
        delY,
        absDX,
        absDY,
        direction;

    switch (event.type) {
      case 'mousedown':
        if (event.ctrlKey)
          return;
        if (this.directionChain) {
          delX = screenX - this.lastX;
          delY = screenY - this.lastY;
          if (Math.abs(delX) > 30 || Math.abs(delY) > 30) {
            return;
          } else {
            this.stopGesture(this.directionChain + button, win);
            event.preventDefault();
            event.stopPropagation();
          }
        } else {
          this.lastX = screenX;
          this.lastY = screenY;
          this.firstButton = button;
          this.directionChain += button;
          this.cancel = false;
          this.prevent = false;
          doc.addEventListener('mousemove', this, false);
          doc.addEventListener('wheel', this, { capture: true, passive: false });
          doc.addEventListener('dragend', this, { capture: true, once: true });
          doc.documentElement.addEventListener('mouseleave', this, false);
        }
        break;
      case 'mousemove':
        delX = screenX - this.lastX;
        delY = screenY - this.lastY;
        absDX = Math.abs(delX);
        absDY = Math.abs(delY);
        direction;
        if (absDX < 10 && absDY < 10)
          return;
        if (absDX > absDY)
          direction = delX < 0 ? 'L' : 'R';
        else
          direction = delY < 0 ? 'U' : 'D';
        if (direction != this.directionChain[this.directionChain.length - 1])
          this.directionChain += direction;
        this.lastX = screenX;
        this.lastY = screenY;
        break;
      case 'dragend':
      case 'mouseup':
        if (this.directionChain) {
          this.stopGesture(this.directionChain, win);
          if (this.firstButton == button) {
            this.directionChain = '';
            doc.removeEventListener('mousemove', this, false);
            ['dragend', 'wheel'].forEach(type => doc.removeEventListener(type, this, true));
          }
          if (this.prevent && button != 2) {
            if (composedTarget.isRemoteBrowser) {
              doc.documentElement.focus();
              win.gBrowser.selectedBrowser.focus();
              event.preventDefault();
              event.stopPropagation();
            } else {
              win.addEventListener('click', this, { capture: true, once: true });
            }
          }
        }
        break;
      case 'click':
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'contextmenu':
        if (this.prevent) {
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case 'wheel':
        if (this.directionChain) {
          event.preventDefault();
          event.stopPropagation();
          this.stopGesture(this.directionChain + (event.deltaY > 0 ? '+' : '-'), win);
        }
        break;
      case 'mouseleave':
        this.cancel = true;
    }
  },

  checkAndRunGest: function (command, win) {
    if (this.GESTURES[this.directionChain + command]) {
      this.prevent = true;
      this.hideAutoScroll(win.gBrowser);
      this.GESTURES[this.directionChain + command].cmd(win.windowRoot.ownerGlobal);
      return true;
    } else {
      return false;
    }
  },

  hideAutoScroll: function (gBrowser) {
    if (this.directionChain[0] == '1' && gBrowser.getBrowserForTab(gBrowser._selectedTab)._autoScrollPopup?.state == 'open')
      gBrowser.getBrowserForTab(gBrowser._selectedTab)._autoScrollPopup.hidePopup();
  },

  destroy: function () {
    xPref.unlock('ui.context_menus.after_mouseup');

    Services.mm.broadcastAsyncMessage('chromeToContent', { action: 'destroy' });
    Services.mm.removeDelayedFrameScript(this.frameScript);
    Services.mm.removeMessageListener('contentToChrome', this.chromeListener);

    _uc.windows((doc, win) => {
      const { customElements } = win;

      ['contextmenu', 'dragend', 'mousedown', 'mouseup', 'wheel'].forEach(type => {
        doc.removeEventListener(type, this, true);
      });
      doc.removeEventListener('mousemove', this, false);
      doc.documentElement.removeEventListener('mouseleave', this, false);

      Object.defineProperty(customElements.get('tabbrowser-tab').prototype, '_selected', {
        set: win.orig_selected,
        configurable: true
      });

      win.removeEventListener('AppCommand', win.HandleAppCommandEvent, true);
      win.HandleAppCommandEvent = win._HandleAppCommandEvent;
      delete win._HandleAppCommandEvent;
      win.addEventListener('AppCommand', win.HandleAppCommandEvent, true);

      delete win.orig_selected;
    });

    Services.obs.removeObserver(this, 'UCJS:WebExtLoaded');
    this.webExts.forEach(id => {
      UC.webExts.get(id)?.messageManager.sendAsyncMessage('UCJS:MGest', 'destroy');
    });
    delete UC.MGest;
  },
};

UC.MGest.init();
