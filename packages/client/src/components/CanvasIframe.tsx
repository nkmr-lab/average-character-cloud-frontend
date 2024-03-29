import React from "react";
import { FigureJSON } from "../domains/figure_drawer";

export type CanvasIframeClientEvent = {
  type: "updateStrokes";
  id: string;
  strokesNumber: number;
};

export class CanvasIframeClient {
  private listener: (event: MessageEvent) => void;
  private requestIdMap: Map<string, (content: any) => void> = new Map();
  public onEvent?: (evt: CanvasIframeClientEvent) => void;

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
      if (requestId === undefined) {
        this.onEvent?.(data);
        return;
      } else {
        this.requestIdMap.get(requestId)!(data);
      }
    };
    window.addEventListener("message", this.listener, false);
  }

  private send(content: any): Promise<any> {
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

  async clear() {
    await this.send({
      type: "clear",
    });
  }
  async getFigureJSON(): Promise<FigureJSON> {
    const strokes: Float32Array[] = (
      await this.send({
        type: "getStrokes",
      })
    ).strokes;

    return {
      strokes: strokes.map((stroke) => ({
        points: Array.from({ length: stroke.length / 3 }, (_, i) => ({
          x: stroke[i * 3],
          y: stroke[i * 3 + 1],
          z: stroke[i * 3 + 2] / 10,
        })),
      })),
      width: 256,
      height: 256,
    };
  }

  destroy() {
    window.removeEventListener("message", this.listener, false);
  }
}

export default function CanvasIframe({
  canvasIframeClientRef,
  onEvent,
}: {
  canvasIframeClientRef: React.MutableRefObject<CanvasIframeClient | null>;
  onEvent?: (evt: CanvasIframeClientEvent) => void;
}) {
  const iframeId = React.useId();

  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    if (canvasIframeClientRef.current !== null) {
      return;
    }

    const iframe = iframeRef.current!;

    const canvasIframeClient = new CanvasIframeClient(iframeId, iframe);
    canvasIframeClientRef.current = canvasIframeClient;
    return () => {
      canvasIframeClient.destroy();
      canvasIframeClientRef.current = null;
    };
  }, [canvasIframeClientRef, iframeId]);
  React.useEffect(() => {
    canvasIframeClientRef.current!.onEvent = onEvent;
  }, [canvasIframeClientRef, onEvent]);

  return (
    <iframe
      title="canvas"
      src={`canvas/index.html?${iframeId}`}
      style={{ width: 256, height: 256, border: "1px solid #ccc" }}
      ref={iframeRef}
    ></iframe>
  );
}
