const SIZE = 29;

function isDark(row: number, col: number): boolean {
  const inFinderBox = (r: number, c: number) => r >= 0 && r < 7 && c >= 0 && c < 7;
  const corners: [number, number][] = [
    [0, 0],
    [0, SIZE - 7],
    [SIZE - 7, 0],
  ];
  for (const [fr, fc] of corners) {
    const r = row - fr;
    const c = col - fc;
    if (r < -1 || r > 7 || c < -1 || c > 7) continue;
    if (!inFinderBox(r, c)) return false;
    if (r === 0 || r === 6 || c === 0 || c === 6) return true;
    if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
    return false;
  }
  if (row === 6 || col === 6) return row % 2 === col % 2;
  const h = (row * 73856093) ^ (col * 19349663);
  return h % 5 === 0;
}

export function QrLoginPanel() {
  const rects: React.ReactNode[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (isDark(row, col)) {
        rects.push(<rect key={`${row}-${col}`} x={col} y={row} width={1.05} height={1.05} />);
      }
    }
  }
  return (
    <div className="mt-4 flex flex-col items-center text-center">
      <h2 className="text-[24px] font-semibold leading-[30px] text-white">
        Scan with your phone camera or the Crypto.com App to login instantly.
      </h2>
      <div className="mt-5 rounded-[8px] bg-white p-4">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-[216px] w-[216px]" role="img" aria-label="QR code">
          <rect width={SIZE} height={SIZE} fill="#ffffff" />
          <g fill="#000000">{rects}</g>
        </svg>
      </div>
      <p className="mt-5 w-full text-left text-base font-medium text-white">Scan with App:</p>
      <ol className="mt-2 w-full list-decimal space-y-1 pl-5 text-left text-base font-medium leading-6 text-grey-200">
        <li>Open the Crypto.com App</li>
        <li>Tap Menu &gt; QR Code Scanner</li>
        <li>Scan the QR code above</li>
      </ol>
    </div>
  );
}
