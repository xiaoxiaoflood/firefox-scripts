# userChromeJS

#### Tested on Firefox Developer Edition 84.0b4, Windows 10

## Instructions

→ For Linux and macOS paths, read [this](https://github.com/xiaoxiaoflood/firefox-scripts/issues/8#issuecomment-467619800) and [this](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Enterprise_deployment_before_60#Configuration).

1. Download [this zip file](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/fx-folder.zip) and extract its content to Firefox installation folder (usually **C:\Program Files\Mozilla Firefox**).

2. Click Firefox menu button (☰) -> *Help* -> *Troubleshooting information* or simply open **about:support**, then click "*Open folder*". This is the folder of your Firefox profile. In there, create a new folder called **chrome**.

3. Download one of the files below and extract its content in **chrome** folder.

 - [utils → I'm only interested in scripts](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils_scripts_only.zip)

 - [utils → I'm only interested in extensions](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils_extensions_only.zip)
 
 - [utils → I'm interested in both scripts and extensions](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils.zip)

*Now, if you're only interested in extensions, you can skip to step 6.*

4. Save the desired [userChromeJS scripts](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome) into **chrome**. Read below the description of some of them.

5. If you want a button to manage your scripts, including the ability to disable/enable scripts without needing to restart Firefox¹, save [rebuild_userChrome.uc.js](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/rebuild_userChrome.uc.js) into **chrome**.

6. Open **about:support** and click "*Clear startup cache…*" to force Firefox to load userChromeJS on the next startup.

7. Restart Firefox.

¹: Not all scripts are restartless. These have `@shutdown` at the beginning of the code. Almost all scripts on this page were written by me to be restartless, but almost all scripts you get from other sources are not.

## userChromeJS scripts

(click to expand)
<details>
  <summary>BeQuiet</summary>
 The main purpose of this script is to control media without having to select the tab playing it. So I can play/pause a YouTube video or skip to the next song in Deezer while browsing Reddit, for example.
 Three hotkeys are defined by this script: Ctrl+Alt+S to play/pause, Ctrl+Alt+D to next song and Ctrl+Alt+A to previous song.
 
  Besides that, no more than one tab should play audio at the same time. Each tab paused by another tab that starts playing is added to a stack. So if I open a new YouTube video while there's already one playing, the new tab starts playing and the other is paused. When the video ends or when I pause it, the first YouTube tab resumes playing.
 
 As for now, I only added support for a few sites, like Deezer, Spotify and YouTube. I chose not to support next/previous in YouTube, only play/pause.
 
  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/BeQuiet.uc.js). 
</details>
<details>
  <summary>Enter Selects</summary>
  Preselects the first suggestion from address bar. For instance, if this page is the first suggestion when you type "xiaoxiaoflood", you don't need to press down arrow key before Enter. This is a workaround for the bad Firefox design choice of autofill domains only.
  
  With practice, the page you want to go to will always become the first one, so accessing any frequent page will be as easy as typing just 'gm' + Enter to load Gmail.
  
  This script replaces urlbar autocomplete, so `browser.urlbar.autoFill` is disabled on install. If at any time you miss domain autofill, you still sort of can achieve that by pressing Tab IF the domain of first suggestion matches what you've typed so far. Example: you typed *git* and the first suggestion if from *github.com*. Pressing Tab key will autocomplete the domain even if the first suggestion is not just github.com - it may be github.com/whatever. But if the typed input doesn't match the domain of the first suggestion, then Tab key will have default behavior, i.e. will select next suggestion just like down arrow key.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/enterSelects.uc.js). 
</details>
<details>
  <summary>Extension Options Menu</summary>
  A single toolbar button to manage all your extensions. It opens a menu listing each extension. Left-click to open Options from the hovered addon, right-click to enable/disable, Ctrl + right-click to uninstall. Hover anywhere on the menu to see more.

  Screenshot:
  
  ![](https://i.imgur.com/FWs3pYl.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/extensionOptionsMenu.uc.js).
</details>
<details>
  <summary>Master Password+</summary>
  Locks Firefox with password. This will prompt the password on browser startup or anytime when you lock it with Ctrl+Alt+Shift+W.
  
  You need to set a master password in <i>Firefox Options > Privacy & Security > [×] Use a Primary Password</i>.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/masterPasswordPlus.uc.js).  

  Locked:
  ![](https://i.imgur.com/cE3sUGT.png)

  Unlocked:
  ![](https://i.imgur.com/KOkEJq5.png)
</details>
<details>
  <summary>MinMaxClose Button</summary>
  Toolbar button to replace window buttons (minimize, maximize and close). I'm a Windows user and use Tree Style Tab with hidden titlebar, so I need this.
 
 - <i>Left-click</i> to minimize (so I can't close it accidentally).
 
 - <i>Right-click</i> to close.
 
 - <i>Middleclick</i> restores to fixed position/size (edit script code with your preferred values). If you want to restore to previous position/size, use <i>Shift + Middleclick</i>.
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/minmaxclose.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/minMaxCloseButton.uc.js).
</details>
<details>
  <summary>multifoxContainer</summary>
  When Firefox introduced containers, I created this script to get some features that I missed from Multifox, the legacy addon that implemented "containers" years before Firefox having this feature by default.
  Since then, Firefox has added some things this script had, so I removed them. But I still use it for two things:
  
  - New tabs (Ctrl+T or New Tab button) inherits the container of current tab (except for Private Tabs).
  
  - The label in urlbar serves as menubutton to reopen current tab in other container. With left click, current tab is replaced. With middleclick, a new tab is opened without closing the other one.
  
  ![](https://i.imgur.com/BE7oPcu.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/multifoxContainer.uc.js).
</details>
<details>
  <summary>Open in Unloaded Tab</summary>
  Creates an item in contextmenu to open links/bookmarks/history in unloaded tabs, i.e., the tab is created, but it will only load when selected. Just like unloaded tabs when you restore previous session.
 So you can, for example, open multiple related YouTube videos and load them one by one. Or open an entire bookmark folder in tabs without freezing the browser, since tab content will load on demand.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/openInUnloadedTab.uc.js).
</details>
<details>
  <summary>PrivateTab</summary>
  Fx 77 blocked the ability to open private tabs in non-private windows, previously possible with Private Tab addon. So I decided to write this script as a replacement. You can change some minor settings at the beginning of the code.
 
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/privatetab.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/privateTab.uc.js).
</details>
<details>
  <summary>Redirector</summary>
  Requires basic JS skills to write rules using regex.
 
  The main difference between this and extensions like [Redirector](https://addons.mozilla.org/en-US/firefox/addon/redirector/) it that these Firefox extensions record both pre-redirect and final URLs in history. I want it to record just the final URL.
  
  This script can also do more complex things like running a JS function with regex results.
  
  Finally, the main reason why I wrote this was to integrate it with [Link Status Redux](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/extensions/linkstatusredux). When I point the mouse to a link that I've already visited, LSR displays the time of last visit. This is extremely useful for me to know if I have already visited the page and to track changes since last visit.
  
  LSR uses Redirector rules to replace links directly in page (Redirector extension doesn't do this, it redirects only when you try to load the URL). And many URLs have gibberish at the end, so I have rules to remove them, then the URL remains clean and LST can track last visit correctly (because the gibberish is different every time, generating different URLs).
  
  Note: the list of rules in the script is just an example, mine is much bigger.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/redirector.uc.js).
</details>
<details>
  <summary>Status Bar</summary>
  Brings back the good old status bar (also known as Addon Bar) at the bottom, with status text plus any buttons you want.

  Screenshots:
  
  ![](https://i.imgur.com/2EBQyjE.png)
  
  ![](https://i.imgur.com/zoX79TT.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/status-bar.uc.js).
</details>
<details>
  <summary>StyloaiX</summary>
  UserStyle manager to reskin Firefox window and websites. Replacement for legacy Stylish. More convenient than userChrome.css and userContent.css, as it has a powerful editor with instant preview, error checking, code autocomplete and you can enable/disable individual styles without restarting Firefox.

  Screenshots (yes, I'm using the old Stylish icon):
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/styloaix-editor.png)
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/styloaix-button.png)

  [Download link - extract it in chrome folder](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/styloaix.zip).
</details>
<details>
  <summary>Auto Plain Text Links</summary>
  Firefox's default context menu will allow you to open plain text links if you select them first. This small addon automatically detects simple http and ftp plain text links when you right-click without needing you to select them first, then passes that URL on to the default Firefox menu items for opening them.

  [Download link - extract it in chrome folder](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/autoPlainTextLinks.zip).
</details>

<details>
  <summary>Context to Search</summary>
  With this script, when you choose Search from the context menu (with text selected), instead of immediately searching it will just put the selected text in the search bar so you can edit it and choose the search engine before searching.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/contextToSearch.uc.js).
</details>

<details>
 <summary>Restore <code>browser.newtab.url</code> Pref to <code>about:config</code> (by TheRealPSV)</summary>
 This script restores the <code>browser.newtab.url</code> preference to <code>about:config</code>. Using this preference, you can set whatever you like as your New Tab page, including things like <code>file://</code> URLs that don't work with new tab override extensions. Once you install the script, just set the preference in <code>about:config</code> and it should work automatically. Make sure you don't have any other new tab extensions, or it might not work.
 
 (Written by [TheRealPSV](https://github.com/TheRealPSV))

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/newtab-aboutconfig.uc.js).
</details>

Bonus: I don't like the new password manager and the old one was removed in Fx 77. I'm still using it. If you want it too, save [these files](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome/utils/passwordmgr), so that you can access the old password manager using chrome://userchromejs/content/passwordmgr/passwordManager.xhtml (bookmark this URL).

## Screenshots

<img src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/folder.png">

###### userChromeJS Manager (the blue ones are restartless)
<img src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/rebuild_userChrome.png" height="600">

###### Status Bar, Extension Options Menu, MinMaxClose Button, newDownloadPlus.uc.js and legacy extensions:
<img  src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/window.png">
