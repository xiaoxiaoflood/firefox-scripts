// ==UserScript==
// @name            Network Speed Monitor
// @include         main
// @startup         UC.networkMonitor.exec(win);
// @shutdown        UC.networkMonitor.destroy();
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

// original: https://bbs.kafan.cn/thread-1784208-1-1.html

(function () {

  UC.networkMonitor = {
    interval: 1000,

    exec: function (win) {
      var document = win.document;
      var sspi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css,' + encodeURIComponent(UC.networkMonitor.style) + '"'
      );
      document.insertBefore(sspi, document.documentElement);
      UC.networkMonitor.styles.push(sspi);
    },

    style: `
    @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
    #urlbar-speedmonitor {
      direction: ltr;
    }
    #speed-upload,
    #speed-download {
      margin: 0px !important;
      text-align: right;
      width: 50px;
    }
    #dnar,
    #upar {
      font-size: 18.5px;
    }
    #dnar,
    #speed-download {
      color: green;
    }
    #upar,
    #speed-upload {
      color: blue;
    }`,

    styles: [],

    dwElements: [],

    upElements: [],

    init: function () {
      Components.utils.import('resource://gre/modules/ctypes.jsm');

      CustomizableUI.createWidget({
        id: 'urlbar-speedmonitor',
        type: 'custom',
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: function (aDocument) {
          var toolbaritem = aDocument.createElement('toolbarbutton');
          var props = {
            id: 'urlbar-speedmonitor',
            class: 'toolbarbutton-1 chromeclass-toolbar-additional',
            label: 'Speed Monitor',
            tooltiptext: 'Network Speed Monitor'
          };
          for (var p in props) {
            toolbaritem.setAttribute(p, props[p]);
          }

          var dow = aDocument.createElement('label');
          dow.id = 'speed-download';
          var d = aDocument.createElement('label');
          d.setAttribute('value', 'ðŸ¡‡');
          d.id = 'dnar';
          var upl = aDocument.createElement('label');
          upl.id = 'speed-upload';
          var u = aDocument.createElement('label');
          u.setAttribute('value', 'ðŸ¡…');
          u.id = 'upar';

          toolbaritem.appendChild(dow);
          toolbaritem.appendChild(d);
          toolbaritem.appendChild(upl);
          toolbaritem.appendChild(u);

          UC.networkMonitor.dwElements.push(dow);
          UC.networkMonitor.upElements.push(upl);

          return toolbaritem;
        }
      });

      // MIB_IFROW
      const MIB_IFROW = new ctypes.StructType('MIB_IFROW',
      [
        {wszName: ctypes.ArrayType(ctypes.jschar, 256)},
        {dwIndex: ctypes.uint32_t},
        {dwType: ctypes.uint32_t},
        {dwMtu: ctypes.uint32_t},
        {dwSpeed: ctypes.uint32_t},
        {dwPhysAddrLen: ctypes.uint32_t},
        {bPhysAddr: ctypes.ArrayType(ctypes.uint8_t, 8)},
        {dwAdminStatus: ctypes.uint32_t},
        {dwOperStatus: ctypes.uint32_t},
        {dwLastChange: ctypes.uint32_t}, 
        {dwInOctets: ctypes.uint32_t},
        {dwInUcastPkts: ctypes.uint32_t},
        {dwInNUcastPkts: ctypes.uint32_t},
        {dwInDiscards: ctypes.uint32_t},
        {dwInErrors: ctypes.uint32_t},
        {dwInUnknownProtos: ctypes.uint32_t},
        {dwOutOctets: ctypes.uint32_t},
        {dwOutUcastPkts: ctypes.uint32_t},
        {dwOutNUcastPkts: ctypes.uint32_t},
        {dwOutDiscards: ctypes.uint32_t},
        {dwOutErrors: ctypes.uint32_t},
        {dwOutQLen: ctypes.uint32_t},
        {dwDescrLen: ctypes.uint32_t},
        {bDescr: ctypes.ArrayType(ctypes.uint8_t, 256)}
      ]);

      const MIB_IFTABLE = new ctypes.StructType('MIB_IFTABLE',
      [
        {dwNumEntries: ctypes.uint32_t},
        {table: ctypes.ArrayType(MIB_IFROW, 64)}
      ]);

      // MultiByteToWideChar
      var fnMultiByteToWideChar = ctypes.open('kernel32.dll').declare('MultiByteToWideChar', ctypes.default_abi || ctypes.winapi_abi, ctypes.int32_t, ctypes.uint32_t, ctypes.uint32_t, ctypes.unsigned_char.ptr, ctypes.int32_t, ctypes.jschar.ptr, ctypes.int32_t);

      // GetIfTable
      var fnGetIfTable = ctypes.open('iphlpapi.dll').declare('GetIfTable', ctypes.default_abi || ctypes.winapi_abi, ctypes.uint32_t, MIB_IFTABLE.ptr, ctypes.uint32_t.ptr, ctypes.uint32_t);

      ////////////////////////////////////////////////
      // Ethernet
      /* below adapted from Ipifcons.h */
      const MIB_IF_TYPE_ETHERNET = 6;
      const MIB_IF_TYPE_FDDI = 15;
      const MIB_IF_TYPE_PPP = 23;
      const IF_TYPE_IEEE80211 = 71;
      const IF_OPER_STATUS_CONNECTED = 4;
      const IF_OPER_STATUS_OPERATIONAL = 5;

      var iftable = MIB_IFTABLE();
      iftable.dwNumEntries = 64;
      var numEntries = ctypes.uint32_t(64);

      var ethernetEntry = [];
      var ethernetTick = 0;

      function GetEthernetSpeed (index, in_speed, out_speed) {
        updateEthernet();
        if (index >= 0 && index < ethernetEntry.length) {
          var entry = ethernetEntry[index];
          in_speed.value = entry.in_speed;
          out_speed.value = entry.out_speed;
        }
      }

      var ethernetUpdateTime = 0;
      function updateEthernet() {
        var updateTime = Date.now();
        if (updateTime - ethernetUpdateTime < 500) {
          return;
        } else {
          ethernetUpdateTime = updateTime;
        }

        fnGetIfTable(iftable.address(), numEntries.address(), 1);
        var count = 0;
        for (var i = 0; i < iftable.dwNumEntries; ++i) {
          var row = iftable.table[i];
          if (filterRow(row)) {++count;
          }
        }

        // reset entries
        if (count != ethernetEntry.length) {
          ethernetEntry = [];
          ethernetTick = 0;
          for (var i = 0; i < count; ++i) {
            ethernetEntry.push({
              in_octets: 0,
              out_octets: 0,
              in_speed: 0,
              out_speed: 0
            });
          }
        }

        count = 0;
        var tick = updateTime;
        var t = tick - ethernetTick;
        if (t <= 0) {
          t = 1;
        }
        for (var i = 0,
        j = 0; i < iftable.dwNumEntries; ++i) {
          var row = iftable.table[i];
          if (!filterRow(row)) {
            continue;
          }

          var entry = ethernetEntry[j];
          if (ethernetTick > 0) {
            entry.in_speed = Math.floor((row.dwInOctets - entry.in_octets) * 1000 / t);
            entry.out_speed = Math.floor((row.dwOutOctets - entry.out_octets) * 1000 / t);
          }

          entry.in_octets = row.dwInOctets;
          entry.out_octets = row.dwOutOctets;
          if (entry.name === undefined) {
            entry.name = '';
            let n = row.dwDescrLen;
            if (n > 1) {--n;
            }
            if (n > 0) {
              let bDesc = new ctypes.ArrayType(ctypes.unsigned_char)(n);
              for (let k = 0; k < n; ++k) {
                bDesc[k] = row.bDescr[k];
              }
              let Name = new ctypes.ArrayType(ctypes.jschar)(n * 2);
              let len = fnMultiByteToWideChar(0, 0, bDesc, n, Name, n * 2);
              for (let k = 0; k < len; ++k) {
                entry.name += Name[k];
              }
            }
          }

          ++j;
          if (j == count) {
            break;
          }
        }
        ethernetTick = tick;
      }

      function filterRow(row) {
        var dwType = row.dwType;
        var dwOperStatus = row.dwOperStatus;
        return ((dwType == MIB_IF_TYPE_ETHERNET || dwType == MIB_IF_TYPE_PPP || dwType == MIB_IF_TYPE_FDDI || dwType == IF_TYPE_IEEE80211) && (dwOperStatus == IF_OPER_STATUS_OPERATIONAL || dwOperStatus == IF_OPER_STATUS_CONNECTED) && (row.dwInOctets > 0 && row.dwOutOctets > 0));
      }
      
      function formatSpeed (v) {
        if (v == 0) return '0 KB';
        else if (v < 1024 * 1024) return (v / 1024).toFixed() + ' KB';
        else return (v / (1024 * 1024)).toFixed(2) + ' MB';
      }

      function updateNetwork () {
        var inSpeed = {value: 0}, outSpeed = {value: 0};
        GetEthernetSpeed(0, inSpeed, outSpeed);
        var dd = formatSpeed(inSpeed.value);
        var uu = formatSpeed(outSpeed.value);
        UC.networkMonitor.dwElements.forEach(e => e.setAttribute('value', dd));
        UC.networkMonitor.upElements.forEach(e => e.setAttribute('value', uu));
      }

      this.loop = setInterval(updateNetwork, this.interval);
    },

    destroy: function () {
      CustomizableUI.destroyWidget('urlbar-speedmonitor');
      clearTimeout(this.loop);
      UC.networkMonitor.styles.forEach(s => s.parentNode.removeChild(s));
      delete UC.networkMonitor;
    }
  }

  UC.networkMonitor.init();

})()
