Unnoficial versions for Fx 57+.

Main compatibility target: [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/). Extensions may work on other versions, but I use DevEd on my main profile so I only test them on it. DevEd is virtually identical to Beta and is very stable in my experience.

## Instructions

1. If you're using Fx ≥ 65, you need to install [bootstrapLoader.xpi](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/extensions/bootstrapLoader) OR [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts#instructions), because Fx 65 removed the internal component that loads legacy addons. If you're  using normal Firefox (aka "stable" or "release"), Beta or ESR, you need to go with userChromeJS. bootstrapLoader.xpi is only an option for those who use [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) or [Firefox Nightly](https://www.mozilla.org/firefox/channel/desktop/#nightly). bootstrapLoader.xpi is easier to install, but userChromeJS is the ideal choice. I use userChromeJS.
   
2. Install the desired legacy addons from the folders above (*.xpi* files).

### Other legacy extensions fixed for current versions

- [Tab Groups](https://github.com/117649/Tab-Groups/releases/latest)