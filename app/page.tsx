'use client';

import { useState } from 'react';
import UploadForm from '@/components/UploadForm';
import ResultsPage from '@/components/ResultsPage';
import NavHeader from '@/components/NavHeader';
import type { InterpretationResult } from '@/lib/types';

export default function Home() {
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        body: formData,
      });

      const data: InterpretationResult & { error?: string; pdfId?: string; pdfOriginalName?: string } = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setResult(data);

      // Save to history (fire-and-forget)
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: data.patientName,
          reportDate: data.reportDate,
          abnormalMarkers: data.abnormalMarkers.map((m) => ({
            name: m.name,
            status: m.status,
            severity: m.severity,
            value: m.value,
            unit: m.unit,
            zones: m.zones,
            referenceRange: m.referenceRange,
          })),
          normalMarkerNames: data.normalMarkerNames,
          summary: data.summary,
          smartTip: data.smartTip,
          pdfId: data.pdfId,
          pdfOriginalName: data.pdfOriginalName,
        }),
      }).catch(() => {/* ignore history save failures */});
    } catch {
      setError('Could not reach the service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader active="home" />

      {result ? (
        <ResultsPage result={result} onReset={handleReset} />
      ) : (
        <>
          {error && (
            <div className="max-w-2xl mx-auto px-4 pt-6">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">×</button>
              </div>
            </div>
          )}
          <UploadForm onSubmit={handleSubmit} loading={loading} />
        </>
      )}
    </div>
  );
}
