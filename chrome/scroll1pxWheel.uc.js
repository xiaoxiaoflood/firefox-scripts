// ==UserScript==
// @name            Scroll 1px on Wheel over AutoScroll
// @include         main
// @startup         UC.WheelAutoScroll_1px.exec(win);
// @shutdown        UC.WheelAutoScroll_1px.destroy();
// @author          xiaoxiaoflood
// @note            if apz.autoscroll.enabled = true, restart is needed
// @onlyonce
// ==/UserScript==

(function () {

  UC.WheelAutoScroll_1px = {
    exec: function (win) {
      var document = win.document;
      eval('document.querySelector(\'browser\').__proto__.handleEvent = function ' +
           document.querySelector('browser').__proto__.handleEvent.toString().
             replace(/(case "DOMMouseScroll": {)(\s+)([\s\S]+?)\n([\s\S]+?)\n/,
                     '$1$2var x = aEvent.screenX - this._startX;$2var y = aEvent.screenY - this._startY;\n$2if ((x > this._AUTOSCROLL_SNAP || x < -this._AUTOSCROLL_SNAP) ||$2    (y > this._AUTOSCROLL_SNAP || y < -this._AUTOSCROLL_SNAP)) {$2  $3$2} else {$2  gBrowser.selectedBrowser.messageManager.sendAsyncMessage(\'autoscroll\', aEvent.detail);$2}\n$4\n').
             replace(/^function /,
                     ''));
    },

    orig: document.querySelector('browser').__proto__.handleEvent.toString().replace(/^function /, ''),

    frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
      content.contentListener = function (msg) {
        if (msg.data < 0) {
          content.scrollBy(0, -1);
        } else {
          content.scrollBy(0, 1);
        }
      }
      addMessageListener('autoscroll', content.contentListener);
    }).toString() + ').call(this);'),

    init: function () {
      xPref.lock('apz.autoscroll.enabled', false);
      Services.mm.loadFrameScript(UC.WheelAutoScroll_1px.frameScript, true);
    },

    destroy: function () {
      xPref.unlock('apz.autoscroll.enabled');
      Services.mm.removeDelayedFrameScript(UC.WheelAutoScroll_1px.frameScript);
      Services.mm.loadFrameScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
        removeMessageListener('autoscroll', content.contentListener);
        delete content.contentListener;
      }).toString() + ')();'), false);
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.eval('document.querySelector(\'browser\').__proto__.handleEvent = function ' +
             UC.WheelAutoScroll_1px.orig);
      }
      delete UC.WheelAutoScroll_1px;
    }
  }

  UC.WheelAutoScroll_1px.init();

})()