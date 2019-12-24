# userChromeJS

#### Tested on Firefox Developer Edition 70.0b14, Windows 10

## Instructions

1. Save [config.js](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/installation-folder/config.js) to Firefox installation folder (usually **C:\Program Files (x86)\Mozilla Firefox**), next to **firefox.exe**.

2. Save [config-prefs.js](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/installation-folder/config-prefs.js) into **\defaults\pref** inside Firefox installation folder (usually **C:\Program Files (x86)\Mozilla Firefox\defaults\pref**), next to **channel-prefs.js**.

3. Click Firefox menu button (☰) -> *Help* -> *Troubleshooting information* (or simply open the address "*about:support*"), then click *Open folder*. This is the folder of your Firefox profile. In there, create a new folder called **chrome**.

4. Inside **chrome**, create another new folder called **utils**, then save all [these](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome/utils) files into it.

5. Save the desired [userChromeJS scripts](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome) into **chrome**. Read below the description of each one.

6. If you want a button to manage your userChromeJS scripts, save [rebuild_userChrome.uc.js](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/rebuild_userChrome.uc.js) into **chrome**.

7. Restart Firefox.

## userChromeJS scripts

(click on each to expand)
<details>
  <summary>Enter Selects</summary>
  Preselect the first suggestion from address bar. For instance, if this page is the first suggestion when you type "xia", you don't need to press down arrow key before Enter. This is a workaround for the bad Firefox design choice of autofill domains only.
  
  This script replaces the purpose of autofill, so `browser.urlbar.autoFill` is disabled on install. If you are typing part of a domain from the start and the first suggestion is from that domain (for instance, *git* from *github.com*), Tab key will autocomplete the domain even if the first suggestion is not the root.
  
  I suggest to set `browser.urlbar.suggest.searches = false` or `browser.urlbar.matchBuckets = general:5` (general:5 means 5 normal suggestions before search suggestions, adjust as you wish).

  [Download link](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/enterSelects.uc.js). 
</details>
<details>
  <summary>Extension Options Menu</summary>
  A single toolbar button to manage all your extensions. It opens a menu listing each extension. Left-click to open Options from the selected addon, right-click to enable/disable, Ctrl + right-click to uninstall. Hover anywhere on the menu to see more.
  
  I suggest to set `browser.urlbar.suggest.searches = false` or `browser.urlbar.matchBuckets = general:5` (general:5 means 5 normal suggestions before search suggestions, adjust as you wish).  

  Screenshot:
  ![](https://i.imgur.com/FWs3pYl.png)

  [Download link](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js).
</details>
<details>
  <summary>Master Password+</summary>
  Locks Firefox with password. It will prompt the password on browser startup or anytime when you lock it with Ctrl+Alt+Shift+W.
  
  You need to set a master password in <i>Firefox Options > Privacy & Security > [×] Use a master password</i>.

  [Download link](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/masterPasswordPlus.uc.js).  

  Locked:
  ![](https://i.imgur.com/cE3sUGT.png)

  Unlocked:
  ![](https://i.imgur.com/KOkEJq5.png)
</details>
<details>
  <summary>speedupcanonizeURL</summary>
  Strings like "extensions.legacy.enabled" should load results in your default search engine when you press Enter in addressbar. Instead, Firefox tries to load the site "extensions.legacy.enabled", which of course doesn't exists. This script solves it.

  [Download link](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/speedupcanonizeURL.uc.js).
</details>
<details>
  <summary>StyloaiX</summary>
  Basic UserStyle manager with the same power of userChrome.css (can restyle Firefox window). It loads <i><u>.css</u></i> files from <i><u>\chrome\UserStyles</u></i>. It supports instant enable/disable per style or global. It also can reload updated styles and load new ones. More features may be added in the future. To reskin websites, <a href="https://addons.mozilla.org/firefox/addon/styl-us/">Stylus</a> is a better option, with more features including autoupdate for styles available on the web. But Stylus can't touch the Firefox interface, only websites.

  Screenshot (yes, I'm using the old Stylish icon):
  
  ![](https://i.imgur.com/x8a6PSL.png)

  [Download link](https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/chrome/styloaix.uc.js).
</details>

## Screenshots

<img src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/folder.png">

###### userChromeJS Manager (the blue ones are restartless)
<img src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/rebuild_userChrome.png" height="600">

###### Status Bar, Extension Options Menu, MinMaxClose Button, newDownloadPlus.uc.js and legacy extensions:
<img  src="https://github.com/xiaoxiaoflood/firefox-scripts/raw/master/screenshots/window.png">
