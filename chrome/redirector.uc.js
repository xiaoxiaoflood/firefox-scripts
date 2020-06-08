// ==UserScript==
// @name            Redirector
// @author          xiaoxiaoflood
// @include         main
// @shutdown        UC.Redirector.destroy();
// @onlyonce
// ==/UserScript==

// inspired by: https://github.com/harv/userChromeJS/blob/master/redirector_ui.uc.js

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
    /^https?:\/\/www\.google\.tld\/imgres\?imgurl=([^&#]+).*/,
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
    /(?:(\?)|&)(?:(?:(?:utm_\w+|ref|soc_\w+|cc_key|PHPSESSID|ig_mid|igshid|__twitter_impression|ved|cmpid|newreg|tag|fbclid|fref|variation|searchVariation|tracking_id)=).*?)(?=&|$|#)/g,
    '$1'
  ], [
    //Remove unnecesary ? and &
    /(?:(\?)(?:&+(?!$|&)))|(?:&(?=&))|(?:(?:\??&+|\?)$)/g,
    '$1'
  ]],

  internalRules: {
    [Ci.nsIContentPolicy.TYPE_XMLHTTPREQUEST]: [
      // bypass blocked embed youtube videos
      [/^https:\/\/www\.youtube\.com\/get_video_info\?(?:video_id=(.+?)(?:&|%26)|.+?&video_id=(.+?)&).+?eurl=.+?(&.*|)$/,
       'https://www.youtube.com/get_video_info?video_id=$1$2&eurl=https%3A%2F%2Fyoutube.com$3'],
    ],
  },

  getRedirectUrl: function (originUrl, aRules = this.rules) {
    var nsIOriginUrl = Services.io.newURI(originUrl);
    if (nsIOriginUrl.scheme == 'jar' || !nsIOriginUrl.asciiHost)
      return false;
    try {
      var tld = Services.eTLD.getPublicSuffix(nsIOriginUrl).replace(/\./, '\\.');
    } catch (e) { // ip
      var tld = 'tld';
    }
    var redirectUrl = false;
    aRules?.forEach((rule) => {
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
          let node = loadInfo.loadingContext;
          if (redirectUrl && node) {
            node.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIBrowserChild).messageManager.sendAsyncMessage('Redirector', [redirectUrl, loadInfo.loadingPrincipal?.URI]);
            return Ci.nsIContentPolicy.REJECT_REQUEST;
          }
          return Ci.nsIContentPolicy.ACCEPT;
        },

        createInstance: function (outer, iid) {
          if (outer)
            throw Cr.NS_ERROR_NO_AGGREGATION;
          return this.QueryInterface(iid);
        },

        QueryInterface: ChromeUtils.generateQI([Ci.nsIContentPolicy]),

        rules: rules,

        getRedirectUrl: getRedirectUrl
      };

      policy.init();
    }.toString() + ')(' + this.rules.toSource() + ', ' + this.getRedirectUrl.toString() + ')');
  },

  chromeListener: function (m) {
    m.target.loadURI(m.data[0], {referer: m.data[1], triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
  },

  observe: function (subject) {
    let httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
    let redirectUrl = this.getRedirectUrl(httpChannel.URI.spec, this.internalRules[httpChannel.loadInfo.externalContentPolicyType]);
    if (redirectUrl) {
        httpChannel.redirectTo(Services.io.newURI(redirectUrl));
    }
  },

  init: function () {
    Services.ppmm.loadProcessScript(this.processScript, true);
    Services.mm.addMessageListener('Redirector', this.chromeListener);
    Services.obs.addObserver(this, 'http-on-modify-request', false);
  },

  destroy: function () {
    Services.ppmm.loadProcessScript('data:application/javascript;charset=UTF-8,' + encodeURIComponent('('+(function () {
      this.policy.destroy();
      delete this.policy;
    }).toString() + ')();'), false);
    Services.ppmm.removeDelayedProcessScript(this.processScript);
    Services.mm.removeMessageListener('Redirector', this.chromeListener);
    Services.obs.removeObserver(this, 'http-on-modify-request', false);
    delete UC.Redirector;
  }
}

UC.Redirector.init();