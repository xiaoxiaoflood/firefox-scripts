Unnoficial version for Fx 57+.

[Read the Instructions](https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/extensions#instructions).

Screenshot
---
![](https://i.imgur.com/fLmFf0I.png)

Original Description
---
keyconfig allows you to change keyboard shortcuts.

keyconfig adds the ability to create new or modify existing shortcuts defined by a \<key> element, but only changing those which itself call a function (those with a command or oncommand attribute) has an effect (all others fulfill only cosmetic purposes it seems and are grayed out).

The configuration screen can be accessed via Tools > Keyconfig, the Add-ons Manager, or Ctrl+Shift+F12 (Command+Shift+F12 on MacOS) from the main window.

Currently there is only one list of modified keys per application, so changing a shortcut in one window will also affect other windows if they use the same key name.

**Notes:**

\- All shortcuts listed (except Keyconfig…) are provided by Firefox and other extensions, not by keyconfig.

\- keyconfig should be able to recognize any keys usable by Gecko

\- Don't think that changing a \<key> will always remove the original shortcuts. For Example: You can change the shortcut for Copy in the Bookmarks Manager but the original shortcut will still work (in addition to the new shortcut).

\- It is possible that keyconfig handles modifiers wrong.

\- Any '][' in the code of user defined keys will be replaced by '] [' (which should have the same effect in most cases) since the pref separator is ']['.

\- Disabled \<key>s are removed from their \<keyset> under the assumption that this has no drawbacks.
