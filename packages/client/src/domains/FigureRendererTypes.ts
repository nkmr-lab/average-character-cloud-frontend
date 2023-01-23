export type Figure =
  | {
      type: "image_url";
      svgPart: string;
      left: number;
      top: number;
      right: number;
      bottom: number;
      size: number;
    }
  | {
      type: "not_registered";
      value: string;
      size: number;
    };

export const Figure = {
  left: (figure: Figure) => {
    switch (figure.type) {
      case "image_url":
        return figure.left;
      case "not_registered":
        return 0;
    }
  },
  top: (figure: Figure) => {
    switch (figure.type) {
      case "image_url":
        return figure.top;
      case "not_registered":
        return 0;
    }
  },
  right: (figure: Figure) => {
    switch (figure.type) {
      case "image_url":
        return figure.right;
      case "not_registered":
        return figure.size;
    }
  },
  bottom: (figure: Figure) => {
    switch (figure.type) {
      case "image_url":
        return figure.bottom;
      case "not_registered":
        return figure.size;
    }
  },
  width: (figure: Figure) => {
    return Figure.right(figure) - Figure.left(figure);
  },
  height: (figure: Figure) => {
    return Figure.bottom(figure) - Figure.top(figure);
  },
};

export type TextFigure = {
  x: number;
  y: number;
  figure: Figure;
};

export type Text = {
  figures: TextFigure[];
  width: number;
  height: number;
  backgroundImageUrl: string | null;
};

export async function textToImageUrl(text: Text): Promise<string> {
  const svg = `
    <svg width="${text.width}" height="${
    text.height
  }" xmlns="http://www.w3.org/2000/svg">
      ${text.figures
        .map((figure) =>
          figure.figure.type === "image_url"
            ? `<g transform="translate(${figure.x} ${figure.y}) scale(${
                figure.figure.size / 256
              } ${figure.figure.size / 256})">${figure.figure.svgPart}</g>`
            : ""
        )
        .join("")}
    </svg>
  `;
  const canvas = document.createElement("canvas");
  canvas.width = text.width;
  canvas.height = text.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, text.width, text.height);
  if (text.backgroundImageUrl !== null) {
    const backgroundImg = await loadImage(text.backgroundImageUrl);
    ctx.drawImage(backgroundImg, 0, 0, text.width, text.height);
  }
  const img = await loadImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
  img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
  });
}
