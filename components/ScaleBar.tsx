import type { Zone } from '@/lib/types';

interface Props {
  value: string;
  referenceRange: string;
  unit: string;
  status: 'low' | 'high';
  zones?: Zone[] | null;
}

const BUBBLE_HEX  = '#374151'; // gray-700 — neutral, doesn't conflict with zone colors
const BUBBLE_TEXT = 'text-gray-700';

// Zone color palette — index 0 = best (emerald), last = worst (red)
const ZONE_HEX = ['#6ee7b7', '#dcfce7', '#fef9c3', '#ffedd5', '#fee2e2', '#fecaca'];

// Map array index → spread palette position so worst zone is always red
function zoneHex(arrayIdx: number, total: number): string {
  if (total <= 1) return ZONE_HEX[0];
  const idx = Math.round((arrayIdx / (total - 1)) * (ZONE_HEX.length - 1));
  return ZONE_HEX[idx];
}

function parseBounds(range: string): { low: number | null; high: number | null } {
  const s = range.trim();
  const gtMatch = s.match(/^>=?\s*([\d.]+)/);
  if (gtMatch) return { low: parseFloat(gtMatch[1]), high: null };
  const ltMatch = s.match(/^<=?\s*([\d.]+)/);
  if (ltMatch) return { low: null, high: parseFloat(ltMatch[1]) };
  const rangeMatch = s.match(/^([\d.]+)\s*[-–to]+\s*([\d.]+)/);
  if (rangeMatch) return { low: parseFloat(rangeMatch[1]), high: parseFloat(rangeMatch[2]) };
  return { low: null, high: null };
}

function fmt(n: number) {
  return n % 1 === 0 ? n.toString() : parseFloat(n.toFixed(2)).toString();
}

function zoneRangeLabel(zone: Zone, unit: string): string {
  if (zone.min === null && zone.max !== null) return `≤ ${fmt(zone.max)} ${unit}`;
  if (zone.max === null && zone.min !== null) return `≥ ${fmt(zone.min)} ${unit}`;
  if (zone.min !== null && zone.max !== null) return `${fmt(zone.min)}–${fmt(zone.max)} ${unit}`;
  return '';
}

// ── Zone scale (discrete segments, proportional widths) ──────────────────────

function ZoneScale({ value, zones, unit }: {
  value: number; zones: Zone[]; status: 'low' | 'high'; unit: string;
}) {
  if (zones.length === 0) return null;

  // ── 1. Identify active zone by array index (zones are ordered best→worst) ──
  const activeZoneIdx = zones.findIndex(z => {
    const aboveMin = z.min === null || value >= z.min;
    const belowMax = z.max === null || value < z.max;
    return aboveMin && belowMax;
  });

  // ── 2. Compute virtual widths ─────────────────────────────────────────────
  // Bounded zones get their actual numeric span.
  // Unbounded zones (null min or max) get the width of the widest bounded zone,
  // preventing them from collapsing to a sliver or dominating the bar.
  const boundedSpans = zones
    .filter(z => z.min !== null && z.max !== null)
    .map(z => z.max! - z.min!);
  const maxBoundedSpan = boundedSpans.length > 0 ? Math.max(...boundedSpans) : 1;

  const virtualWidths = zones.map(z =>
    z.min !== null && z.max !== null ? z.max - z.min : maxBoundedSpan
  );
  const totalVirtual = virtualWidths.reduce((a, b) => a + b, 0);

  // ── 3. Sort zones spatially (low values left → high values right) ─────────
  // Keep original array index for color assignment.
  const spatialOrder = zones
    .map((z, arrayIdx) => ({ z, arrayIdx, virtualWidth: virtualWidths[arrayIdx] }))
    .sort((a, b) => (a.z.min ?? -Infinity) - (b.z.min ?? -Infinity));

  // ── 4. Build segments with left % and width % ─────────────────────────────
  let cumLeft = 0;
  const segments = spatialOrder.map(({ z, arrayIdx, virtualWidth }) => {
    const widthPct = (virtualWidth / totalVirtual) * 100;
    const seg = {
      zone: z,
      arrayIdx,
      left: cumLeft,
      width: widthPct,
      active: arrayIdx === activeZoneIdx,
    };
    cumLeft += widthPct;
    return seg;
  });

  // ── 5. Map value → % position on bar ─────────────────────────────────────
  const activeSeg = segments.find(s => s.active);
  let valuePct = 50;
  if (activeSeg) {
    const z = activeSeg.zone;
    const effMin = z.min ?? (z.max! - maxBoundedSpan);
    const effMax = z.max ?? (z.min! + maxBoundedSpan);
    const fraction = Math.max(0.05, Math.min(0.95, (value - effMin) / (effMax - effMin)));
    valuePct = activeSeg.left + fraction * activeSeg.width;
  }

  // Build zone-accurate gradient: hard stops at each boundary
  const gradientStops = segments.flatMap((seg, i) => {
    const hex = zoneHex(seg.arrayIdx, zones.length);
    const stops: string[] = [];
    if (i === 0) stops.push(`${hex} 0%`);
    stops.push(`${hex} ${seg.left + seg.width}%`);
    if (i < segments.length - 1) {
      stops.push(`${zoneHex(segments[i + 1].arrayIdx, zones.length)} ${seg.left + seg.width}%`);
    }
    return stops;
  });
  const gradientCss = `linear-gradient(to right, ${gradientStops.join(', ')})`;

  return (
    <div className="mb-2 mt-2">
      {/* Bubble + bar */}
      <div className="relative" style={{ paddingTop: '40px' }}>

        {/* Value bubble */}
        <div
          className="absolute z-20 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${valuePct}%`, top: 0 }}
        >
          <div
            className={`px-2.5 py-0.5 rounded-lg text-sm font-bold bg-white shadow-sm border-2 ${BUBBLE_TEXT}`}
            style={{ borderColor: BUBBLE_HEX }}
          >
            {fmt(value)}
          </div>
          <div style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${BUBBLE_HEX}`,
          }} />
        </div>

        {/* Zone-accurate gradient bar */}
        <div
          className="relative h-5 rounded-full"
          style={{ background: gradientCss }}
        >
          {/* Value dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${valuePct}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-[2.5px] border-gray-700 shadow-md" />
          </div>
        </div>
      </div>

      {/* Zone labels below bar */}
      <div className="relative mt-2" style={{ height: '44px' }}>
        {segments.map((seg, i) => {
          const midPct = seg.left + seg.width / 2;
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center -translate-x-1/2 pointer-events-none"
              style={{ left: `${midPct}%` }}
            >
              <span className={`text-xs whitespace-nowrap leading-tight ${seg.active ? 'font-bold text-gray-800' : 'font-medium text-gray-400'}`}>
                {seg.zone.label}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap leading-tight mt-0.5">
                {zoneRangeLabel(seg.zone, unit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Simple scale (no named zones) ────────────────────────────────────────────

function SimpleScale({ value, referenceRange, unit }: {
  value: number; referenceRange: string; unit: string; status: 'low' | 'high';
}) {
  const { low, high } = parseBounds(referenceRange);
  if (low === null && high === null) return null;

  const rangeSpan = (low !== null && high !== null)
    ? high - low
    : (high ?? low!) * 0.5;
  const pad = rangeSpan * 0.45;

  const visMin = low !== null ? Math.min(low - pad, value - pad * 0.5) : Math.max(0, (high! - rangeSpan) - pad);
  const visMax = high !== null ? Math.max(high + pad, value + pad * 0.5) : (low! + rangeSpan) + pad;
  const visSpan = visMax - visMin;

  function pct(v: number) {
    return Math.max(0, Math.min(100, ((v - visMin) / visSpan) * 100));
  }

  const valuePct = pct(value);
  const lowPct  = low  !== null ? pct(low)  : 0;
  const highPct = high !== null ? pct(high) : 100;

  // Three discrete segments: out-of-range | normal | out-of-range
  // Bad side (direction of the abnormal value) is redder; other side is muted orange
  const NORMAL_HEX  = '#6ee7b7'; // emerald-200
  const BAD_HEX     = '#fecaca'; // red-200
  const MUTED_HEX   = '#ffedd5'; // orange-100
  const belowHex = status === 'low'  ? BAD_HEX : MUTED_HEX;
  const aboveHex = status === 'high' ? BAD_HEX : MUTED_HEX;

  return (
    <div className="mb-2 mt-2">
      <div className="relative" style={{ paddingTop: '40px' }}>

        {/* Value bubble */}
        <div
          className="absolute z-20 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${valuePct}%`, top: 0 }}
        >
          <div
            className={`px-2.5 py-0.5 rounded-lg text-sm font-bold bg-white shadow-sm border-2 ${BUBBLE_TEXT}`}
            style={{ borderColor: BUBBLE_HEX }}
          >
            {fmt(value)}
          </div>
          <div style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${BUBBLE_HEX}`,
          }} />
        </div>

        {/* Discrete 3-zone bar */}
        <div className="relative h-5 rounded-full overflow-hidden flex">
          {low !== null && (
            <div style={{ width: `${lowPct}%`, background: belowHex }} />
          )}
          <div style={{ width: `${highPct - lowPct}%`, background: NORMAL_HEX }} />
          {high !== null && (
            <div style={{ width: `${100 - highPct}%`, background: aboveHex }} />
          )}

          {/* Zone dividers */}
          {[lowPct, highPct].map((tp, i) =>
            tp > 2 && tp < 98 ? (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${tp}%` }} />
            ) : null
          )}

          {/* Value dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${valuePct}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-[2.5px] border-gray-700 shadow-md" />
          </div>
        </div>
      </div>

      {/* Zone labels */}
      <div className="relative mt-2" style={{ height: '44px' }}>
        {low !== null && (
          <div className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: `${lowPct / 2}%` }}>
            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Below range</span>
            <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{`< ${fmt(low)} ${unit}`}</span>
          </div>
        )}
        <div
          className="absolute flex flex-col items-center -translate-x-1/2"
          style={{ left: `${(lowPct + highPct) / 2}%` }}
        >
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Normal range</span>
          <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
            {low !== null && high !== null ? `${fmt(low)}–${fmt(high)} ${unit}` : ''}
          </span>
        </div>
        {high !== null && (
          <div
            className="absolute flex flex-col items-center -translate-x-1/2"
            style={{ left: `${highPct + (100 - highPct) / 2}%` }}
          >
            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Above range</span>
            <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{`> ${fmt(high)} ${unit}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ScaleBar({ value, referenceRange, unit, status, zones }: Props) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  if (zones && zones.length > 0) {
    return <ZoneScale value={numValue} zones={zones} status={status} unit={unit} />;
  }

  return <SimpleScale value={numValue} referenceRange={referenceRange} unit={unit} status={status} />;
}
