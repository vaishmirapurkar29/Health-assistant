export interface LabMarker {
  name: string;
  value: string;
  referenceRange: string;
  unit: string;
  status: 'low' | 'normal' | 'high';
}

export interface Zone {
  label: string;        // e.g. "Optimal", "Borderline High", "Very High"
  min: number | null;   // null = no lower bound
  max: number | null;   // null = no upper bound
}

export interface MarkerInterpretation {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'low' | 'high';
  severity: 'Mild' | 'Moderate' | 'Needs attention';
  zones: Zone[] | null;  // named clinical zones if available, null if only simple range
  whatItIs: string;
  whatItMeans: string;
  lifestyle: string[];
  doctorQuestions: string[];
  reassurance: string;
}

export interface OverallSummary {
  highLevel: string;
  focusAreas: string[];
  reassurance: string;
}

export interface SmartTip {
  insight: string;
  meaning: string;
  action: string;
  doctorPrompt: string;
}

export interface InterpretationResult {
  patientName: string;
  reportDate: string;        // ISO date string extracted from report, e.g. "2026-03-15"
  abnormalMarkers: MarkerInterpretation[];
  normalMarkerNames: string[];
  summary: OverallSummary;
  smartTip: SmartTip | null;
}

export interface HistoryRecord {
  id: string;                // uuid-like, generated server-side
  savedAt: string;           // ISO datetime of when it was saved
  patientName: string;
  reportDate: string;
  abnormalMarkers: Pick<MarkerInterpretation, 'name' | 'status' | 'severity' | 'value' | 'unit' | 'zones' | 'referenceRange'>[];
  normalMarkerNames: string[];
  summary: OverallSummary;
  smartTip: SmartTip | null;
  pdfId?: string;            // filename stored in data/uploads/, if PDF was uploaded
  pdfOriginalName?: string;  // original filename for download
}
