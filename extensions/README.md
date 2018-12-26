Unnoficial versions for Fx 57+.

Just for Firefox Developer Edition (main compatibility target) and Firefox Nightly.

Firefox release, Beta and ESR can't run legacy addons.

## Instructions

1. If you're using Fx ≥ 65, you need to install [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts#instructions) because they removed the internal component that loads legacy addons. userChromeJS has the code to restore it.

2. This step is automated in userChromeJS, so if you installed it you can skip to 3.

   Before install, open *about:config*, then:
   
   `xpinstall.signatures.required = false`
   
   `extensions.legacy.enabled = true`
   
3. Install the desired legacy addon from the folders above (*.xpi* file).
