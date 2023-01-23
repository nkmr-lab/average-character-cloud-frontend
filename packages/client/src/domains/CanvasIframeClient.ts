export default class CanvasIframeClient {
  listener: (event: MessageEvent) => void;
  requestIdMap: Map<string, (content: any) => void> = new Map();

  constructor(private id: string, private iframe: HTMLIFrameElement) {
    this.listener = (event: MessageEvent) => {
      if (globalThis.location.origin !== event.origin) {
        return;
      }
      const data = event.data;
      if (data.id !== this.id) {
        return;
      }
      const requestId = data.requestId;
      this.requestIdMap.get(requestId)!(data);
    };
    window.addEventListener("message", this.listener, false);
  }

  send(content: any): Promise<any> {
    const requestId = Math.random().toString();
    this.iframe.contentWindow!.postMessage({
      id: this.id,
      requestId,
      ...content,
    });
    return new Promise((resolve) => {
      this.requestIdMap.set(requestId, resolve);
    });
  }

  destroy() {
    window.removeEventListener("message", this.listener, false);
  }
}
