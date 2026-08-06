"use client";

import { useMemo, useState } from "react";

const SEED = [0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];

function hash(seed: number[], x: number, y: number) {
  let h = seed[(x + y * 3) % 3] ^ (x * 374761393) ^ (y * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return Math.abs(h);
}

export function MockQr({ size = 148 }: { size?: number }) {
  const cells = 21;
  const [seed] = useState(SEED);
  const pattern = useMemo(() => {
    const grid: boolean[][] = [];
    for (let y = 0; y < cells; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < cells; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
        if (inFinder) {
          row.push(false);
        } else {
          row.push(hash(seed, x, y) % 100 < 45);
        }
      }
      grid.push(row);
    }
    return grid;
  }, [seed]);

  const cellSize = size / cells;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR code">
      <rect width={size} height={size} fill="#fff" />
      {pattern.flatMap((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill="#0B1426"
            />
          ) : null
        )
      )}
      {[
        { cx: 3.5, cy: 3.5 },
        { cx: cells - 3.5, cy: 3.5 },
        { cx: 3.5, cy: cells - 3.5 },
      ].map((finder, index) => (
        <g key={index}>
          <rect
            x={(finder.cx - 3.5) * cellSize}
            y={(finder.cy - 3.5) * cellSize}
            width={7 * cellSize}
            height={7 * cellSize}
            fill="#0B1426"
          />
          <rect
            x={(finder.cx - 2.5) * cellSize}
            y={(finder.cy - 2.5) * cellSize}
            width={5 * cellSize}
            height={5 * cellSize}
            fill="#fff"
          />
          <rect
            x={(finder.cx - 1.5) * cellSize}
            y={(finder.cy - 1.5) * cellSize}
            width={3 * cellSize}
            height={3 * cellSize}
            fill="#0B1426"
          />
        </g>
      ))}
    </svg>
  );
}
