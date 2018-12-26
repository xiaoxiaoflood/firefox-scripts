Unnoficial version for Fx 57+.

Just for Firefox Developer Edition (main compatibility target) and Firefox Nightly.

Firefox release, Beta and ESR can't run legacy addons.

Since Fx 65, [bootstrap loader](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/extensions/bootstrapLoader/bootstrapLoader.xpi) is required.

Before install, open *about:config*, then:

`xpinstall.signatures.required = false`

`extensions.legacy.enabled = true`
