export function HeightArrow({
  top,
  height,
  x,
}: {
  top: number;
  height: number;
  x: number;
}): JSX.Element {
  const weight = 2;
  const color = "red";
  const width = Math.min(16, height);
  const size = width / 2;

  return (
    <svg
      style={{
        position: "absolute",
        top,
        left: x - size,
        width,
        height,
      }}
    >
      <line
        x1={size}
        y1={0}
        x2={size}
        y2={height}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={size}
        y1={0}
        x2={0}
        y2={size}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={size}
        y1={0}
        x2={size * 2}
        y2={size}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={size}
        y1={height}
        x2={0}
        y2={height - size}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={size}
        y1={height}
        x2={size * 2}
        y2={height - size}
        stroke={color}
        strokeWidth={weight}
      />
    </svg>
  );
}

export function WidthArrow({
  left,
  width,
  y,
}: {
  left: number;
  width: number;
  y: number;
}): JSX.Element {
  const weight = 2;
  const color = "red";
  const height = Math.min(16, width);
  const size = height / 2;

  return (
    <svg
      style={{
        position: "absolute",
        top: y - size,
        left,
        width,
        height,
      }}
    >
      <line
        x1={0}
        y1={size}
        x2={width}
        y2={size}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={0}
        y1={size}
        x2={size}
        y2={0}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={0}
        y1={size}
        x2={size}
        y2={size * 2}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={width}
        y1={size}
        x2={width - size}
        y2={0}
        stroke={color}
        strokeWidth={weight}
      />
      <line
        x1={width}
        y1={size}
        x2={width - size}
        y2={size * 2}
        stroke={color}
        strokeWidth={weight}
      />
    </svg>
  );
}
