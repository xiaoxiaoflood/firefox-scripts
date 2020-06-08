// ==UserScript==
// @name            Scroll 1px on Wheel over AutoScroll
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.WheelAutoScroll_1px.exec(win);
// @shutdown        UC.WheelAutoScroll_1px.destroy();
// @onlyonce
// ==/UserScript==

UC.WheelAutoScroll_1px = {
  exec: function (win) {
    let customElements = win.customElements;
    win.eval('customElements.get(\'browser\').prototype.startScroll = function ' +
             customElements.get('browser').prototype.startScroll.toString().
               replace(/window\.addEventListener\("DOMMouseScroll", this, true\);/,
                       `this.handleEventWrapper = (e) => {
                          this.handleEvent(e, arguments[0]);
                        };
                        window.addEventListener("DOMMouseScroll", this.handleEventWrapper, true);`).
               replace(/^function /,
                       ''));
    eval('customElements.get(\'browser\').prototype.stopScroll = function ' +
         customElements.get('browser').prototype.stopScroll.toString().
           replace(/window\.removeEventListener\("DOMMouseScroll", this, true\);/,
                   `window.removeEventListener("DOMMouseScroll", this.handleEventWrapper, true);`).
           replace(/^function /,
                   ''));
    eval('customElements.get(\'browser\').prototype.handleEvent = function ' +
         customElements.get('browser').prototype.handleEvent.toString().
           replace(/case "DOMMouseScroll": {\s+[\s\S]+?\n[\s\S]+?\n/,
                   `case "DOMMouseScroll": {
                    let data = arguments[1];
                    if (!this._autoScrollPopup._hidePopup) {
                      this._autoScrollPopup._hidePopup = this._autoScrollPopup.hidePopup;
                    }
                    this._autoScrollPopup.hidePopup = () => {};
                    setTimeout(() => {
                      this._autoScrollPopup.hidePopup = this._autoScrollPopup._hidePopup;
                      this.stopScroll();
                      this.startScroll(data);
                    });
                    gBrowser.selectedBrowser.messageManager.sendAsyncMessage('autoscroll', aEvent.detail);
                    aEvent.preventDefault();`).
           replace(/^function /,
                   ''));
  },

  startScroll_orig: customElements.get('browser').prototype.startScroll.toString().replace(/^function /, ''),
  stopScroll_orig: customElements.get('browser').prototype.stopScroll.toString().replace(/^function /, ''),
  handleEvent_orig: customElements.get('browser').prototype.handleEvent.toString().replace(/^function /, ''),

  frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
    this.contentListener = (msg) => {
      if (msg.data < 0) {
        content.scrollBy(0, -1);
      } else if (msg.data > 0) {
        content.scrollBy(0, 1);
      } else if (msg.data == 'destroy') {
        removeMessageListener('autoscroll', this.contentListener);
      }
    }
    addMessageListener('autoscroll', this.contentListener);
  }).toString() + ')();'),

  init: function () {
    Services.mm.loadFrameScript(this.frameScript, true);
  },

  destroy: function () {
    Services.mm.removeDelayedFrameScript(this.frameScript);
    Services.mm.broadcastAsyncMessage('autoscroll', 'destroy');
    _uc.windows((doc, win) => {
      let customElements = win.customElements;
      let eval = win.eval;
      eval('customElements.get(\'browser\').prototype.startScroll = function ' +
               this.startScroll_orig);
      eval('customElements.get(\'browser\').prototype.stopScroll = function ' +
               this.stopScroll_orig);
      eval('customElements.get(\'browser\').prototype.handleEvent = function ' +
               this.handleEvent_orig);
      win.gBrowser.browsers.forEach(browser => {
        if ('handleEventWrapper' in browser) {
          delete browser.handleEventWrapper;
        }
      });
    });
    delete UC.WheelAutoScroll_1px;
  }
}

UC.WheelAutoScroll_1px.init();