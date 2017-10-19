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
          
    get processScript () {
      return 'data:application/javascript;charset=UTF-8,(' + encodeURIComponent(function (rules) {
        var {
          interfaces: Ci,
          results: Cr,
          manager: Cm
        } = Components;

        this.policy = {
          contractID: '@xiao/redirector;1',
          classID: Components.ID('{009e4d80-b13f-11e7-8f1a-0800200c9a66}'),
          xpcom_categories: ['content-policy', 'net-channel-event-sinks'],

          init: function () {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this.classID, 'Redirector', this.contractID, this);
            for (let category of this.xpcom_categories)
              XPCOMUtils.categoryManager.addCategoryEntry(category, this.contractID, this.contractID, false, true);
          },
          
          destroy: function () {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this.classID, this);
            for (let category of this.xpcom_categories)
              XPCOMUtils.categoryManager.deleteCategoryEntry(category, this.contractID, false);
          },

          // nsIContentPolicy interface implementation
          shouldLoad: function (contentType, contentLocation, requestOrigin, node) {
            let redirectUrl = this.getRedirectUrl(contentLocation.spec);
            if (contentType == Ci.nsIContentPolicy.TYPE_DOCUMENT && redirectUrl && node) {
              node.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).loadURI(redirectUrl, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, requestOrigin, null, null);
              return Ci.nsIContentPolicy.REJECT_REQUEST;
            }
            return Ci.nsIContentPolicy.ACCEPT;
          },

          // nsIChannelEventSink interface implementation
          asyncOnChannelRedirect: function (oldChannel, newChannel, flags, redirectCallback) {
            this.onChannelRedirect(oldChannel, newChannel, flags);
            redirectCallback.onRedirectVerifyCallback(Cr.NS_OK);
          },

          onChannelRedirect: function (oldChannel, newChannel, flags) {
              if (!(newChannel.loadFlags & Ci.nsIChannel.LOAD_INITIAL_DOCUMENT_URI))
                return;
              let newLocation = newChannel.URI.spec;
              if (!newLocation)
                return;
              let callbacks = [];
              if (newChannel.notificationCallbacks)
                callbacks.push(newChannel.notificationCallbacks);
              if (newChannel.loadGroup && newChannel.loadGroup.notificationCallbacks)
                callbacks.push(newChannel.loadGroup.notificationCallbacks);
              let webNav;
              for (let callback of callbacks) {
                try {
                  webNav = callback.getInterface(Ci.nsILoadContext).associatedWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation);
                  break;
                } catch(e) {}
              }
              if (!webNav)
                return;
              let redirectUrl = this.getRedirectUrl(newLocation);
              if (redirectUrl)
                webNav.loadURI(redirectUrl, null, null, null, null);
          },

          createInstance: function (outer, iid) {
            if (outer)
              throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
          },

          QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIChannelEventSink]),

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
      Services.ppmm.loadProcessScript(this.processScript, true);
    },

    destroy: function () {
      Services.ppmm.loadProcessScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('('+(function () {
        this.policy.destroy();
        delete this.policy;
      }).toString() + ')();'), false);
      Services.ppmm.removeDelayedProcessScript(this.processScript);
      delete Redirector;
    }
  }

  Redirector.init();
})()
