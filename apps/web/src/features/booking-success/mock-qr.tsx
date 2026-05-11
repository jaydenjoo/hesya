/**
 * Plan v3 Phase D2-B1 — 의사(mock) QR 코드. 실제 QR 인코딩 X, booking ID
 * 해시로 결정적 21x21 패턴 + 3 finder 사각형 생성. 시각적 정합용.
 *
 * 정식 QR은 M4/M5에서 `qrcode` lib 도입 시 교체.
 */

const SIZE = 21;

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return h >>> 0;
}

function isFinderCell(x: number, y: number): boolean {
  const inSquare = (px: number, py: number) => {
    const dx = x - px;
    const dy = y - py;
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return false;
    if (dx === 0 || dx === 6 || dy === 0 || dy === 6) return true;
    if (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) return true;
    return false;
  };
  return (
    isFinderCell0(x, y) ||
    inSquare(0, 0) ||
    inSquare(SIZE - 7, 0) ||
    inSquare(0, SIZE - 7)
  );
}

function isFinderCell0(x: number, y: number): boolean {
  if (x < 7 && y < 7) return false;
  if (x >= SIZE - 7 && y < 7) return false;
  if (x < 7 && y >= SIZE - 7) return false;
  return false;
}

function isReservedFinderArea(x: number, y: number): boolean {
  if (x < 8 && y < 8) return true;
  if (x >= SIZE - 8 && y < 8) return true;
  if (x < 8 && y >= SIZE - 8) return true;
  return false;
}

interface Props {
  readonly bookingId: string;
  readonly size?: number;
}

export function MockQr({ bookingId, size = 168 }: Props) {
  const seed = hashSeed(bookingId);
  const cells: string[] = [];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let on = false;
      if (isFinderCell(x, y)) {
        on = true;
      } else if (!isReservedFinderArea(x, y)) {
        const bit = ((seed >> ((x + y * SIZE) % 31)) ^ (x * 31 + y * 17)) & 1;
        on = bit === 0;
      }
      if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" />`);
    }
  }

  const svgInner = cells.join("");
  return (
    <svg
      role="img"
      aria-label={`Booking QR ${bookingId.slice(0, 8)}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      className="rounded-md bg-white p-2"
      shapeRendering="crispEdges"
      fill="var(--hesya-navy-900)"
      dangerouslySetInnerHTML={{ __html: svgInner }}
    />
  );
}
