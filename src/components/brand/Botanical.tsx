/**
 * Eucalyptus sprig line illustration — an original, restrained interpretation
 * of the brand's botanical identity. Drawn with a single stroke weight so it
 * reads as fine engraving. Used sparingly: philosophy, footer, 404.
 *
 * When placed inside a `[data-reveal]` parent the stems draw themselves in.
 */

// y position along the stem, leaf radii, side (-1 left / 1 right) and tilt
const leafSpec: [number, number, number, -1 | 1, number][] = [
  [62, 14, 11, 1, -24],
  [96, 16, 13, -1, 20],
  [134, 18, 14, 1, -16],
  [174, 20, 15, -1, 18],
  [214, 21, 16, 1, -20],
  [256, 22, 17, -1, 22],
  [298, 23, 17, 1, -14],
  [342, 23, 18, -1, 16],
  [386, 23, 18, 1, -20],
  [430, 22, 17, -1, 14],
];

const leaves = leafSpec.map(([y, rx, ry, side, r]) => {
  const stemX = 126;
  const petiole = 7;
  return { stemX, y, side, rx, ry, r, cx: stemX + side * (rx + petiole), petiole };
});

export function EucalyptusSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 520"
      className={`botanical ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path
        className="botanical-stem"
        pathLength={1}
        d="M126 34 L 126 500"
      />
      {leaves.map((leaf, i) => (
        <g key={i} transform={`rotate(${leaf.r} ${leaf.stemX} ${leaf.y})`}>
          <path
            className="botanical-leaf"
            pathLength={1}
            style={{ ["--leaf" as string]: i }}
            d={`M${leaf.stemX} ${leaf.y} L ${leaf.stemX + leaf.side * leaf.petiole} ${leaf.y}`}
          />
          <ellipse
            className="botanical-leaf"
            pathLength={1}
            style={{ ["--leaf" as string]: i }}
            cx={leaf.cx}
            cy={leaf.y}
            rx={leaf.rx}
            ry={leaf.ry}
          />
          <path
            className="botanical-leaf"
            pathLength={1}
            style={{ ["--leaf" as string]: i }}
            d={`M${leaf.cx - leaf.rx * 0.8} ${leaf.y} L ${leaf.cx + leaf.rx * 0.8} ${leaf.y}`}
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}
