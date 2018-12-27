# userChromeJS

#### Tested on Firefox 58.0b7

* [Instructions](#instructions)
* [Screenshots](#screenshots)

## Instructions

1. Save [config.js](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/installation-folder/config.js) to Firefox installation folder (usually **C:\Program Files (x86)\Mozilla Firefox**), next to **firefox.exe**.

2. Save [config-prefs.js](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/installation-folder/config-prefs.js) into **\defaults\pref** inside Firefox installation folder (usually **C:\Program Files (x86)\Mozilla Firefox\defaults\pref**), next to **channel-prefs.js**.

3. Click Firefox menu button (☰) -> *Help* -> *Troubleshooting information* (or simply open the address "*about:support*"), then click *Open folder*. This is the folder of your Firefox profile. In there, create a new folder called **chrome**.

4. Inside **chrome**, create another new folder called **utils**, then save all [these](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome/utils) files into it.

5. Save [userChrome.js](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/userChrome.js) into **chrome**.

6. Save the desired [userChromeJS scripts](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome) into **chrome** folder, especially [rebuild_userChrome.uc.js](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/rebuild_userChrome.uc.js) (userChromeJS Manager with Greasemonkey-like button menu, see the 2nd screenshot below).

7. Restart Firefox.

## Screenshots

<img src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/folder.png">

###### userChromeJS Manager (the blue ones are restartless)
<img src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/rebuild_userChrome.png" height="600">

###### Status Bar, Extension Options Menu, MinMaxClose Button, newDownloadPlus.uc.js and legacy extensions:
<img  src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/window.png">
