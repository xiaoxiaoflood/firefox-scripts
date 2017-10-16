// ==UserScript==
// @name      redirector.uc.js
// @include   main
// @startup   Redirector.init();
// @shutdown  Redirector.destroy();
// ==/UserScript==

(function () {

  Redirector = {

    // [regex, replace, decode]
    rules: [[
      /^https?:\/\/redir\.folha\.com\.br\/redir\/online\/.+?\*(.+)/,
      '$1',
      true
    ], [
      /^https?:\/\/www\.google\.com\/url\?q=(.+?)&.*/,
      '$1',
      true
    ], [
      /^https:\/\/outgoing\.prod\.mozaws\.net\/v1\/\w+\/(.+)/,
      '$1',
      true
    ], [
      /^https?:\/\/click\.uol\.com.br\/.*?(?:\?|&)u=(.*?)(?:&.*|$)/,
      '$1',
      true
    ], [
      /^https?:\/\/(?:(?:m|new)\.)?vk\.com\/away\.php\?to=(.+)/,
      '$1',
      true
    ], [
      /^https?:\/\/l\.instagram\.com\/\?u=(.+?)&.*/,
      '$1',
      true
    ], [
      /^https?:\/\/youtu\.be\/(.+)/,
      'https://www.youtube.com/watch?v=$1'
    ], [
      /^https?:\/\/(userscripts\.org(?:\:8080|)|(?:www.|)webextender.net)\/(.*)/,
      'http://userscripts-mirror.org/$2'
    ], [
      /^http:\/\/ftp\.(mozilla\.org.*)/,
      'http://archive.$1'
    ], [
      //Remove universal parameters
      /(?:(\?)|&)(?:(?:(?:utm_\w+|ref|referer|soc_\w+|cc_key|PHPSESSID|ved|cmpid|lang)=).*?|sid=[0-9A-Fa-f]{32})(?=&|$)/g,
      '$1'
    ], [
      //Remove unnecesary ? and &
      /(?:(\?)(?:&+(?!$|&)))|(?:&(?=&))|(?:(?:\??&+|\?)$)/g,
      '$1'
    ]],
          
    get frameScript () {
      return 'data:application/javascript;charset=UTF-8,(' + encodeURIComponent(function (rules) {
        var {
          interfaces: Ci,
          results: Cr,
          manager: Cm
        } = Components;

        this.policy = {
          contractID: '@xiao/redirector;1',
          classID: Components.ID('{009e4d80-b13f-11e7-8f1a-0800200c9a66}'),

          init: function () {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this.classID, 'Redirector', this.contractID, this);
            XPCOMUtils.categoryManager.addCategoryEntry(['content-policy'], this.contractID, this.contractID, false, true);
          },
          
          destroy: function () {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this.classID, this);
            XPCOMUtils.categoryManager.deleteCategoryEntry(['content-policy'], this.contractID, false);
          },

          shouldLoad: function (contentType, contentLocation, requestOrigin, node) {
            let redirectUrl = this.getRedirectUrl(contentLocation.spec);
            if (contentType == Ci.nsIContentPolicy.TYPE_DOCUMENT && redirectUrl && node) {
              node.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).loadURI(redirectUrl, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, requestOrigin, null, null);
              return Ci.nsIContentPolicy.REJECT_REQUEST;
            }
            return Ci.nsIContentPolicy.ACCEPT;
          },

          createInstance: function (outer, iid) {
            if (outer)
              throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
          },

          QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy]),

          rules: rules,

          getRedirectUrl: function (originUrl) {
            var redirectUrl = false;
            this.rules.forEach( function (rule) {
              if (rule[0].test(originUrl)) {
                if (!redirectUrl)
                  redirectUrl = true;
                originUrl = typeof rule[1] == 'function'
                  ? rule[2]
                    ? decodeURIComponent(rule[1](originUrl.match(rule[0])))
                    : rule[1](originUrl.match(rule[0]))
                  : rule[2]
                    ? decodeURIComponent(originUrl.replace(rule[0], rule[1]))
                    : originUrl.replace(rule[0], rule[1]);
              }
            });
            return redirectUrl ? originUrl : false;
          }
        };

        policy.init();
      }.toString() + ')(' + this.rules.toSource() + ')');
    },

    init: function () {
      Services.ppmm.loadProcessScript(this.frameScript, true);
    },

    destroy: function () {
      Services.ppmm.loadProcessScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('('+(function () {
        this.policy.destroy();
        delete this.policy;
      }).toString() + ')();'), false);
      Services.ppmm.removeDelayedProcessScript(this.frameScript);
      delete Redirector;
    }
  }

  Redirector.init();
})()
