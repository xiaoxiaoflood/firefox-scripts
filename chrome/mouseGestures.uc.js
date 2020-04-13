// ==UserScript==
// @name            Mouse Gestures
// @include         main
// @author          xiaoxiaoflood
// @shutdown        win.MGest.destroy();
// ==/UserScript==

// original by Ziyunfei: http://www.cnblogs.com/ziyunfei/archive/2011/12/15/2289504.html

(function () {

  MGest = {
    init: function () {
      MGest.utils.init();
      messageManager.loadFrameScript(MGest.utils.frameScript, true);
      messageManager.addMessageListener('imgurl', MGest.utils.chromeListener);
    },
    destroy: function () {
      messageManager.broadcastAsyncMessage('MGest', 'destroy');
      messageManager.removeDelayedFrameScript(MGest.utils.frameScript);
      messageManager.removeMessageListener('imgurl', MGest.utils.chromeListener);
      MGest.utils.destroy();
      delete MGest;
    },
    utils: {
      init: function () {
        var self = this;
        ['mousedown', 'wheel', 'mouseup', 'contextmenu', 'drop', 'click'].forEach(function (type) {
          document.addEventListener(type, self, true);
        });
        ['mouseleave', 'mousemove'].forEach(function (type) {
          document.addEventListener(type, self, false);
        });
      },
      destroy: function () {
        var self = this;
        ['mousedown', 'wheel', 'mouseup', 'contextmenu', 'drop', 'click'].forEach(function (type) {
          document.removeEventListener(type, self, true);
        });
        ['mouseleave', 'mousemove'].forEach(function (type) {
          document.removeEventListener(type, self, false);
        });
      },
      chromeListener: function (message) {
        if (message.data)
          gBrowser.addTab(message.data, {owner: gBrowser.selectedTab, relatedToCurrent: true, triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
        else
          document.commandDispatcher.getControllerForCommand('cmd_moveBottom').doCommand('cmd_moveBottom');
      },
      frameScript: 'data:application/javascript;charset=UTF-8,' + 
        encodeURIComponent('(' + (function () {
          if (content.location.href.startsWith('moz-extension://')) // webextension não remote, cada uma é framescript
            return;
          var imgSrc = function (e) {
            if (e.target.src) {//e.target instanceof Ci.nsIImageLoadingContent talvez seja o ideal, mas não vi problema no atual
              elm = e.target.src;
            } else if (e.target.tagName == 'AREA') {
              let uM = e.target.ownerDocument.querySelector('[usemap]');
              if (uM && uM.useMap == '#' + e.target.parentElement.name) {
                elm = uM.src;
              } else {
                elm = undefined;
              }
            } else {
              elm = undefined;
            }
          }
          addEventListener('mousedown', imgSrc);
          contentListener = function (msg) {
            if (msg.data == 'img' && typeof elm != 'undefined') {
              sendAsyncMessage('imgurl', elm);
            } else if (msg.data == 'down') {
              if (typeof elm != 'undefined') {
                sendAsyncMessage('imgurl', 'http://www.google.com.br/searchbyimage?image_url=' + encodeURIComponent(elm));
              } else {
                sendAsyncMessage('imgurl');
              }
            } else if (msg.data == 'deselect') {
              content.getSelection().removeAllRanges();
            } else if (msg.data == 'destroy') {
              removeEventListener('mousedown', imgSrc);
              removeMessageListener('MGest', contentListener);
              delete imgSrc;
              delete contentListener;
            }
          }
          addMessageListener('MGest', contentListener);
        }).toString() + ')();'),
      lastX: 0,
      lastY: 0,
      directionChain: '',
      isMouseDownL: false,
      isMouseDownM: false,
      isMouseDownR: false,
      isMouseUpL: false,
      isMouseUpM: false,
      isMouseUpR: false,
      isRelatedL: false,
      isRelatedM: false,
      isRelatedR: false,
      hideFireContext: false,
      GESTURES: {
        '1-': {
          name: 'Zoom in',
          cmd: function () {
            FullZoom.enlarge();
          }
        },
        '1+': {
          name: 'Zoom out',
          cmd: function () {
            FullZoom.reduce();
          }
        },
        'R': {
          name: 'Open image URL',
          cmd: function () {
            gBrowser.selectedBrowser.messageManager.sendAsyncMessage('MGest', 'img');
          }
        },
        'M>L': {
          name: 'Zoom reset',
          cmd: function () {
            FullZoom.reset();
          }
        },
        'R>L': {
          name: 'Switch to last selected tab',
          cmd: function () {
            let previousTab = gBrowser.selectedTab;
            let lastAccessed  = 0;
            for (let tab of gBrowser.tabs) {
              if (!tab._notselectedsinceload && !tab.getAttribute('pending') && tab._lastAccessed > lastAccessed && tab != gBrowser.selectedTab) {
                lastAccessed = tab._lastAccessed;
                previousTab = tab;
              }
            }
            gBrowser.selectedTab = previousTab;
          }
        },
        'L>M': {
          name: 'Duplicate tab',
          cmd: function () {
            if ('duplicateTab' in gBrowser) {
              gBrowser.duplicateTab(gBrowser._selectedTab);
            } else {
              gBrowser.addTab(gBrowser.currentURI.spec, {triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
            }
          }
        },
        '2+': {
          name: 'Next tab',
          cmd: function () {
            gBrowser.tabContainer.advanceSelectedTab(1, true);
          }
        },
        '2-': {
          name: 'Previous tab',
          cmd: function () {
            gBrowser.tabContainer.advanceSelectedTab(-1, true);
          }
        },
        'L>R': {
          name: 'Reload current tab',
          cmd: function () {
            openLinkIn(gBrowser.currentURI.spec, 'current', {allowThirdPartyFixup: true, targetBrowser: gBrowser.selectedBrowser, indicateErrorPageLoad: true, allowPinnedTabHostChange: true, disallowInheritPrincipal: true, allowPopups: false, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});
          }
        },
        'R>M': {
          name: 'Close current tab',
          cmd: function () {
            gBrowser.removeCurrentTab();
          }
        },
        'U': {
          name: 'Go to top of page (strict)',
          cmd: function () {
            document.commandDispatcher.getControllerForCommand('cmd_moveTop').doCommand('cmd_moveTop');
          }
        },
        'D': {
          name: 'Go to bottom of page (strict) / Image search',
          cmd: function () {
            gBrowser.selectedBrowser.messageManager.sendAsyncMessage('MGest', 'down');
          }
        }
      },
      handleEvent: function (event) {
        switch (event.type) {
        case 'mousedown':
          //if(/object|embed/i.test(event.target.localName)) return;
          if (event.button == 2) {
            if (this.isMouseUpR) {
              this.isMouseUpR = false;
            }
            this.hideFireContext = false;
            [this.lastX, this.lastY, this.directionChain] = [event.screenX, event.screenY, ''];
            if (this.isMouseDownL) {
              this.hideFireContext = true;
              this.isRelatedL = true;
              this.isRelatedR = true;
              this.stopGesture(event, 'L>R');
              event.preventDefault();
              event.stopPropagation();
            } else if (this.isMouseDownM) {
              this.hideFireContext = true;
              this.isRelatedM = true;
              this.isRelatedR = true;
              this.stopGesture(event, 'M>R');
              event.preventDefault();
              event.stopPropagation();
            } else {
              this.isMouseDownR = true;
            }
          } else if (event.button == 0) {
            if (this.isMouseUpL) {
              this.isMouseUpL = false;
            }
            if (this.isMouseDownR) {
              this.hideFireContext = true;
              this.directionChain = '';
              this.isRelatedR = true;
              this.isRelatedL = true;
              this.stopGesture(event, 'R>L');
              event.preventDefault();
              event.stopPropagation();
            } else if (this.isMouseDownM) {
              this.hideFireContext = true;
              this.isRelatedM = true;
              this.isRelatedL = true;
              this.stopGesture(event, 'M>L');
              event.preventDefault();
              event.stopPropagation();
            } else {
              this.isMouseDownL = true;
            }
          } else if (event.button == 1) {
            if (this.isMouseUpM) {
              this.isMouseUpM = false;
            }
            if (this.isMouseDownR) {
              this.hideFireContext = true;
              this.directionChain = '';
              this.isRelatedR = true;
              this.isRelatedM = true;
              this.stopGesture(event, 'R>M');
              event.preventDefault();
              event.stopPropagation();
            } else if (this.isMouseDownL) {
              this.hideFireContext = true;
              this.isRelatedL = true;
              this.isRelatedM = true;
              this.stopGesture(event, 'L>M');
              event.preventDefault();
              event.stopPropagation();
            } else {
              this.isMouseDownM = true;
            }
          }
          break;
        case 'mousemove':
          if (this.isMouseDownR) {
            this.hideFireContext = true;
            var [subX, subY] = [event.screenX - this.lastX, event.screenY - this.lastY];
            var [distX, distY] = [(subX > 0 ? subX : (-subX)), (subY > 0 ? subY : (-subY))];
            var direction;
            if (distX < 10 && distY < 10) return;
            if (distX > distY) direction = subX < 0 ? 'L' : 'R';
            else direction = subY < 0 ? 'U' : 'D';
            if (direction != this.directionChain.charAt(this.directionChain.length - 1)) {
              this.directionChain += direction;
            }
            this.lastX = event.screenX;
            this.lastY = event.screenY;
          }
          if (this.isMouseDownL) {
            this.isMouseDownL = false;
          }
          if (this.isMouseDownM) {
            this.isMouseDownM = false;
          }
          break;
        case 'mouseup':
          if (event.ctrlKey && event.button == 2) {
            this.isMouseDownR = false;
            this.hideFireContext = false;
            event.preventDefault();
            event.stopPropagation();
          }
          if (event.button == 2) {
            if (this.isMouseDownR) {
              this.isMouseDownR = false;
            }
            if (this.isRelatedR) {
              this.isMouseUpR = true;
              this.isRelatedR = false;
              event.preventDefault();
              event.stopPropagation();
            }
            if (this.directionChain) {
              this.stopGesture(event, this.directionChain);
            }
          } else if (event.button == 0) {
            if (this.isMouseDownL) {
              this.isMouseDownL = false;
            }
            if (this.isRelatedL/* && event.target.tagName != 'OBJECT'*/) {
              this.isMouseUpL = true;
              this.isRelatedL = false;
              gBrowser.selectedBrowser.messageManager.sendAsyncMessage('MGest', 'deselect');
              event.preventDefault();
              event.stopPropagation();
            }
          } else if (event.button == 1) {
            if (this.isMouseDownM) {
              this.isMouseDownM = false;
            }
            if (this.isRelatedM) {
              this.isMouseUpM = true;
              this.isRelatedM = false;
              event.preventDefault();
              event.stopPropagation();
            }
          }
          break;
        case 'click':
          if (event.button == 2) {
            if (this.isMouseUpR) {
              this.isMouseUpR = false;
              event.preventDefault();
              event.stopPropagation();
            }
          } else if (event.button == 0) {
            if (this.isMouseUpL) {
              this.isMouseUpL = false;
              event.preventDefault();
              event.stopPropagation();
            }
          } else if (event.button == 1) {
            if (this.isMouseUpM) {
              this.isMouseUpM = false;
              event.preventDefault();
              event.stopPropagation();
            }
          }
          break;
        case 'contextmenu':
          if (this.isMouseDownL || this.isMouseDownR || this.isMouseDownM || this.hideFireContext) {
            event.preventDefault();
            event.stopPropagation();
            this.hideFireContext = false;
          }
          break;
        case 'wheel':
          if (this.isMouseDownR) {
            event.preventDefault();
            event.stopPropagation();
            this.hideFireContext = true;
            this.directionChain = '';
            this.isRelatedR = true;
            this.stopGesture(event, '2' + (event.deltaY > 0 ? '+' : '-'));
          } else if (this.isMouseDownL) {
            event.preventDefault();
            event.stopPropagation();
            this.isRelatedL = true;
            this.stopGesture(event, '0' + (event.deltaY > 0 ? '+' : '-'));
          } else if (this.isMouseDownM) {
            event.preventDefault();
            event.stopPropagation();
            if (gBrowser.getBrowserForTab(gBrowser._selectedTab)._autoScrollPopup && gBrowser.getBrowserForTab(gBrowser._selectedTab)._autoScrollPopup.state == 'open')
              gBrowser.getBrowserForTab(gBrowser._selectedTab)._autoScrollPopup.hidePopup();
            this.isRelatedM = true;
            this.stopGesture(event, '1' + (event.deltaY > 0 ? '+' : '-'));
          }
          break;
        case 'mouseleave':
          if (this.isMouseDownL)
            this.isMouseDownL = false;
          if (this.isMouseDownM)
            this.isMouseDownM = false;
          if (this.isMouseDownR) {
            this.isMouseDownR = false;
            this.directionChain = '';
          }
          break;
        case 'drop':
          this.isMouseDownL = false;
        }
      },
      stopGesture: function (event, gst) {
        if (this.GESTURES[gst]) {
          this.GESTURES[gst].cmd(this, event);
        }
      }
    }
  };

  MGest.init();

})()