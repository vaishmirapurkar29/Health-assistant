import type { SmartTip } from '@/lib/types';

interface Props {
  tip: SmartTip;
}

export default function SmartTipCard({ tip }: Props) {
  return (
    <div className="bg-teal-50 rounded-2xl border border-teal-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💡</span>
        <h2 className="text-base font-bold text-teal-900">Smart Tip — Trend Detected</h2>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-teal-800 mb-0.5">What we noticed</p>
          <p className="text-teal-700">{tip.insight}</p>
        </div>

        <div>
          <p className="font-semibold text-teal-800 mb-0.5">What it may mean</p>
          <p className="text-teal-700">{tip.meaning}</p>
        </div>

        <div>
          <p className="font-semibold text-teal-800 mb-0.5">What you can do</p>
          <p className="text-teal-700">{tip.action}</p>
        </div>

        <p className="text-teal-600 italic">{tip.doctorPrompt}</p>
      </div>
    </div>
  );
}
