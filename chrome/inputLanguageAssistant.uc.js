// ==UserScript==
// @name            Input Language Assistant
// @author          siamak2
// @onlyonce
// ==/UserScript==

// based on https://addons.mozilla.org/en-us/firefox/addon/input-language-assistant/

UC.inputLanguageAssistant =
{

Windows:
{
    init: function()
    {
        //dump("Windows.init()\n");
        try
        {
            this.lib = ctypes.open("user32.dll");
            this.ActivateKeyboardLayout = this.lib.declare("ActivateKeyboardLayout",
                                                           ctypes.winapi_abi,
                                                           ctypes.voidptr_t,  // return HKL
                                                           ctypes.voidptr_t,  // HKL hkl
                                                           ctypes.uint32_t);  // UINT Flags
            this.KLF_SETFORPROCESS = 0x00000100;
            this.HKL_ENGLISH = ctypes.voidptr_t(0x00000409); // United States (US)
            return true;
        }
        catch (err)
        {
            //dump(err + "\n");
            this.uninit();
            return false;
        }
    },
    
    uninit: function()
    {
        //dump("Windows.uninit()\n");
        try
        {
            if (this.lib)
            {
                this.lib.close();
            }
        }
        catch (err)
        {
            //dump(err + "\n");
        }
    },

    focus: function()
    {
        //dump("Windows.focus()\n");
        try
        {
            if (this.ActivateKeyboardLayout)
            {
                this.hkl = this.ActivateKeyboardLayout(this.HKL_ENGLISH, this.KLF_SETFORPROCESS);
            }
        }
        catch (err)
        {
            //dump(err + "\n");
        }
    },

    blur: function()
    {
        //dump("Windows.blur()\n");
        try
        {
            if (this.ActivateKeyboardLayout && this.hkl)
            {
                this.ActivateKeyboardLayout(this.hkl, this.KLF_SETFORPROCESS);
            }
        }
        catch (err)
        {
            //dump(err + "\n");
        }
    }
}, // Windows

MacOS:
{
//    CoreFoundation:
//    {
//        init: function()
//        {
//            dump("MacOS.CoreFoundation.init()\n");
//            this.lib = ctypes.open("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation");

//            this.CFStringRef = new ctypes.StructType("CFString").ptr;
//            this.CFStringGetLength = this.lib.declare("CFStringGetLength",
//                                                      ctypes.default_abi,
//                                                      ctypes.int32_t,
//                                                      this.CFStringRef);
//            this.CFStringGetCharacterAtIndex = this.lib.declare("CFStringGetCharacterAtIndex",
//                                                          ctypes.default_abi,
//                                                          ctypes.jschar,
//                                                          this.CFStringRef,
//                                                          ctypes.long);
//        },
//        
//        uninit: function()
//        {
//            dump("MacOS.CoreFoundation.uninit()\n");
//            try
//            {
//                if (this.lib)
//                {
//                    this.lib.close();
//                }
//            }
//            catch (err)
//            {
//                dump(err + "\n");
//            }
//        },

//        CFStringToJSString: function(cfstr)
//        {
//            try
//            {
//                var len = this.CFStringGetLength(cfstr);
//                var str = "";
//                for (var i = 0; i < len; i++)
//                {
//                    str += this.CFStringGetCharacterAtIndex(cfstr, i);
//                }
//                return str;
//            }
//            catch (err)
//            {
//                dump(err + "\n");
//            }
//        }
//    }, // CoreFoundation
    
    HIToolbox:
    {
        init: function(CoreFoundation)
        {
            //dump("MacOS.HIToolbox.init()\n");
            this.lib = ctypes.open("/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox");
            this.TISInputSourceRef = new ctypes.StructType("TISInputSource").ptr;
            this.TISCopyCurrentASCIICapableKeyboardInputSource = this.lib.declare("TISCopyCurrentASCIICapableKeyboardInputSource",  
                                                                                  ctypes.default_abi,  
                                                                                  this.TISInputSourceRef);
            this.TISCopyCurrentKeyboardInputSource = this.lib.declare("TISCopyCurrentKeyboardInputSource",  
                                                                      ctypes.default_abi,  
                                                                      this.TISInputSourceRef);
            this.TISSelectInputSource = this.lib.declare("TISSelectInputSource",
                                                         ctypes.default_abi,  
                                                         ctypes.int32_t,
                                                         this.TISInputSourceRef);
//            this.TISGetInputSourceProperty = this.lib.declare("TISGetInputSourceProperty",
//                                                              ctypes.default_abi,  
//                                                              ctypes.voidptr_t,
//                                                              this.TISInputSourceRef,
//                                                              CoreFoundation.CFStringRef);
//            this.kTISPropertyInputSourceID = this.lib.declare("kTISPropertyInputSourceID",
//                                                              CoreFoundation.CFStringRef);
        },
    
        uninit: function()
        {
            //dump("MacOS.HIToolbox.uninit()\n");
            try
            {
                if (this.lib)
                {
                    this.lib.close();
                }
            }
            catch (err)
            {
                //dump(err + "\n");
            }
        }
    }, // HIToolbox

    init: function()
    {
        //dump("MacOS.init()\n");
        try
        {
            //this.CoreFoundation.init();
            this.HIToolbox.init(this.CoreFoundation);
            this.asciiSource = this.HIToolbox.TISCopyCurrentASCIICapableKeyboardInputSource();
            //var id = ctypes.cast(this.HIToolbox.TISGetInputSourceProperty(this.englishSource, this.HIToolbox.kTISPropertyInputSourceID), this.CoreFoundation.CFStringRef);
            //dump("ASCII source: " + this.CoreFoundation.CFStringToJSString(id) + "\n");
            return true;
        }
        catch (err)
        {
            //dump(err + "\n");
            this.uninit();
            return false;
        }
    },
    
    uninit: function()
    {
        //dump("MacOS.uninit()\n");
        this.HIToolbox.uninit();
        //this.CoreFoundation.uninit();
    },

    focus: function()
    {
        //dump("MacOS.focus()\n");
        try
        {
            this.currentSource = this.HIToolbox.TISCopyCurrentKeyboardInputSource();
            //var id = ctypes.cast(this.HIToolbox.TISGetInputSourceProperty(this.currentSource, this.HIToolbox.kTISPropertyInputSourceID), this.CoreFoundation.CFStringRef);
            //dump("Current source: " + this.CoreFoundation.CFStringToJSString(id) + "\n");
            if (this.asciiSource)
            {
                this.HIToolbox.TISSelectInputSource(this.asciiSource);
            }
//            var ptr = this.HIToolbox.TISGetInputSourceProperty(src, this.HIToolbox.kTISPropertyInputSourceLanguages);
//            dump("ptr: " + ptr + "\n");
//            var arr = ctypes.cast(ptr, this.CoreFoundation.CFArrayRef);
//            dump("arr: " + arr + "\n");
//            var count = this.CoreFoundation.CFArrayGetCount(arr);
//            dump("count: " + count + "\n");
//            for (var i = 0; i < count; i++)
//            {
//                var val = this.CoreFoundation.CFArrayGetValueAtIndex(arr, i);
//                var cfstr = ctypes.cast(val, this.CoreFoundation.CFStringRef);
//                var jsstr = this.CoreFoundation.CFStringToJSString(cfstr);
//                dump("arr[" + i + "]: " + jsstr + "\n");
//            }
        }
        catch (err)
        {
            //dump(err + "\n");
        }
    },

    blur: function()
    {
        //dump("MacOS.blur()\n");
        try
        {
            if (this.currentSource)
            {
                this.HIToolbox.TISSelectInputSource(this.currentSource);
            }
        }
        catch (err)
        {
            //dump(err + "\n");
        }
    }
}, // MacOS

init: function ()
{
    try
    {
        //dump("init\n");
        //dump("platform: " + navigator.platform + "\n");

        Components.utils.import("resource://gre/modules/ctypes.jsm");

        if (this.Windows.init())
        {
            this.engine = this.Windows;
        }
        else if (this.MacOS.init())
        {
            this.engine = this.MacOS;
        }
        else
        {
            //dump("Unsupported platform: " + navigator.platform + "\n");
            alert("Unsupported platform: " + navigator.platform);
            return;
        }

        var urlbar = document.getElementById('urlbar-input');
        if (urlbar)
        {
            urlbar.addEventListener("focus", function() { UC.inputLanguageAssistant.focus(); }, false);
            urlbar.addEventListener("blur", function() { UC.inputLanguageAssistant.blur(); }, false);
        }
    }
    catch (err)
    {
        //dump(err + "\n");
    }
},

uninit: function ()
{
    //dump("uninit\n");
    try
    {
        if (this.engine)
        {
            this.engine.uninit();
        }
    }
    catch (err)
    {
        //dump(err + "\n");
    }
},

focus: function ()
{
    //dump("focus\n");
    try
    {
        if (this.engine)
        {
            this.engine.focus();
        }
    }
    catch (err)
    {
        //dump(err + "\n");
    }
},

blur: function ()
{
    //dump("blur\n");
    try
    {
        if (this.engine)
        {
            this.engine.blur();
        }
    }
    catch (err)
    {
        //dump(err + "\n");
    }
}

} // UC.inputLanguageAssistant

window.addEventListener("load", function() { UC.inputLanguageAssistant.init(); }, false);
window.addEventListener("unload", function() { UC.inputLanguageAssistant.uninit(); }, false);
