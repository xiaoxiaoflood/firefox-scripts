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
      var gBrowser = win.gBrowser;
      eval('gBrowser.selectedBrowser.__proto__.handleEvent = ' +
           gBrowser.selectedBrowser.__proto__.handleEvent.toString().
             replace(/case "DOMMouseScroll": {(\s+)([\s\S]+?)\n([\s\S]+?)\n/,
                     'case "DOMMouseScroll": {$1var x = aEvent.screenX - this._startX;$1var y = aEvent.screenY - this._startY;\n$1if ((x > this._AUTOSCROLL_SNAP || x < -this._AUTOSCROLL_SNAP) ||$1    (y > this._AUTOSCROLL_SNAP || y < -this._AUTOSCROLL_SNAP)) {$1  $2$1} else {$1  gBrowser.selectedBrowser.messageManager.sendAsyncMessage(\'autoscroll\', aEvent.detail);$1}\n$3\n'));
    },

    orig: gBrowser.selectedBrowser.__proto__.handleEvent.toString(),

    frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
      this.contentListener = function (msg) {
        if (msg.data < 0) {
          content.scrollBy(0, -1);
        } else {
          content.scrollBy(0, 1);
        }
      }
      this.addMessageListener('autoscroll', this.contentListener);
    }).toString() + ')();'),

    init: function () {
      xPref.set('apz.autoscroll.enabled', false);
      xPref.lock('apz.autoscroll.enabled', false);
      Services.mm.loadFrameScript(UC.WheelAutoScroll_1px.frameScript, true);
    },

    destroy: function () {
      xPref.unlock('apz.autoscroll.enabled');
      xPref.clear('apz.autoscroll.enabled');
      Services.mm.removeDelayedFrameScript(UC.WheelAutoScroll_1px.frameScript);
      Services.mm.loadFrameScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (function () {
        this.removeMessageListener('autoscroll', this.contentListener);
        delete this.contentListener;
      }).toString() + ')();'), false);
      var enumerator = Services.wm.getEnumerator('navigator:browser');
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.eval('gBrowser.selectedBrowser.__proto__.handleEvent = ' +
             UC.WheelAutoScroll_1px.orig);
      }
      delete UC.WheelAutoScroll_1px;
    }
  }

  UC.WheelAutoScroll_1px.init();

})()
