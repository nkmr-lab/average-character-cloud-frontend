const id = location.search.substring(1);
const width = 256;
const height = 256;
const canvas = document.getElementById("canvas");
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "#000000";
ctx.lineJoin = "round";
ctx.lineCap = "round";

let drawingPoints = null;
let strokes = [];

canvas.addEventListener("pointerdown", (e) => {
  drawingPoints = [[e.offsetX, e.offsetY, e.pressure * 10]];
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawingPoints) {
    return;
  }

  const prevPoint = drawingPoints[drawingPoints.length - 1];
  const curPoint = [e.offsetX, e.offsetY, e.pressure * 10];
  drawingPoints.push(curPoint);
  ctx.lineWidth = curPoint[2];
  ctx.beginPath();
  ctx.moveTo(prevPoint[0], prevPoint[1]);
  ctx.lineTo(curPoint[0], curPoint[1]);
  ctx.stroke();
});

canvas.addEventListener("pointerup", (e) => {
  if (!drawingPoints) {
    return;
  }

  strokes.push(new Float32Array(drawingPoints.flat()));
  drawingPoints = null;
  window.parent.postMessage({
    type: "updateStrokes",
    id,
    strokesNumber: strokes.length,
  });
});

window.addEventListener(
  "message",
  (e) => {
    if (location.origin !== e.origin) return;
    const data = e.data;
    if (data.type === "clear") {
      ctx.clearRect(0, 0, width, height);
      strokes = [];
      drawingPoints = null;
      window.parent.postMessage({
        type: "clearResponse",
        id,
        requestId: data.requestId,
      });
    }
    if (data.type === "getStrokes") {
      window.parent.postMessage({
        type: "getStrokesResponse",
        id,
        requestId: data.requestId,
        strokes,
      });
    }
  },
  false
);
