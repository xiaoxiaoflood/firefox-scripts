A Firefox WebExtension Experiment addon to load bootstrapped legacy addons (like the others in this repository), whose support was removed in Fx 65.

Before install, open *about:config*, then:

`xpinstall.signatures.required = false`

`extensions.experiments.enabled = true`

## Compatibility

This addon can only be installed in [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) (main compatibility target) and [Firefox Nightly](https://www.mozilla.org/firefox/channel/desktop/#nightly). If you want to use legacy addons on normal Firefox, Beta or ESR, use [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts#userchromejs) instead.