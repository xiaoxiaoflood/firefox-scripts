// ==UserScript==
// @name            BeQuiet
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.beQuiet.exec(win);
// @shutdown        UC.beQuiet.destroy();
// @onlyonce
// ==/UserScript==

// inspired by https://addons.mozilla.org/en-US/firefox/addon/be-quiet/

UC.beQuiet = {
  sites: [
    {
      rx: /^https:\/\/www\.deezer\.com\//,
      play: 'li > button.svg-icon-group-btn',
      previous: '.player-controls li button',
      next: '.player-controls li:nth-of-type(5) button'
    },
    {
      rx: /^https:\/\/songa\.nl\//,
      play: '#play_button',
      previous: '#previous_button',
      next: '#next_button'
    },
    {
      rx: /^https:\/\/open\.spotify\.com\//,
      play: '.Root__now-playing-bar .player-controls__buttons > button',
      previous: '.Root__now-playing-bar .player-controls__left button:nth-of-type(2)',
      next: '.Root__now-playing-bar .player-controls__right button'
    },
    {
      rx: /^https:\/\/www\.twitch\.tv\//,
      play: 'button[data-a-target="player-play-pause-button"]'
    },
    {
      rx: /^https:\/\/vk\.com\//,
      play: '.top_audio_player_play',
      previous: '.top_audio_player_prev',
      next: '.top_audio_player_next'
    },
    {
      rx: /^https:\/\/www\.youtube\.com\//,
      play: '.ytp-play-button'
    }
  ],

  exec: function (win) {
    const { document, gBrowser } = win;
    gBrowser.addTabsProgressListener(this.progressListener);
    gBrowser.addEventListener('DOMAudioPlaybackStarted', this.audioStarted);
    gBrowser.addEventListener('DOMAudioPlaybackStopped', this.audioStopped);
    win.addEventListener('TabBrowserDiscarded', this.onTabClose);

    let keyset =  _uc.createElement(document, 'keyset', { id: 'beQuiet-keyset' });
    document.getElementById('mainKeyset').insertAdjacentElement('afterend', keyset);

    let playKey = _uc.createElement(document, 'key', {
      id: 'beQuiet-play-key',
      modifiers: 'alt control',
      key: 'S',
      oncommand: 'UC.beQuiet.doAction("play")',
    });
    keyset.appendChild(playKey);

    let previousKey = _uc.createElement(document, 'key', {
      id: 'beQuiet-previous-key',
      modifiers: 'alt control',
      key: 'A',
      oncommand: 'UC.beQuiet.doAction("previous")',
    });
    keyset.appendChild(previousKey);

    let nextKey = _uc.createElement(document, 'key', {
      id: 'beQuiet-next-key',
      modifiers: 'alt control',
      key: 'D',
      oncommand: 'UC.beQuiet.doAction("next")',
    });
    keyset.appendChild(nextKey);

    gBrowser.tabContainer.addEventListener('TabClose', this.onTabClose);
  },

  onTabClose (ev) {
    let closedBrowser = ev.target.linkedBrowser;
    if (UC.beQuiet.playingStack.includes(closedBrowser)) {
      if (closedBrowser == UC.beQuiet.playingBrowser) {
        UC.beQuiet.doAction('play', UC.beQuiet.prevPlayingBrowser);
      }
      UC.beQuiet.remove(UC.beQuiet.playingStack, closedBrowser);
    }
    UC.beQuiet.remove(UC.beQuiet.stack, closedBrowser);
  },

  progressListener: {
    onLocationChange: function (aBrowser, aWebProgress, aRequest, aLocation, aFlags) {
      if (!aWebProgress.isTopLevel ||
          aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_RELOAD ||
          aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_ERROR_PAGE)
          return;

      if (UC.beQuiet.stack.includes(aBrowser) && !UC.beQuiet.isURLCompatible(aLocation.spec))
        UC.beQuiet.remove(UC.beQuiet.stack, aBrowser);
    }
  },

  doAction (action, browser) {
    if (!browser) {
      if (this.playingBrowser)
        browser = this.playingBrowser;
      else
        browser = this.topStack;
    }

    if (!browser)
      return;

    this.sites.find(site => {
      if (site.rx.test(browser.currentURI.spec)) {
        let selector = site[action];
        if (selector)
          browser.messageManager.sendAsyncMessage('bequiet', selector);
        return true;
      }
      return false;
    });
  },

  audioStarted (ev) {
    let browser = ev.target;
    if (UC.beQuiet.isURLCompatible(browser.currentURI.spec)) {
      UC.beQuiet.addUnique(UC.beQuiet.stack, browser);
      UC.beQuiet.addUnique(UC.beQuiet.playingStack, browser);

      if (UC.beQuiet.prevPlayingBrowser) {
        UC.beQuiet.doAction('play', UC.beQuiet.prevPlayingBrowser);
      }
    }
  },

  isURLCompatible (url) {
    return UC.beQuiet.sites.find(site => site.rx.test(url))
  },

  get playingBrowser () {
    return this.playingStack[this.playingStack.length - 1];
  },

  get prevPlayingBrowser () {
    return this.playingStack[this.playingStack.length - 2];
  },

  get topStack () {
    return this.stack[this.stack.length - 1];
  },

  audioStopped (ev) {
    let browser = ev.target;
    if (browser == UC.beQuiet.playingBrowser) {
      UC.beQuiet.remove(UC.beQuiet.playingStack, UC.beQuiet.playingBrowser);
      if (UC.beQuiet.playingBrowser)
        UC.beQuiet.doAction('play', UC.beQuiet.playingBrowser);
    }
  },

  frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
    let contentListener = (msg) => {
      if (msg.data == 'destroy') {
        removeMessageListener('bequiet', contentListener);
        delete this.contentListener;
      } else {
        content.document.querySelector(msg.data)?.click();
      }
    }
    addMessageListener('bequiet', contentListener);
  }).toString() + ')();'),

  stack: [],

  playingStack: [],

  addUnique (stack, item) {
    this.remove(stack, item);
    stack.push(item);
  },

  remove (stack, item) {
    let index = stack.indexOf(item);
    if (index != -1) {
      stack.splice(index, 1);
    }
  },

  init: function () {
    Services.mm.loadFrameScript(this.frameScript, true);
  },

  destroy: function () {
    Services.mm.removeDelayedFrameScript(this.frameScript);
    Services.mm.broadcastAsyncMessage('bequiet', 'destroy');
    _uc.windows((doc, win) => {
      let gBrowser = win.gBrowser;
      gBrowser.removeTabsProgressListener(this.progressListener);
      gBrowser.removeEventListener('DOMAudioPlaybackStarted', this.audioStarted);
      gBrowser.removeEventListener('DOMAudioPlaybackStopped', this.audioStopped);
      doc.getElementById('beQuiet-keyset').remove();
      gBrowser.tabContainer.removeEventListener('TabClose', this.onTabClose);
      win.removeEventListener('TabBrowserDiscarded', this.onTabClose);
    });
    delete UC.beQuiet;
  }
}

UC.beQuiet.init();