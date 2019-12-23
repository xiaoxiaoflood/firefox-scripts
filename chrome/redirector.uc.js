// ==UserScript==
// @name            Redirector
// @include         main
// @shutdown        UC.Redirector.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

// original: https://github.com/harv/userChromeJS/blob/master/redirector_ui.uc.js

(function () {

  UC.Redirector = {

    // [regex, replace, decode, tld]
    rules: [[
      /^https?:\/\/redir\.folha\.com\.br\/redir\/online\/.+?\*(.+)/,
      '$1',
      true
    ], [
      /^https?:\/\/www\.google\.tld\/url\?(?:.*&)?(?:url|q)=([^&#]+).*/,
      '$1',
      true,
      true
    ], [
      /^https:\/\/outgoing\.prod\.mozaws\.net\/v1\/\w+\/(.+)/,
      '$1',
      true
    ], [
      /^https?:\/\/click\.uol\.com\.br\/\?(?:.*&)?u=([^&#]+).*/,
      '$1',
      true
    ], [
      /^https?:\/\/(?:(?:m|new)\.)?vk\.com\/away\.php\?(?:.*&)?to=([^&#]+).*/,
      '$1',
      true
    ], [
      /^https?:\/\/l\.instagram\.com\/\?(?:.*&)?u=([^&#]+).*/,
      '$1',
      true
    ], [
      /^https?:\/\/www\.youtube\.com\/redirect\?(?:.*&)?q=([^&#]+).*/,
      '$1',
      true
    ], [
      /^https?:\/\/www\.reddit\.com\/u(?:(?:ser\/([^\/]+)\/?$)|\/(?:([^\/]+)\/?$|(.*)))/,
      function (url) {
        return 'https://www.reddit.com/user/' + (url[3] ? url[3] : (url[1] || url[2]) + '/overview/');
      }
    ], [
      /^https?:\/\/bugzil\.la\/(.*)/,
      function (url) {
        return 'https://bugzilla.mozilla.org/' + (url[1] ? 'show_bug.cgi?id=' + url[1] : '');
      }
    ], [
      /^https?:\/\/youtu\.be\/(.*)/,
      function (url) {
        return 'https://www.youtube.com/' + (url[1] ? 'watch?v=' + url[1] : '');
      }
    ], [
      /^https?:\/\/(userscripts\.org(?:\:8080|)|(?:www.|)webextender.net)\/(.*)/,
      'http://userscripts-mirror.org/$2'
    ], [
      /^http:\/\/ftp\.(mozilla\.org.*)/,
      'http://archive.$1'
    ], [
      //Remove universal parameters
      /(?:(\?)|&)(?:(?:(?:utm_\w+|ref|referer|soc_\w+|cc_key|PHPSESSID|igshid|__twitter_impression|ved|cmpid|newreg|tag|fbclid|fref|variation|searchVariation|tracking_id)=).*?)(?=&|$|#)/g,
      '$1'
    ], [
      //Remove unnecesary ? and &
      /(?:(\?)(?:&+(?!$|&)))|(?:&(?=&))|(?:(?:\??&+|\?)$)/g,
      '$1'
    ]],

    getRedirectUrl: function (originUrl) {
      var nsIOriginUrl = Services.io.newURI(originUrl);
      if (!nsIOriginUrl.asciiHost)
        return false;
      var tld = Services.eTLD.getPublicSuffix(nsIOriginUrl).replace(/\./, '\\.');
      var redirectUrl = false;
      this.rules.forEach( function (rule) {
        var regex = rule[3] ? new RegExp(rule[0].source.replace(/\.tld/, '\.' + tld)) : rule[0];
        if (regex.test(originUrl)) {
          if (!redirectUrl)
            redirectUrl = true;
          originUrl = typeof rule[1] == 'function'
            ? rule[2]
              ? decodeURIComponent(rule[1](originUrl.match(regex)))
              : rule[1](originUrl.match(regex))
            : rule[2]
              ? decodeURIComponent(originUrl.replace(regex, rule[1]))
              : originUrl.replace(regex, rule[1]);
        }
      });
      return redirectUrl ? originUrl : false;
    },
          
    get processScript () {
      return 'data:application/javascript;charset=UTF-8,(' + encodeURIComponent(function (rules, getRedirectUrl) {
        Components.utils.import("resource://gre/modules/Services.jsm");

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
              Services.catMan.addCategoryEntry(category, this.contractID, this.contractID, false, true);
          },
          
          destroy: function () {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this.classID, this);
            for (let category of this.xpcom_categories)
              Services.catMan.deleteCategoryEntry(category, this.contractID, false);
          },

          // nsIContentPolicy interface implementation
          shouldLoad: function (contentLocation, loadInfo) {
            if (loadInfo.externalContentPolicyType != Ci.nsIContentPolicy.TYPE_DOCUMENT)
              return Ci.nsIContentPolicy.ACCEPT;
            let redirectUrl = this.getRedirectUrl(contentLocation.spec);
            let loadingPrincipal = loadInfo.loadingPrincipal;
            let requestOrigin = loadingPrincipal ? loadingPrincipal.URI : null;
            let node = loadInfo.loadingContext;
            if (redirectUrl && node) {
              node.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIBrowserChild).messageManager.sendAsyncMessage('Redirector', [redirectUrl, requestOrigin]);
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
                webNav = callback.getInterface(Ci.nsILoadContext).topFrameElement.webNavigation;// funciona sem webNavigation também
                break;
              } catch(e) {}
            }
            if (!webNav)
              return;
            let redirectUrl = this.getRedirectUrl(newLocation);
            if (redirectUrl)
              webNav.loadURI(redirectUrl, {triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
          },

          createInstance: function (outer, iid) {
            if (outer)
              throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
          },

          QueryInterface: ChromeUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIChannelEventSink]),

          rules: rules,

          getRedirectUrl: getRedirectUrl
        };

        policy.init();
      }.toString() + ')(' + this.rules.toSource() + ', ' + this.getRedirectUrl.toString() + ')');
    },

    chromeListener: function (m) {
      m.target.loadURI(m.data[0], {referer: m.data[1], triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
    },

    init: function () {
      Services.ppmm.loadProcessScript(this.processScript, true);
      Services.mm.addMessageListener('Redirector', this.chromeListener);
    },

    destroy: function () {
      Services.ppmm.loadProcessScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('('+(function () {
        this.policy.destroy();
        delete this.policy;
      }).toString() + ')();'), false);
      Services.ppmm.removeDelayedProcessScript(this.processScript);
      Services.mm.removeMessageListener('Redirector', this.chromeListener);
      delete UC.Redirector;
    }
  }

  UC.Redirector.init();

})()
