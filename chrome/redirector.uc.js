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
    /(?:(\?)|&)(?:(?:(?:utm_\w+|ref|soc_\w+|cc_key|PHPSESSID|ig_mid|igshid|__twitter_impression|ved|cmpid|newreg|tag|fbclid|fref|variation|searchVariation|tracking_id|seller_id|partner_id|gclid)=).*?)(?=&|$|#)/g,
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
            ? rule[1](decodeURIComponent(originUrl).match(regex))
            : rule[1](originUrl.match(regex))
          : rule[2]
            ? decodeURIComponent(originUrl.replace(regex, rule[1]))
            : originUrl.replace(regex, rule[1]);
      }
    });
    return redirectUrl ? originUrl : false;
  },

  observe: function (subject) {
    let httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
    if (httpChannel.loadInfo.originAttributes.firstPartyDomain.startsWith('(view-source'))
      return;
    let contentType = httpChannel.loadInfo.externalContentPolicyType;
    if (contentType == Ci.nsIContentPolicy.TYPE_DOCUMENT && httpChannel.requestMethod == 'GET') {
      let redirectUrl = this.getRedirectUrl(httpChannel.URI.spec);
      if (redirectUrl) {
        let loadInfo = httpChannel.loadInfo;
        loadInfo.browsingContext.embedderElement.loadURI(redirectUrl, {referer: loadInfo.loadingPrincipal?.URI, triggeringPrincipal: loadInfo.triggeringPrincipal});
      }
    } else if (contentType in this.internalRules) {
      let redirectUrl = this.getRedirectUrl(httpChannel.URI.spec, this.internalRules[contentType]);
      if (redirectUrl) {
        httpChannel.redirectTo(Services.io.newURI(redirectUrl));
      }
    }
  },


  init: function () {
    Services.obs.addObserver(this, 'http-on-modify-request', false);
  },

  destroy: function () {
    Services.obs.removeObserver(this, 'http-on-modify-request', false);
    delete UC.Redirector;
  }
}

UC.Redirector.init();