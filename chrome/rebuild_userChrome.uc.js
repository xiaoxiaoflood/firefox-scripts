// ==UserScript==
// @name           userChromeJS Manager
// @include        main
// @author         xiaoxiaoflood
// ==/UserScript==

// original by alice0775: https://github.com/alice0775/userChrome.js/blob/master/rebuild_userChrome.uc.xul

(function () {
	"use strict";

  Components.utils.import('resource:///modules/CustomizableUI.jsm');

  if (!document.getElementById('userChromebtnMenu'))
    CustomizableUI.createWidget({
      id: 'userChromebtnMenu',
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      onBuild: function (aDocument) {
        var toolbaritem = aDocument.createElement('toolbarbutton');
        var props = {
          id: 'userChromebtnMenu',
          label: 'userChromeJS',
          tooltiptext: 'userChromeJS Manager',
          type: 'menu',
          class: 'toolbarbutton-1 chromeclass-toolbar-additional',
          style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC)',
          popup: 'userChromejs_options'
        };
        for (var p in props) {
          toolbaritem.setAttribute(p, props[p]);
        }

        var mp = toolbaritem.appendChild(document.createElement('menupopup'));
        mp.setAttribute('id', 'userChromejs_options');
        mp.setAttribute('onpopupshowing', 'userChromejs.onpopup();');
        mp.setAttribute('oncontextmenu', 'event.preventDefault();');

          var mg = mp.appendChild(document.createElement('menugroup'));
          mg.setAttribute('id', 'uc-menugroup');

            var mi1 = mg.appendChild(document.createElement('menuitem'));
            mi1.setAttribute('id', 'userChromejs_openChromeFolder');
            mi1.setAttribute('label', 'Open chrome directory');
            mi1.setAttribute('class', 'menuitem-iconic');
            mi1.setAttribute('flex', '1');
            mi1.setAttribute('style', 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABe0lEQVQ4jc3N2ytDARwH8J83/wRKefU3zFBCSnlQSnkQpSiFFLk8OMQmxLBZLos2I7ckM3PmMmEredF23Ma2GrPjkuFsvh7mstTqnDff+jx+v1+ifxEZ43zPYFyIld3FHWYxzlRRA5mdXFi3c4vpvbuo3TvU6z2CnHEKf4djRd9bLYnyDldkYtuPqZ1b0TIYF2StlkTK6eaQ080ht+eLgkPeH/nflGc/8hRRVNB7BuVaAGPWILRsDCsfl4bl0bMaQGHfOaho4AL9pns0GPyo04vTYPCjz3SP4sELUInqEkObPNoXA5IMmoMoHbkClWncUG8/QLnOS6K2PqJc6wZVjl9jyvYMtfVJEp3tGVWTN6Bq3Q2M9hBmDl4kMTpCqJ32gOr1XmHp+BUrJ2+SLB2/onHWK1DLvG95lOU/Nk4FbLnCcbHcL/OpgFGWj7Qt+AxUo7an12qOHM1Gb6R5zgcxmozecLVq31YxvJ9GRJRARElElExEKSIlf3USPgHT/mSv7iPTOwAAAABJRU5ErkJggg==)');
            mi1.setAttribute('oncommand', 'userChromejs.Openchromedir();');

            var tb = mg.appendChild(document.createElement('toolbarbutton'));
            tb.setAttribute('id', 'userChromejs_restartApp');
            tb.setAttribute('tooltiptext', 'Restart Firefox');
            tb.setAttribute('style', 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB20lEQVQ4jY2Tv2sUURDHZ/bX7eW0ChJBRFKIRRCRIEHuzVvfrYmkSiFXSSoLERERy5B/wcIuqG9mN5VecUWwCqkOEQsLKysLsQgSxEJEgsVYeJfsHXuY4tvN9zMzzHxBVXFS8Gy1kRaZi8U+iCV7HIq73Xqez9XWThoDsRvg6QDY6Ji8+RMK9dLSztcCoMhnkc27YxPth0I7oVAPhT5WYD9ScfkYALYWYxQa/OvU/h5ztg5bi3G1U2vbXUFPb4fT/EzELRwBYraPRvSE7eW6XVUV4en1JjLtARtFoYGqInRfd0Nk8wXYaCzZ/WnmkZrengc2v4GNNr1bglPiFoaj/5orV1r/A6gqhkI9YKMB0yY0OF9GsV/jIts9iVlVMeJscwhgOKmpqoDpGNDg5YuB0HYg9lUotINCuxFn/bN+9czUFZj6wEYDsRsQle7W+NPQ/uhEdUpLOw/cPgQ2OlPcvAoJZ90qICnc2tQzlist9GYAbDRk2lNVhFDs3YmXPUjkxp3JR2qWbgk9fRj9S+Olu6SqCJHYJ+DN5xnOryHT+wrsG7J9g0x9ZPup2iAS1z6aKi076+mLzoVRmKJpYeL2YSC2aBadc1PTOB7n3AXe3guYHiberZ0u8tm62r99Gyd0lo7sIAAAAABJRU5ErkJggg==)');
            tb.setAttribute('oncommand', 'userChromejs.restartApp();');

          var mn = mp.appendChild(document.createElement('menu'));
          mn.setAttribute('id', 'uc-manageMenu');
          mn.setAttribute('label', 'Settings');
          mn.setAttribute('class', 'menuitem-iconic');
          mn.setAttribute('style', 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAADJUlEQVQ4ja1TS0wTQRgean0/ovFgTDxpjDc9Gg8mvSrnKhFSC8VpCuyyu22Xbdm2s7Rdt48t7kIhEJEIYiKKphZK0CoRLVYlHiAEFYMng4+bF6nUjgfbuiocTPwuM5P83/d/8z8AWAMIIX3xWvHHCYxG44a1OOuCIIhd2rfZbN7yTwIURe0+D8lAbSO3aLI21xgMBn2dzXbQZLM/MNkcEwRNnyw6rFhTAEK4ESGkc/L8IacgY1Hpw1xbbLWBFT5QrRe/+GM92Bfpxg4Xkotf3LSuGAAA1DcypC/cnWuL9a5yQQXzUifmApewR4pjUenLESzKQAi3rUmmaXqrpYF0WBqYDrtXynnDceyR1JW7E5Opqcwz9Ul2pr+zb+gdF2jHnlAnvkC6piw2WmikHCeKEj+dmWDTuSZXEPsiXdgb6Sr4o/HlV4uLZ5LJZDnz0tLSkeE7YyMt/nbcFuvBrqCCqyGdhhBuLAtF2jvE1osd+UCsZ8Xhi3yfnMqYNYZ1pcB0Or1X6bm64BLVvCcczwflrrcsy+4sBVaMjo7u6R248ZDiJaz0Ds4PDAxs1woAAIDBYNADAMBIIsU6BRm7RWUlm31x+rduAQCAEFICDkEu+MTYuMZJGUajcQNCQBeU2ivZNrng8ssfNYNb7FQ9caCusSUrRLsLFtL9ppogdhUnuCxWSniursHnFtWCwyvlqmttNUA7U1bSeYnxSNgXin91CtFCdT1hLwkghPSltYAQ7rcy/LI3HM+7RaUAKfdnjuP2lB0NjyQq3X45R7eK2ImiuIkV8mdNVsZspnaXYqpq4XGzjXneIsjY7g1hkvPjvsHhm9o6AlVVN2ezL6oyz2fsATn+yemLYModxDWQfm2luAmTjXlsaXbnWvwxTPNS4XZy/Nrj6em6ZDJ57Lc50mJyKlNDugLfPJKaY4UovsB4MeEKYE+oI0/z4mr3laFUKpXa/BfxV3uRHgCg43n/YZITvtfTPEYh9f1Y+tGDy4M3X1oZTx4yXsyjYFhT/PV3DSG0Y3Z+oen6rcT92fn5Uwgh3dzc3L7xe5P9T57OXE4kEkfXJf8P/ABlOH7kn81/zwAAAABJRU5ErkJggg==)');

            var mp2 = mn.appendChild(document.createElement('menupopup'));

              var mi2 = mp2.appendChild(document.createElement('menuitem'));
              mi2.setAttribute('id', 'toolbtn_rebuild');
              mi2.setAttribute('label', 'Create new window with reloaded scripts');
              mi2.setAttribute('class', 'menuitem-iconic');
              mi2.setAttribute('flex', '1');
              mi2.setAttribute('style', 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC90lEQVQ4jY2QfSzUcRzHP1vahK2nPxo9bP6oXE8ilS3VLBslaVN/mK5uzooQbo5Kd5VIeg6lwookFWZ6vpyTYZFxlXN+LpzifvfgS60HzpV3f/RHLbV5b++9//js89rebxKEcK2hJyzD22VGFphsYAGJA8xP8oH5xr1nPjF65h3Zw9ZEdDOPcI6t2NPJloZ1MIFQMzzTq6abHPI9KDTd/OWmDjjdBKQ1AvI6ILkGiFcAUY+A8CogrAzYUQoE3wb8iwD/O8BCYRdoyrVA2iLtZznVZpx/MIDTVTwyKnmklfM4XsZDfo9HSimPgyU8pMU8JEU8JEUGRN2ywDVEDbK7GkCbYvXsNWfCkMkMk8ECk8EC8x9p4X97kB/EyNAQ3nQzCEJaQHT5F6BvcAyT0zh+jH9D/2dg+c42EF0KoI3RPazbbJ3ML0bHrLj2PAvXVS+wOLgdRLn+tG6fjulM/weYPprxuO0pChuKcUWRh3NPTiGrIQeumy+A7C76k3cEx7pM/66gNXDIUKRB+koMuXYvjrZH41y/BNnWSByplMLR21NEa8M7GWecCBgZHcFZ5VkIG7dBqhbjkDIeyYoEpDYlIUkjws7URExbELaDvEQdTGucWKHXpIe4VIztZUE4WXEG+v4BtGq1kBWkIqkwF47LykF0aCO5C9tZBz8RYPxkRH7tDRRUF6Hi5QPUaevxffw7VG0qlNTWY11YAVwD/IrJXfiWvWO2/47Ya+7DZcVVxOYnoe51MzQ6Pa5U3URejwyy+8estCS03Xq3bQyNPTaoumxQcjZUd9pQw/1ARYsOJ54dx8G3YqS3yJGiSIFMIYdccwC5w0ewVSJqJifB0/LZPg1vpq9WqZ1WKdUOHkq1g3u1eqpbbavTyvMacbF4XKj1w/7mXYirj0BMowhxNVHYLNnN2QkEG4johj1R3jyibJffznQhujiH7BNdnUOWZMSVxkKcGfPVLdDz+tKtPpnzfdcfpkWL3GiSspsRNDdhVpDnQxKQ89/Hn5oXuGXJeoTZAAAAAElFTkSuQmCC)');
              mi2.setAttribute('oncommand', 'userChromejs.rebuild();');

              var mi3 = mp2.appendChild(document.createElement('menuitem'));
              mi3.setAttribute('id', 'userChromejs_setEditor');
              mi3.setAttribute('label', 'Set default editor');
              mi3.setAttribute('class', 'menuitem-iconic');
              mi3.setAttribute('style', 'list-style-image: url()');
              mi3.setAttribute('oncommand', 'userChromejs.setEditor(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACbUlEQVQ4jY2SX0hTYRjGP2+rK0uJiK5iuKKCbkaBIF10012wrtKLpLpQMSiE7kZBCAO3c77zfd/RtbUz8Ww0t7Whlm3DnP912zlzbc5tmUJQUUR4FwhPVwaFps/18+N53/d5CdlDjDGrECIqBOeyLDft5dlXiqzcCYVGthfmF5CcfAuu8v7DgYpyfFBlsYmJ1zCMAlbLZcxmZsBVJg6EZZld1/z+z3PzsygXKzCMPBLxOISqfJFl+fS/frvdfsxmsz1oaTn3iFBKB7wvfMhmV1Ber2B2dg7+YQ2RSBR+/8hPiUm9Tqfz6C7c2XnvxlRm6ltHezssFks/GRTiV2BYQ3hURyqZhMc7hHQyjbW1Mgp5A+Nj4/AHAl9d1NXW0XG7Nxx+iSGfH1eu2ryEEEKoKqZTqRRisRhCgSCWlxaxWniPbDaLlWwW1XoV9Y919PX1wfH0CazW8zutra3PCCENhBBCOOcXVTG4/SoWx0rORKlYgpHPI7u8grxRwObGFnq6etHc3AjLWSt6unt+OByOI38dhVLaIjFpknOO8GgERiGPQtHARq2G+91dONHUCPvNW0jPTCMSTYBS0bZ3G3ygVXK5vweDOqq1CtShQVy+dAGKoqBSr2Kzuo5QMLhDKW3Zt1JJks5ITN7OzGUwt7QAI5fDh3oNhWIJk28mwbh492f/ff+CuR9GIxGYZgGmaSKXNxCPx8G5+MRczPpfmBBC3G75rqZpMEsmlhaXoOs6KKNjjLGTB7ENQgiaSIxB13Wkk0n4fN4dRVEeH5i6K4/Hk0in09A0DULlW1SIa4eGCSGEUnqKc/5c5arzMCP/BuLHidBRAaQbAAAAAElFTkSuQmCC);');

              var mi4 = mp2.appendChild(document.createElement('menuitem'));
              mi4.setAttribute('id', 'showToolsMenu');
              mi4.setAttribute('label', 'Switch display mode');
              mi4.setAttribute('class', 'menuitem-iconic');
              mi4.setAttribute('style', 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADdklEQVQ4jXWTbUwUdADG/7zccZ6lQ/pgcDJEEEGBO8/hmLQY9mKOmFvyEi93IIISSSMGxx0Hw0QKJJCOI3CxGM0IhEASjDsQ1lgdRuqcE4N0RznTjPFSDGJwvz64nOX6bc+35+XTI8R/KRXOG6LFwcAEj+7d2b4PI3L8ltQZiuuKaGmp5yER8JT/Sco/0e+JylP1xNfuXTrWEU/+BQ26Pi3vnk8ioyWG10pU9lj9S4VjY2Pyp4cbcxP36PyW83tTKBnMwDhwiCJrGkXWVIzWNIoH0ikezCTxTBRROcG9k5O2dY/Dp5qKwyN0W5aMgxkYLKkYrakYB7XorAnorPEUWOLJ749D159E6dBRIj7cRIhW8fmj5dJI16jc4L78vhQK+zUYrCkUDrxJtS0P6+12hu3dDNu7sNw+R8vVahK+2E1onQyvHOE4YIyIFOv3i7gEU+RyoUVD2dBbXL9v46tbLRiHkum8cYbv7SNcsdsA6L/RTVCVMzvNMkJq5GyMF50iMNnDktV2gNPfGrj3xxT/MDL1NcXDSRgGEzh+6TArLNM+2sy2SkFYgxxVnZwtWdK7Iizbe67hu3Lml2bAAQ6H43HJ+IOrvDeiRdunYmFllnOXWwioEuxqlKGskxGgk/4lIt7xX6keLsJ06QSnLAbG719jaXmJin4d+t5UDraGENOhYGFlnq4fWlHXyon6dCORTV5s1UkdQpn+/ERa66tkdu0jpTOcb36+yIO5GcJN7rzS5kHPZAe/LPzK7Moq9/6cY2LWzs2Htzjc+gbe2U4zwnO/c2XQcRlq81p2mASt45/x4+/TKKsk7GoW7DuroGein99WYRqYnJsn5eM4fIwueGucrojgrPW+vkekUyEmN7bXCppvtnFnEYoHijhxWU/yhRcIa1xLzWg9vT9d48X31XiXCALL3AjUuhcIIYSI0ccU+BgEwSZX3u49Qr2tjXrblzSMnueD4QZebtqGss4FZYUH/icFoSY5Co3T3cT6LHchhBCx5thnFAnSi0FlMnbUSgg46UxguQtBFS4EV7qhrn0WtXkNyjo3Qj+Ss/moZHF7uvvr//qC37EN6xSxLmf98iSOkBoZKvMadtY/ksosR2mSE1Qmw0cjsXunuUT/7yO9tK57vZMl7ZuzpHf8C6SLW/XSVf9cybRPquvopmRng2emeO5J/98W5fyDGAVpggAAAABJRU5ErkJggg==)');
              mi4.setAttribute('oncommand', 'userChromejs.toggleUI();');

          var sep = mp.appendChild(document.createElement('menuseparator'));
          sep.setAttribute('id', 'uc-menuseparator');

        return toolbaritem;
      }
    });

	window.userChromejs = {
	// --- config ---
		// dannylee
		UIPREF: "userChromeJS.rebuildUI.showtoolbutton",
		ShowToolButton: false,

		menues: [
			//'UserScriptLoader_Tools_Menu',
			//'usercssloader_Tools_Menu',
			//'eom-menu',
			//'redirector-icon',
			//'abp-menuitem',
		],
	// --- config ---

		init: function() {
			addEventListener("unload", function() {userChromejs.uninit();}, false);
			this.obs = xPref.addListener('userChrome.disable', this.prefChangeHandler);
			this.obs2 = xPref.addListener(userChromejs.UIPREF, this.prefChangeHandler);

			// dannylee
			var menuitem = $("menu_ToolsPopup").insertBefore($C("menu", {
				id: "userChromejs_Tools_Menu",
				label: "userChromeJS Manager",
				tooltiptext: "UC Script Manager",
				class: "menu-iconic",
				image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC",
				//onclick: "userChromejs.clickIcon(event);"
			}), $("menu_preferences"));

			// dannylee
			if (!gPrefService.prefHasUserValue(this.UIPREF)) {
				xPref.set(this.UIPREF, this.ShowToolButton);
			}
		},

		Openchromedir: function() {
			Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("UChrm", Ci.nsIFile).launch();
		},

		uninit: function() {
      xPref.removeListener(this.obs); // 登錄解除
      xPref.removeListener(this.obs2);
		},

		rebuild: function() {
      Services.obs.notifyObservers(null, "startupcache-invalidate", "");
			OpenBrowserWindow();
		},

		onpopup: function() {
			var menupopup = $("userChromejs_options");
			// remove script menuitem
			var nodes = menupopup.querySelectorAll('.userChromejs_script');
			for(var i = 0, len = nodes.length; i < len; i++) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}

			let parentMenuPopup = menupopup,
				topMenuitems = [];
			let getTooltiptext = function(script, url) {
				let text = 'Left-Click: Enable/Disable\nMiddle-Click: Enable/Disable and keep this menu open\nRight-Click: Edit\nCtrl + Left-Click: Reload Script\nCtrl + Middle-Click: Open Homepage\nCtrl + Right-Click: Uninstall\n\n' + 'Description: ' + script.description || '';
				if (url) {
					text += '\n' + 'Homepage: ' + url;
				}
				return text;
			};

			for(var j = 0, lenj = userChrome_js.arrSubdir.length; j < lenj; j++) {
				var dirName = userChrome_js.arrSubdir[j] == "" ? "root" : userChrome_js.arrSubdir[j];
				var ucJS = [userChrome_js.scripts, userChrome_js.overlays];
				var flg = false;
				ucJS.forEach(function(ucJS) {
					for(var i = 0, len = ucJS.length; i < len; i++) {
						var script = ucJS[i];
						if (script.dir != dirName) continue;
						flg = true;
						break;
					}
				});
				if (!flg) continue;

        if (dirName !== 'root' || !document.querySelector('#userChromejs_options > .uc-dir')) {
          var mi = parentMenuPopup.appendChild($C('menuitem', {
            label: 'Toggle all scripts',
            oncommand: 'userChromejs.chgDirStat(this.dirName);',
            onclick: 'userChromejs.clickDirMenuitem(event);',
            type: 'checkbox',
            checked: !userChrome_js.dirDisable[dirName],
            class: 'uc-dir'
          }));
          mi.dirName = dirName;

          menupopup.appendChild($C('menuseparator'));
        }

				ucJS.forEach(function(ucJS) {
					for(var i = 0, len = ucJS.length; i < len; i++) {
						var script = ucJS[i];
            var rebxul = script.filename === userChrome_js.ALWAYSEXECUTE;
						if (script.dir != dirName) continue;
						mi = menupopup.appendChild($C('menuitem', {
							label: script.name ? script.name : script.filename,
							oncommand: 'userChromejs.toggleScript(this.script);',
							onclick: 'userChromejs.clickScriptMenu(event);',
							type: 'checkbox',
							autocheck: 'false',
							checked: !userChrome_js.scriptDisable[script.filename],
							class: 'uc-item',
							restartless: !!script.shutdown
						}));
						mi.script = script;
						let url = userChromejs.getScriptHomeURL(script);
						if (url)
							mi.setAttribute('homeURL', url);
						let description = getTooltiptext(script, url);
						if (description)
							mi.setAttribute('tooltiptext', description);

						if (dirName === 'root') {
							mi.setAttribute('class', 'userChromejs_script');
              if (rebxul) {
                mi.removeAttribute('oncommand');
                //mi.setAttribute('disabled', 'true');
                topMenuitems.unshift(mi);
              } else {
                topMenuitems.push(mi);
              }
						} else {
							menupopup.appendChild(mi);
						}
					}
				});
			}

			// 添加收集的 topMenuitems
			topMenuitems.forEach(function(mi) {
				parentMenuPopup.appendChild(mi);
			});

			$("showToolsMenu").setAttribute("label", "Switch to " + (this.ShowToolButton ? "button in Navigation Bar" : "item in Tools Menu"));
		},

		clickDirMenuitem: function(event) {
			if (event.button !== 0) {
				var et = event.target;
				userChromejs.chgDirStat(et.dirName);
				et.setAttribute('checked', !userChrome_js.dirDisable[et.dirName]);
				if (userChrome_js.dirDisable[et.dirName]) {
					et.parentNode.parentNode.setAttribute('style', 'color:gray;');
				} else {
					et.parentNode.parentNode.removeAttribute('style');
				}
			}
		},

		clickScriptMenu: function(event) {
      let script = event.target.script;
      if (event.button == 1) {
        if (event.ctrlKey) {
          let url = event.target.getAttribute('homeURL');
          if (url) {
            gBrowser.addTab(url);
          }
        } else if (script.filename != userChrome_js.ALWAYSEXECUTE) {
          userChromejs.toggleScript(script);
          event.target.setAttribute('checked', !userChrome_js.scriptDisable[script.filename]);
        }
			} else if (event.button == 2) {
        if (event.ctrlKey) {
          userChromejs.uninstall(script);
        } else {
          userChromejs.launchEditor(script);
        }
        closeMenus(event.target);
			} else if (event.button == 0 && event.ctrlKey && script.filename != userChrome_js.ALWAYSEXECUTE) {
        userChromejs.toggleScript(script);
      }
		},

		getScriptHomeURL: function(script) {
			return script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
		},

		launchEditor: function(aScript) {
			var editor = xPref.get("view_source.editor.path");
			var UI = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);

			var platform = navigator.platform.toLowerCase();
			if (platform.indexOf('win') > -1) {
				UI.charset = 'BIG5';
			} else {
				UI.charset = 'UTF-8';
			}

			var path = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService).getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getFileFromURLSpec(aScript.url).path
			path = UI.ConvertFromUnicode(path);

			var appfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
			appfile.initWithPath(editor);
			var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
			process.init(appfile);
			process.run(false, [path], 1, {});
		},

		chgDirStat: function(adirName) {
			var s = xPref.get("userChrome.disable.directory");
			if (!userChrome_js.dirDisable[adirName]) {
				s = (s+',').replace(adirName+',','') + adirName+',';
			} else {
				s = (s+',').replace(adirName+',','');
			}
			s = s.replace(/,,/g,',').replace(/^,/,'');
			xPref.set("userChrome.disable.directory", s);
			userChrome_js.dirDisable = this.restoreState(s.split(','));
		},

    toggleScript(script) {
        var s = xPref.get("userChrome.disable.script");
        if (!userChrome_js.scriptDisable[script.filename]) {
          s = (s+',').replace(script.filename+',','') + script.filename+',';
        } else {
          s = (s+',').replace(script.filename+',','');
        }
        s = s.replace(/,,/g,',').replace(/^,/,'');
        xPref.set("userChrome.disable.script", s);
        userChrome_js.scriptDisable = this.restoreState(s.split(','));

        if (!!script.shutdown && userChrome_js.scriptDisable[script.filename])
          userChromejs.shutdown(script);
        else if (!userChrome_js.everLoaded.includes(script.id))
          userChromejs.install(script);
    },

		restoreState: function(arr) {
			var disable = [];
			for(var i = 0, len = arr.length; i < len; i++)
        disable[arr[i]] = true;
			return disable;
		},

		prefChangeHandler: function (value, prefPath) {
      if (prefPath == 'userChrome.disable.directory')
        userChrome_js.dirDisable = userChromejs.restoreState(value.split(','));
      else if (prefPath == 'userChrome.disable.script')
        userChrome_js.scriptDisable = userChromejs.restoreState(value.split(','));
      else if (prefPath == userChromejs.UIPREF && value != userChromejs.ShowToolButton)
        userChromejs.toggleUI(true);
    },

		restartApp: function() {
			if ("BrowserUtils" in window && typeof BrowserUtils.restartApplication == "function") {
				Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).invalidateCachesOnRestart();
				BrowserUtils.restartApplication();
				return;
			}

			const appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);

			// Notify all windows that an application quit has been requested.
			var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
			os.notifyObservers(cancelQuit, "quit-application-requested", null);

			// Something aborted the quit process.
			if (cancelQuit.data)
				return;

			// Notify all windows that an application quit has been granted.
			os.notifyObservers(null, "quit-application-granted", null);

			// Enumerate all windows and call shutdown handlers
			var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
			var windows = wm.getEnumerator(null);
			var win;
			while (windows.hasMoreElements()) {
				win = windows.getNext();
				if (("tryToClose" in win) && !win.tryToClose())
					return;
			}
			let XRE = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
			if (typeof XRE.invalidateCachesOnRestart == "function")
				XRE.invalidateCachesOnRestart();
			appStartup.quit(appStartup.eRestart | appStartup.eAttemptQuit);
		},

		// dannylee
		toggleUI: function(byaboutconfig = false, startup = false) {
      if (!byaboutconfig && !startup)
        xPref.set(this.UIPREF, !xPref.get(this.UIPREF));
			this.ShowToolButton = xPref.get(this.UIPREF);
			setTimeout(function() {
				$("userChromejs_Tools_Menu").hidden = !userChromejs.ShowToolButton;
				$("userChromebtnMenu").hidden = userChromejs.ShowToolButton;
				if (userChromejs.ShowToolButton) {
					$("userChromejs_Tools_Menu").appendChild($("userChromejs_options"));
				} else if (!startup) {
					$("userChromebtnMenu").appendChild($("userChromejs_options"));
				}
			}, 10);
		},

		setEditor: function() {
			var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
			fp.init(window, "Set default editor", fp.modeOpen);
			fp.appendFilter("Executable", "*.exe");
      fp.open(result => {
        if (result != Ci.nsIFilePicker.returnOK || !fp.file)
          return;
        else {
          xPref.set("view_source.editor.path", fp.file.path);
        }
      });
		},

		runMenu: function() {
      userChromejs.toggleUI(false, true);
			var menupopup = $('userChromejs_options');
			if (!menupopup)
			return false;
			var i = 0;
			while (i < this.menues.length) {
			var menu = $(this.menues[i])
				if (menu) {
				  menupopup.insertBefore(menu, $("uc-menuseparator"));
					this.menues.splice(i, 1);
					continue;
				}
				i++;
			}
		},

    getById: function(id) {
      return userChrome_js.overlays.concat(userChrome_js.scripts).find(s => s.filename === id);
    },

    install: function(script, checkExists) {
      script = userChrome_js.getScriptData(script.file);
      if (script.type == 'xul')
        script.xul = '<?xul-overlay href=\"' + script.url + '\"?>\n';
      else
        script.ucjs = userChrome_js.checkUCJS(script.file.path);
      script.dir = script.file.parent.leafName.replace('chrome', 'root');
      Services.obs.notifyObservers(null, "startupcache-invalidate", "");
      var enumerator = Services.wm.getEnumerator("navigator:browser");
      while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        var document = win.document;
        var type = script.type;
        var typeList = type == 'xul' ? win.userChrome_js.overlays : win.userChrome_js.scripts;
        var scriptIndex = typeList.findIndex(s => s.id == script.id);
        if (scriptIndex) {
          typeList[scriptIndex] = script;
        } else {
          typeList.push(script);
        }

        if (type == 'js') {
          win.userChrome_js.loadScript(script, document);
        } else if (script.regex.test(win.location.href.replace(/#.*$/, ''))) {
          win.userChrome_js.debug("loadOverlay: " + script.filename);
          win.userChrome_js.loadOverlay(script.url + "?" + win.userChrome_js.getLastModifiedTime(script.file), null, document);
          script.isRunning = true;
          win.userChrome_js.everLoaded.push(script.id);
        }
      }
    },

    uninstall: function(script, skipConfirm) {
        if (!skipConfirm) {
            var isOk = confirm('Do you want to uninstall this script? The file will be deleted.');
            if (!isOk) {
                return;
            }
        }

        this.shutdown(script);
        script.file.remove(false);
        var s = xPref.get("userChrome.disable.script");
        if (userChrome_js.scriptDisable[script.filename])
          xPref.set("userChrome.disable.script", (s+',').replace(script.filename+',','').replace(/,,/g,',').replace(/^,/,''));
        
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
          var win = enumerator.getNext();
          var typeList = script.type == 'xul' ? win.userChrome_js.overlays : win.userChrome_js.scripts;
          var scriptIndex = typeList.findIndex(s => s.id == script.id);
          delete typeList.splice(scriptIndex, 1)[0];
        }
    },

    shutdown: function (script) {
      if (script.shutdown) {
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
          var win = enumerator.getNext();
          eval(script.shutdown);
          if (script.onlyonce)
            break;
        }
        script.isRunning = false;
      }
    }
	}
	var css = `
    #userChromejs_options menuitem[restartless="true"] {
      color: blue;
    }
		#userChromejs_options .uc-dir[checked="false"],
    #userChromejs_options .uc-item[checked="false"],
    #userChromejs_options .userChromejs_script[label="userChromeJS Manager"] {font-style:italic;}
		#uc-menugroup .menu-iconic-icon {margin-left:2px;}
	`.replace(/[\r\n\t]/g, '');;
	userChromejs.style = addStyle(css);
	userChromejs.init();
	userChromejs.runMenu();
	function $(id) {return document.getElementById(id);}
	function $C(name, attr) {
		var el = document.createElement(name);
		if (attr) Object.keys(attr).forEach(function(n) el.setAttribute(n, attr[n]));
		return el;
	}
	function addStyle(css) {
		var pi = document.createProcessingInstruction(
			'xml-stylesheet',
			'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
		);
		return document.insertBefore(pi, document.documentElement);
	} 

})()
