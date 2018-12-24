A Firefox WebExtension Experiment addon to load bootstrapped legacy addons (like the others in this repository).

Just for Firefox Developer Edition (main compatibility target) and Firefox Nightly.

Firefox release, Beta and ESR can't run legacy addons.

Before install, open *about:config*, then:

`xpinstall.signatures.required = false`

`extensions.legacy.enabled = true`
