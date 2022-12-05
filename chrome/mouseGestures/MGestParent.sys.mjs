export class MGestParent extends JSWindowActorParent {
  receiveMessage(message) {
    const { document, gBrowser } = this.browsingContext.topChromeWindow;
    switch (message.name) {
      case 'mousedown':
        this.browsingContext.topChromeWindow.UC.MGest.actor = this.browsingContext.currentWindowGlobal.getActor('MGest');
        break;
      case 'scroll-up':
        document.commandDispatcher.getControllerForCommand('cmd_moveTop').doCommand('cmd_moveTop');
        break;
      case 'scroll-down':
        document.commandDispatcher.getControllerForCommand('cmd_moveBottom').doCommand('cmd_moveBottom');
        break;
      case 'newTab':
        gBrowser.addTab(message.data.url, {
          owner: gBrowser.selectedTab,
          relatedToCurrent: true,
          triggeringPrincipal: gBrowser.selectedBrowser.contentPrincipal
        });
    }
  }
  
  cmd (obj) {
    this.sendAsyncMessage('', obj);
  }
}
