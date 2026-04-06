import type { Zone } from './types';

// Standard clinical zones for common markers.
// Zones are ordered best→worst (index 0 = healthiest).
// These are applied consistently regardless of what's printed in any specific report,
// ensuring the scale looks the same across uploads for the same test.

const STANDARD_ZONES: Array<{ keywords: string[]; zones: Zone[] }> = [
  {
    keywords: ['total cholesterol', 'cholesterol, total'],
    zones: [
      { label: 'Desirable',       min: null, max: 200 },
      { label: 'Borderline High', min: 200,  max: 240 },
      { label: 'High',            min: 240,  max: null },
    ],
  },
  {
    keywords: ['ldl'],
    zones: [
      { label: 'Optimal',         min: null, max: 100 },
      { label: 'Near Optimal',    min: 100,  max: 130 },
      { label: 'Borderline High', min: 130,  max: 160 },
      { label: 'High',            min: 160,  max: 190 },
      { label: 'Very High',       min: 190,  max: null },
    ],
  },
  {
    keywords: ['hdl'],
    zones: [
      { label: 'Protective',    min: 60,   max: null },
      { label: 'Average Risk',  min: 40,   max: 60   },
      { label: 'At Risk',       min: null, max: 40   },
    ],
  },
  {
    keywords: ['triglyceride'],
    zones: [
      { label: 'Normal',          min: null, max: 150 },
      { label: 'Borderline High', min: 150,  max: 200 },
      { label: 'High',            min: 200,  max: 500 },
      { label: 'Very High',       min: 500,  max: null },
    ],
  },
  {
    keywords: ['glucose', 'blood sugar'],
    zones: [
      { label: 'Normal',      min: null, max: 100 },
      { label: 'Prediabetes', min: 100,  max: 126 },
      { label: 'Diabetes',    min: 126,  max: null },
    ],
  },
  {
    keywords: ['vitamin d'],
    zones: [
      { label: 'Sufficient',   min: 50,   max: null },
      { label: 'Insufficient', min: 30,   max: 50   },
      { label: 'Deficient',    min: null, max: 30   },
    ],
  },
];

export function getStandardZones(markerName: string): Zone[] | null {
  const lower = markerName.toLowerCase();
  const match = STANDARD_ZONES.find(entry =>
    entry.keywords.some(kw => lower.includes(kw))
  );
  return match?.zones ?? null;
}
