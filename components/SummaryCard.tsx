import type { OverallSummary } from '@/lib/types';

interface Props {
  summary: OverallSummary;
  abnormalCount: number;
}

export default function SummaryCard({ summary, abnormalCount }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📋</span>
        <h2 className="text-base font-bold text-gray-900">Your Results at a Glance</h2>
      </div>

      <p className="text-sm text-gray-700 mb-3">{summary.highLevel}</p>

      {summary.focusAreas.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {abnormalCount > 0 ? 'Areas to keep an eye on' : 'Focus areas'}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.focusAreas.map((area, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
