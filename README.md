# userChromeJS

#### Tested on Firefox Developer Edition 130.0b6.

## Instructions

*Video running installation steps below*: https://youtu.be/_4fdUdp3G4o

1. Download [this zip file](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/fx-folder.zip) and extract its content to Firefox installation folder (usually **C:\Program Files\Mozilla Firefox**). For Linux paths, read [this](https://github.com/xiaoxiaoflood/firefox-scripts/issues/8#issuecomment-467619800). And [this](https://github.com/xiaoxiaoflood/firefox-scripts/issues/103#issuecomment-978723534) for macOS paths.

2. Click Firefox menu button (☰) -> *Help* -> *More troubleshooting information* or simply open **about:support**. Find "*Profile Folder"*, then click "*Open folder*". In there, create a new folder called **chrome**.

3. Download one of the files below and extract its content in **chrome** folder.

 - [utils → I'm only interested in scripts](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils_scripts_only.zip)

 - [utils → I'm only interested in extensions](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils_extensions_only.zip)
 
 - [utils → I'm interested in both scripts and extensions](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/utils.zip)

*Now, if you're only interested in extensions, you can skip to step 6.*

4. Save the desired [userChromeJS scripts](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome) into **chrome**. Read below the description of some of them.

5. If you want a button to manage your scripts, including the ability to disable/enable scripts without needing to restart¹ Firefox or Thunderbird, save [rebuild_userChrome.uc.js](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/rebuild_userChrome.uc.js) into **chrome**.

6. Open **about:support** and click "*Clear startup cache…*" to force Firefox to load userChromeJS on the next startup.

7. Restart Firefox.

¹: Not all scripts are restartless. These have `@shutdown` at the beginning of the code. Almost all scripts on this page were written by me to be restartless, but almost all scripts you get from other sources are not.

## userChromeJS scripts
ᵀᴮ: also compatible with Thunderbird

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
  Have you ever been frustrated because you wanted Firefox to autofill "https://www.youtube.com/feed/subscriptions" when you type "youtube" in location bar? That's because Firefox only autofills domains, so it will never go further than just "https://www.youtube.com/". Also because of this, Firefox will never autofill "https://www.reddit.com/r/firefox/" when you type "firefox", no matter how many times you've visited that page.
  
  I don't like this. Firefox should be smart to always prioritize the page with higher "visit score" in browser history. That's what this script fixes. It preselects the first suggestion from address bar. For instance, if this page is the first suggestion when you type "xiaoxiaoflood", you don't need to press down arrow key before Enter.
  
  Pages you often visit always rise to the first position, so accessing any frequent page will be as easy as typing no more than three chars + Enter, like just "you" + Enter to load YouTube Feed directly instead of YouTube homepage. It's even possible to teach Firefox to select YouTube Feed with "y" and YouTube Homepage with "yo", it's just a matter of practice.
  
  This script replaces urlbar autocomplete, so `browser.urlbar.autoFill` is disabled on install. If at any time you miss domain autofill, you still sort of can achieve that by pressing Tab IF the domain of first suggestion matches what you've typed so far. Example: you typed "*git*" and the first suggestion is from *github.com*. Pressing Tab key will autocomplete the domain even if the first suggestion is not just github.com - it may be github.com/whatever. But if the typed input doesn't match the domain of the first suggestion, then Tab key will have default behavior of selecting next suggestion just like down arrow key.

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
  <summary>Extensions Update Checker</summary>
  Firefox checks for available addon updates every 24 hours. You can disable autoinstall updates, but then you'll only know there are available updates if you manually open Add-ons Manager. This script:
 
  - Disables autoinstall updates for every addon.
  - Just after the daily check, if there's an addon update available it will open Add-ons Manager directly in "Available Updates" view, so that you can track changes before updating (you can click on the extension, then click "Release Notes" button).
  - You can fill `ignoreList` if you are deliberately using an outdated version of an extension and don't want to be notified that an update is available.

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/extensionsUpdateChecker.uc.js).
</details>
<details>
  <summary>ᵀᴮ Master Password+</summary>
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
  Toolbar button to replace native window buttons (minimize, maximize and close). I use Sidebery (vertical tabbar) with hidden titlebar, so I need this.
 
 - <i>Left-click</i> to minimize (so I can't close it accidentally).
 
 - <i>Right-click</i> to close.
 
 - <i>Middleclick</i> restores to fixed position/size (edit script code with your preferred values). If you want to restore to previous position/size, use <i>Shift + Middleclick</i>.
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/minmaxclose.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/minMaxCloseButton.uc.js).
</details>
<details>
  <summary>Mouse Gestures</summary>
  More powerful than any mouse gestures WebExtensions. But it doesn't have user interface and I have only included actions I use, so unless the default set of actions suits you, knowledge in JavaScript is required to write extra actions. However, it's easy to change gestures for available actions. Default gestures are at the beginning of the code (search for <code>GESTURES:</code>). Some of them:
 
 - <b>Hold right-click, then roll mouse wheel up or down</b> to switch to next/previous tab.
 - <b>Hold right-click, move down and release</b> to scroll to bottom of the page (or move up to go the top). If the cursor was over an image, moving down will open a new tab for reverse image Google search instead of scrolling to bottom.
 - <b>Hold right-click, then left-click</b> to switch to the last selected tab.
 - <b>Hold left-click, then right-click</b> to reload current tab.
 - <b>Hold right-click, then middle-click (wheel button)</b> to close current tab.
 - <b>Hold right-click, move left and release</b> to copy URL of link or media under the cursor.
 - <b>Hold right-click, move right and release</b> to open a new tab with the link or media under the cursor.
 - <b>Hold middle-click, move left and release</b> to copy selected text or image under the cursor.
 - <b>Hold middle-click, move right and release</b> to paste.
 - <b>Hold left-click, then press forward button</b> (for mouse with extra buttons) to switch to next group/panel (specific compatibility with <b>Sidebery</b> extension).

 Gestures are cumulative if possible, so holding right-click + turning mouse wheel will activate a different tab for each "tick" in the wheel.
 
 Advantages over existing extensions:
 - Extensions can't run over Firefox interface, so gestures don't work over Firefox toolbars.
 - Extensions can't run on privileged pages like <i>about:config</i> and <i>view-source</i>.
 - Extensions need the page to start loading to run, causing gestures to fail sometimes.
 - Extensions can't set gestures for 4th and 5th mouse buttons (Back and Forward).
 - Unlike extensions that are limited by existing APIs, userChromeJS has unrestricted access to Firefox internals, so you can do almost whatever you want if you write code for that.

  [Download link - extract it in chrome folder](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/mouseGestures.zip).
</details>
<details>
  <summary>multifoxContainer</summary>
  
  When Firefox introduced containers, I created this script to get some features that I missed from [Multifox](http://web.archive.org/web/20170123193744/https://addons.mozilla.org/en-US/firefox/addon/multifox/), the legacy addon that implemented "containers" years before Firefox having this feature by default.
  Since then, Firefox has added some things this script had, so I removed them. But I still use it for two things:
  
  - New tabs (Ctrl+T or New Tab button) inherit the container of current tab (except for Private Tabs).
  
  - The label in urlbar serves as menubutton to reopen current tab in other container. With left click, current tab is replaced. With middleclick, a new tab opens without closing the other one.
  
  ![](https://i.imgur.com/BE7oPcu.png)

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/multifoxContainer.uc.js).
</details>
<details>
  <summary>Open in Unloaded Tab</summary>
  Creates an item in contextmenu to open links/bookmarks/history in unloaded tabs, i.e. the tab is created, but it will only load when selected. Just like unloaded tabs when you start Firefox recovering tabs from previous usage.
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
  
  LSR uses Redirector rules to replace links directly in page (Redirector extension doesn't do this, it redirects only when you try to load the URL). Many URLs have gibberish at the end, I have rules to remove it, then the URL remains clean and LST can track last visit correctly (because the gibberish is different every time, generating different URLs for what is actually the same page).
  
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
  <summary>ᵀᴮ StyloaiX</summary>
  UserStyle manager to reskin Firefox window and websites. Replacement for legacy Stylish. More convenient than userChrome.css and userContent.css, as it has a powerful editor with instant preview, error checking, code autocomplete and you can enable/disable individual styles without restarting Firefox.

  Screenshots (yes, I'm using the old Stylish icon):
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/styloaix-editor.png)
  
  ![](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/styloaix-button.png)

  [Download link - extract it in chrome folder](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/styloaix.zip).
</details>

## userChromeJS scripts from other authors

Some users without their own repos asked me to publish the scripts they made, what I'm currently allowing.

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
 <summary>Restore <code>browser.newtab.url</code> Pref to <code>about:config</code></summary>
 This script restores the <code>browser.newtab.url</code> preference to <code>about:config</code>. Using this preference, you can set whatever you like as your New Tab page, including things like <code>file://</code> URLs that don't work with new tab override extensions. Once you install the script, just set the preference in <code>about:config</code> and it should work automatically. Make sure you don't have any other new tab extensions, or it might not work.
 
 (Written by [TheRealPSV](https://github.com/TheRealPSV))

  [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/newtab-aboutconfig.uc.js).
</details>

<details>
 <summary>Input Language Assistant</summary>
 this script is based on <code>Input Language Assistant</code> legacy extension. when you click on address bar, this script automatically changes your input language to English and once you press enter or click anywhere else, it will restore your input language to the previous language.
 note: this script is not restartless. if you want to enable or disable this script you need to restart browser.
 
 (Written by [siamak2](https://github.com/siamak2))
 
 [Download link](https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/chrome/inputLanguageAssistant.uc.js).
</details>

## Restore removed pages

<details>
  <summary><code>about:config</code></summary>
  The new <code>about:config</code> is way worse than the classic page. Although the new version was introduced in Fx 71, the old one was still accessible for a while via direct URL, but it was removed in Fx 87. To continue using it, save all three files from the link below, then bookmark the following URL:
 
  <i>chrome://userchromejs/content/aboutconfig/aboutconfig.xhtml</i>
  
 → [about:config folder](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome/utils/aboutconfig)
</details>

<details>
  <summary>Password Manager</summary>
  I don't like the new password manager and the old one was removed in Fx 77. I'm still using it. If you want it too, save all three files from the link below, so that you can access the old password manager using the following URL (bookmark it):
 
 <i>chrome://userchromejs/content/passwordmgr/passwordManager.xhtml</i>
 
 → [Password Manager folder](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/chrome/utils/passwordmgr)
</details>

## Screenshots

<img src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/folder.png">

###### userChromeJS Manager (the blue ones are restartless)
<img src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/rebuild_userChrome.png" height="600">

###### Status Bar, Extension Options Menu, MinMaxClose Button, newDownloadPlus.uc.js and legacy extensions:
<img  src="https://raw.githubusercontent.com/xiaoxiaoflood/firefox-scripts/master/screenshots/window.png">
