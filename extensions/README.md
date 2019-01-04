Unnoficial versions for Fx 57+.

Just for [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) (main compatibility target) and [Firefox Nightly](https://www.mozilla.org/firefox/channel/desktop/#nightly).

Firefox release, Beta and ESR can't run legacy addons.

## Instructions

1. If you're using Fx ≥ 65, you need to install [bootstrapLoader.xpi](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/extensions/bootstrapLoader) OR [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts#instructions), because Fx 65 removed the internal component that loads legacy addons. bootstrapLoader.xpi is easier to install and should work just fine, but userChromeJS is the ideal choice.

2. This step is automated in userChromeJS, so if you installed it you can skip to 3.

   Before install, open *about:config*, then:
   
   `xpinstall.signatures.required = false`
   
   `extensions.legacy.enabled = true`
   
3. Install the desired legacy addons from the folders above (*.xpi* files).
