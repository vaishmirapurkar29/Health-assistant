import type { MarkerInterpretation } from '@/lib/types';
import ScaleBar from './ScaleBar';

interface Props {
  marker: MarkerInterpretation;
}

// Same palette as ScaleBar
const ZONE_CHIP = [
  'bg-emerald-200 text-emerald-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-red-200 text-red-900',
];

function activeZoneChip(marker: MarkerInterpretation): { label: string; colorClass: string } {
  const val = parseFloat(marker.value);
  if (marker.zones && marker.zones.length > 0 && !isNaN(val)) {
    const idx = marker.zones.findIndex(z =>
      (z.min === null || val >= z.min) && (z.max === null || val < z.max)
    );
    if (idx >= 0) {
      const colorIdx = marker.zones.length === 1 ? 0
        : Math.round((idx / (marker.zones.length - 1)) * (ZONE_CHIP.length - 1));
      const z = marker.zones[idx];
      const nearBoundary = z.max !== null && (z.max - val) / z.max < 0.15;
      const label = nearBoundary ? `${z.label} · near limit` : z.label;
      return { label, colorClass: ZONE_CHIP[colorIdx] };
    }
  }
  return {
    label: marker.status === 'high' ? 'Above range' : 'Below range',
    colorClass: marker.status === 'high' ? 'bg-red-200 text-red-900' : 'bg-orange-100 text-orange-800',
  };
}

export default function MarkerCard({ marker }: Props) {
  const chip = activeZoneChip(marker);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${chip.colorClass}`}>
            {chip.label}
          </span>
          <p className="font-semibold text-gray-900 text-sm">{marker.name}</p>
          <p className="text-xs font-semibold text-gray-500">
            {marker.value} {marker.unit}
          </p>
        </div>
      </div>
      <ScaleBar
        value={marker.value}
        referenceRange={marker.referenceRange}
        unit={marker.unit}
        status={marker.status}
        zones={marker.zones}
      />

      <div className="space-y-3">
        {/* What it is */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">What it is</p>
          <p className="text-sm text-gray-700">{marker.whatItIs}</p>
        </div>

        {/* What you can do */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">What you can do</p>
          <ul className="space-y-0.5">
            {marker.lifestyle.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Reassurance */}
        <div className="flex items-start gap-2 bg-stone-100 rounded-xl px-3 py-2">
          <svg className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <p className="text-sm text-stone-600 italic">{marker.reassurance}</p>
        </div>
      </div>
    </div>
  );
}
