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
      play: '.Root__now-playing-bar .control-button--circled',
      previous: '.Root__now-playing-bar .spoticon-skip-back-16',
      next: '.Root__now-playing-bar .spoticon-skip-forward-16'
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
    let document = win.document;
    let gBrowser = win.gBrowser;
    gBrowser.addEventListener('DOMAudioPlaybackStarted', this.audioStarted);
    gBrowser.addEventListener('DOMAudioPlaybackStopped', this.audioStopped);

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
    let closedBrowser = gBrowser.getBrowserForTab(ev.target);
    if (UC.beQuiet.browser == closedBrowser) {
      UC.beQuiet.playing = false;
      return;
    }
    UC.beQuiet.stack.find(browser => {
      if (closedBrowser == browser) {
        let index = UC.beQuiet.stack.indexOf(browser);
        if (index != -1)
          UC.beQuiet.stack.splice(index, 1);
        return true;
      }
    });
  },

  doAction (action) {
    if (!UC.beQuiet.browser)
      return;
    this.sites.find(site => {
      if (site.rx.test(UC.beQuiet.browser.currentURI.spec)) {
        let selector = site[action];
        if (selector)
          UC.beQuiet.browser.messageManager.sendAsyncMessage('bequiet', selector);
        return true;
      }
      return false;
    });
  },

  audioStarted (ev) {
    let browser = ev.target;
    if (UC.beQuiet.sites.find(site => site.rx.test(browser.currentURI.spec))) {
      if (UC.beQuiet.playing && UC.beQuiet.browser != browser) {
        UC.beQuiet.stackingBrowser = UC.beQuiet.browser;
        UC.beQuiet.doAction('play'); // pause
        UC.beQuiet.stack.unshift(UC.beQuiet.browser);
      }
      UC.beQuiet.browser = browser;
    }
    UC.beQuiet.playing = true;
  },

  audioStopped (ev) {
    let browser = ev.target;
    if (UC.beQuiet.stackingBrowser != browser) {
      UC.beQuiet.playing = false;
      if (UC.beQuiet.stack.length) {
        UC.beQuiet.browser = UC.beQuiet.stack.shift();
        UC.beQuiet.doAction('play');
      }
    } else {
      UC.beQuiet.stackingBrowser = null;
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

  init: function () {
    Services.mm.loadFrameScript(this.frameScript, true);
  },

  destroy: function () {
    Services.mm.removeDelayedFrameScript(this.frameScript);
    Services.mm.broadcastAsyncMessage('bequiet', 'destroy');
    _uc.windows((doc, win) => {
      let gBrowser = win.gBrowser;
      gBrowser.removeEventListener('DOMAudioPlaybackStarted', this.audioStarted);
      gBrowser.removeEventListener('DOMAudioPlaybackStopped', this.audioStopped);
      doc.getElementById('beQuiet-keyset').remove();
      gBrowser.tabContainer.removeEventListener('TabClose', this.onTabClose);
    });
    delete UC.beQuiet;
  }
}

UC.beQuiet.init();