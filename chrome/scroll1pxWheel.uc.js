// ==UserScript==
// @name            Scroll 1px on Wheel over AutoScroll
// @author          xiaoxiaoflood
// @include         main
// @startup         UC.WheelAutoScroll_1px.exec(win);
// @shutdown        UC.WheelAutoScroll_1px.destroy();
// @onlyonce
// ==/UserScript==

const { customElements } = window;

UC.WheelAutoScroll_1px = {
  exec: function (win) {
    const { content, customElements, setTimeout } = win;
    win.eval('customElements.get(\'browser\').prototype.startScroll = function ' +
             customElements.get('browser').prototype.startScroll.toString().
               replace(/window\.addEventListener\("DOMMouseScroll", this, true\);/,
                       `
      UC.WheelAutoScroll_1px.startar = true;
      this.handleEventWrapper = (e) => {
        this.handleEvent(e, arguments[0]);
      };
      window.addEventListener("DOMMouseScroll", this.handleEventWrapper, { passive: false, capture: true });\n`).
               replace(/!this.autoscrollEnabled/,
                       '!this.autoscrollEnabled || (this._autoScrollPopup?.state == "open" && UC.WheelAutoScroll_1px.startar)').
               replace(/^function /,
                       '').
               replace(/Services\.obs\.addObserver\(this\.observer, "apz:cancel-autoscroll", true\);/,
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
            if (!content) {
              let data = arguments[1];
              if (!this._autoScrollPopup._hidePopup) {
                this._autoScrollPopup._hidePopup = this._autoScrollPopup.hidePopup;
              }
              this._autoScrollPopup.hidePopup = () => {};
              setTimeout(() => {
                this._autoScrollPopup.hidePopup = this._autoScrollPopup._hidePopup;
                this.stopScroll();
                UC.WheelAutoScroll_1px.startar = false;
                this.startScroll(data);
              });
            }
            this.messageManager.sendAsyncMessage('autoscroll', { d: aEvent.detail, x: aEvent.clientX, y: aEvent.clientY });
            aEvent.preventDefault();\n`).
           replace(/^function /,
                   ''));
  },

  startar: true,

  startScroll_orig: customElements.get('browser').prototype.startScroll.toString().replace(/^function /, ''),
  stopScroll_orig: customElements.get('browser').prototype.stopScroll.toString().replace(/^function /, ''),
  handleEvent_orig: customElements.get('browser').prototype.handleEvent.toString().replace(/^function /, ''),

  frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
    getScrollParent = el =>
      el.scrollTop != el.scrollTopMax
        ? el
        : el.parentElement
          ? getScrollParent(el.parentElement)
          : content.document.scrollingElement
    this.contentListener = (msg) => {
      if (msg.data.destroy) {
        removeMessageListener('autoscroll', this.contentListener);
      } else {
        let el = getScrollParent(content.document.elementFromPoint(msg.data.x, msg.data.y));
        if (msg.data.d < 0) {
          el.scrollBy(0, -1);
        } else if (msg.data.d > 0) {
          el.scrollBy(0, 1);
        }
      }
    }
    addMessageListener('autoscroll', this.contentListener);
  }).toString() + ')();'),

  init: function () {
    Services.mm.loadFrameScript(this.frameScript, true);
  },

  destroy: function () {
    Services.mm.removeDelayedFrameScript(this.frameScript);
    Services.mm.broadcastAsyncMessage('autoscroll', { destroy: true });
    _uc.windows((doc, win) => {
      const { customElements, eval, gBrowser } = win;
      eval('customElements.get(\'browser\').prototype.startScroll = function ' +
               this.startScroll_orig);
      eval('customElements.get(\'browser\').prototype.stopScroll = function ' +
               this.stopScroll_orig);
      eval('customElements.get(\'browser\').prototype.handleEvent = function ' +
               this.handleEvent_orig);
      gBrowser.browsers.forEach(browser => {
        if ('handleEventWrapper' in browser) {
          delete browser.handleEventWrapper;
        }
      });
    });
    delete UC.WheelAutoScroll_1px;
  }
}

UC.WheelAutoScroll_1px.init();