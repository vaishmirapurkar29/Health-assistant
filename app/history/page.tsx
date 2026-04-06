'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavHeader from '@/components/NavHeader';
import type { HistoryRecord } from '@/lib/types';

// Same palette as ScaleBar zone colors
const ZONE_BADGE = [
  'bg-emerald-200 text-emerald-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-red-200 text-red-900',
];

type BadgeMarker = HistoryRecord['abnormalMarkers'][number];

function markerBadge(m: BadgeMarker): { color: string; label: string } {
  const val = parseFloat(m.value);
  if (m.zones && m.zones.length > 0 && !isNaN(val)) {
    const activeIdx = m.zones.findIndex(z =>
      (z.min === null || val >= z.min) && (z.max === null || val < z.max)
    );
    if (activeIdx >= 0) {
      const colorIdx = m.zones.length === 1 ? 0
        : Math.round((activeIdx / (m.zones.length - 1)) * (ZONE_BADGE.length - 1));
      const z = m.zones[activeIdx];
      const nearBoundary = z.max !== null && (z.max - val) / z.max < 0.15;
      const label = nearBoundary ? `${z.label} · near limit` : z.label;
      return { color: ZONE_BADGE[colorIdx], label };
    }
  }
  // No zones — use out-of-range color + Above/Below range label
  return {
    color: m.status === 'high' ? 'bg-red-200 text-red-900' : 'bg-orange-100 text-orange-800',
    label: m.status === 'high' ? 'Above range' : 'Below range',
  };
}

function groupByPatient(records: HistoryRecord[]): Record<string, HistoryRecord[]> {
  return records.reduce<Record<string, HistoryRecord[]>>((acc, r) => {
    const key = r.patientName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data: HistoryRecord[]) => setRecords(data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  const grouped = groupByPatient(records);
  const patients = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader active="history" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Lab History</h1>

        {loading && (
          <p className="text-sm text-gray-400">Loading…</p>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-500 text-sm mb-4">No reports saved yet.</p>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Upload your first report →
            </Link>
          </div>
        )}

        {!loading && patients.map((patient) => (
          <div key={patient} className="mb-8">
            {/* Patient header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                {patient.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-base font-semibold text-gray-900">{patient}</h2>
              <span className="text-xs text-gray-400">{grouped[patient].length} report{grouped[patient].length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3">
              {grouped[patient].map((record) => (
                <div key={record.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Date row */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(record.reportDate)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Saved {formatDate(record.savedAt)}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-gray-600 mb-3">{record.summary.highLevel}</p>

                      {/* Abnormal markers */}
                      {record.abnormalMarkers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {record.abnormalMarkers.map((m) => {
                            const { color, label } = markerBadge(m);
                            return (
                              <span
                                key={m.name}
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}
                              >
                                {m.name} · {m.value} {m.unit} · {label}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          All within range
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {record.pdfId && (
                        <a
                          href={`/api/download?id=${record.pdfId}&filename=${encodeURIComponent(record.pdfOriginalName ?? 'lab-report.pdf')}`}
                          download
                          className="text-indigo-400 hover:text-indigo-600 transition-colors"
                          title="Download original PDF"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deleting === record.id}
                        className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete record"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
