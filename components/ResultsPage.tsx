import type { InterpretationResult } from '@/lib/types';
import MarkerCard from './MarkerCard';
import SummaryCard from './SummaryCard';
import SmartTipCard from './SmartTipCard';

const SEVERITY_ORDER: Record<string, number> = {
  'Needs attention': 0,
  'Moderate': 1,
  'Mild': 2,
};

// Returns true if value is strictly outside the printed reference range
function isOutOfRange(value: string, referenceRange: string): boolean {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  const s = referenceRange.trim();
  const gt = s.match(/^>=?\s*([\d.]+)/);
  if (gt) return num < parseFloat(gt[1]);
  const lt = s.match(/^<=?\s*([\d.]+)/);
  if (lt) return num > parseFloat(lt[1]);
  const range = s.match(/^([\d.]+)\s*[-–to]+\s*([\d.]+)/);
  if (range) return num < parseFloat(range[1]) || num > parseFloat(range[2]);
  return false;
}

interface Props {
  result: InterpretationResult;
  onReset: () => void;
}

export default function ResultsPage({ result, onReset }: Props) {
  const { abnormalMarkers, normalMarkerNames, summary, smartTip } = result;


  const sorted = [...abnormalMarkers].sort((a, b) => {
    // Group 1: strictly outside reference range
    // Group 2: within range but clinically flagged
    const aGroup = isOutOfRange(a.value, a.referenceRange) ? 0 : 1;
    const bGroup = isOutOfRange(b.value, b.referenceRange) ? 0 : 1;
    if (aGroup !== bGroup) return aGroup - bGroup;
    // Within each group, sort by severity
    return (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{result.patientName || 'Lab Report'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {result.reportDate ? `Report date: ${new Date(result.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ` : ''}
            {sorted.length === 0
              ? 'All markers within range'
              : `${sorted.length} marker${sorted.length > 1 ? 's' : ''} need${sorted.length === 1 ? 's' : ''} attention`}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          ← New report
        </button>
      </div>

      <SummaryCard summary={summary} abnormalCount={sorted.length} />
      {smartTip && <SmartTipCard tip={smartTip} />}

      {/* Abnormal markers — full width, one per row */}
      {sorted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Markers needing attention</h2>
          <div className="space-y-4">
            {sorted.map((marker) => (
              <MarkerCard key={marker.name} marker={marker} />
            ))}
          </div>
        </div>
      )}

      {/* Normal markers */}
      {normalMarkerNames.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-700">Within normal range</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {normalMarkerNames.map((name) => (
              <span
                key={name}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-600">Disclaimer:</strong> This information is for educational purposes only and is not medical advice. Please consult your doctor for diagnosis or treatment.
      </div>
    </div>
  );
}
