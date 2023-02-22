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
  // U, D, L, R: up, down, left, right / gesture direction
  // F, B: forward, back / for mouses with extra buttons
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
        UC.MGest.actor.cmd({ action: 'newTab' });
      }
    },
    '2L': {
      name: 'Copy URL from element',
      cmd: function (win) {
        UC.MGest.actor.cmd({ action: 'copyURL' });
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
          UC.MGest.actor.cmd({ action: 'copySelection', fallback: 'copyImage' });
      }
    },
    '2U': {
      name: 'Go to top of page (strict)',
      cmd: function (win) {
        UC.MGest.actor.cmd({ action: 'scroll', direction: 'up' });
      }
    },
    '2D': {
      name: 'Go to bottom of page (strict) / Image search',
      cmd: function (win) {
        UC.MGest.actor.cmd({
          action: 'newTab',
          type: 'image',
          templateURL: 'https://www.google.com/searchbyimage?sbisrc=cr_1_5_2&image_url=%s',
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
      cmd: function () {
        function speedUpVideo (win) {
          let video = win.document.querySelector('html > div > video');
          if (video)
            video.playbackRate = video.playbackRate == video.defaultPlaybackRate ? 3 : video.defaultPlaybackRate;
        };
        UC.MGest.actor.cmd({ action: 'eval', code: speedUpVideo.toString(), name: this.name });
      }
    },
    '2F': {
      name: 'Video advance 5 seconds',
      cmd: function () {
        function advanceVideo (win) {
          let video = win.document.querySelector('html > div > video');
          if (video)
            video.currentTime += 5;
        };
        UC.MGest.actor.cmd({ action: 'eval', code: advanceVideo.toString(), name: this.name });
      }
    },
    '2B': {
      name: 'Video rewind 5 seconds',
      cmd: function () {
        function rewindVideo (win) {
          let video = win.document.querySelector('html > div > video');
          if (video)
            video.currentTime -= 5;
        };
        UC.MGest.actor.cmd({ action: 'eval', code: rewindVideo.toString(), name: this.name });
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
    ChromeUtils.registerWindowActor('MGest', {
      parent: {
        esModuleURI: 'resource://userchromejs/mouseGestures/MGestParent.sys.mjs',
      },

      child: {
        esModuleURI: 'resource://userchromejs/mouseGestures/MGestChild.sys.mjs',
        events: {
          mousedown: { mozSystemGroup: true },
        },
      },

      allFrames: true,
    });

    xPref.lock('ui.context_menus.after_mouseup', true);

    this.webExts.forEach(id => {
      if (UC.webExts.get(id)?.messageManager)
        this.addListener(id);
    });

    Services.obs.addObserver(this, 'UCJS:WebExtLoaded');
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

    ChromeUtils.unregisterWindowActor('MGest');

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
