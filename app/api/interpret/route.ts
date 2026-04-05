import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import type { InterpretationResult, HistoryRecord } from '@/lib/types';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');

// Compact history summary for SmartTip trend analysis
function buildHistoryContext(): string {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return '';
    const records = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')) as HistoryRecord[];
    if (records.length === 0) return '';
    const lines = records.map(r => {
      const markers = r.abnormalMarkers
        .map(m => `${m.name}=${m.value}${m.unit}(${m.status})`)
        .join(', ');
      return `${r.patientName} | ${r.reportDate} | ${markers}`;
    });
    return 'PRIOR LAB HISTORY:\n' + lines.join('\n');
  } catch {
    return '';
  }
}

const SYSTEM_PROMPT = `You are a health information assistant that interprets lab results in plain, supportive, non-diagnostic language.

STRICT RULES:
- Never diagnose any condition
- Never recommend medications or supplements as prescriptions
- Use language like "may indicate", "associated with", "may help improve", "you may want to ask your doctor"
- Never say "you have [condition]", "this means you will", or "you should take [medication]"
- No clinical treatment recommendations

Interpret ALL markers found in the report — not just a fixed list. Common examples include cholesterol (LDL, HDL, Total, Triglycerides), glucose, A1C, TSH, Vitamin D, B12, Iron, Ferritin, liver enzymes (ALT, AST, ALP, Bilirubin), kidney markers (Creatinine, BUN, eGFR), blood counts (WBC, RBC, Hemoglobin, Hematocrit, Platelets), electrolytes (Sodium, Potassium, Chloride, CO2), Albumin, Calcium, and any others present.

Severity guide (based on how far value deviates from reference range):
- Mild: slightly outside range (~10–15% deviation)
- Moderate: notably outside (~15–30% deviation)
- Needs attention: significantly outside (>30% deviation or clinically meaningful)

For each abnormal marker (status: low or high), generate:
- whatItIs: 1–2 plain-language sentences, no jargon without explanation
- whatItMeans: personalized relative interpretation using "slightly elevated", "below range", etc.
- lifestyle: 2–4 practical non-medical suggestions (diet, exercise, sleep, sunlight, general habits only — no medications or supplements prescribed)
- doctorQuestions: 2–3 concise questions to ask a doctor
- reassurance: one short calm, non-alarmist statement that normalizes the finding

Overall summary must be very concise (2–3 sentences total across all fields).

Smart Tip: Only include if historical (previous) markers are provided AND there is a meaningful pattern (same marker worsening, related markers forming a cluster). If no previous data or no clear pattern, output null.

Also extract:
- patientName: full name of the patient from the report header (use "Unknown" if not found)
- reportDate: date of the lab report in YYYY-MM-DD format (use today's date if not found)

For each abnormal marker, also extract clinical zones if they are printed in the report (e.g. "< 100 Optimal", "100–129 Near Optimal", "130–159 Borderline High", "160–189 High", ">= 190 Very High"). If no named zones exist, set zones to null.

CRITICAL for zones ordering: Always output zones ordered from BEST/healthiest to WORST/most concerning, regardless of numeric direction. For markers where higher is better (e.g. HDL cholesterol, Vitamin D), the zone with the highest numeric values is the best zone and must come first. For markers where lower is better (e.g. LDL, Total Cholesterol, Triglycerides, Glucose), the zone with the lowest numeric values is the best zone and must come first. The first zone in the array must always be the healthiest/optimal zone.

Return valid JSON only. No markdown fences. Exact schema:
{
  "patientName": "string",
  "reportDate": "YYYY-MM-DD",
  "abnormalMarkers": [
    {
      "name": "string",
      "value": "string",
      "unit": "string",
      "referenceRange": "string",
      "status": "high" | "low",
      "severity": "Mild" | "Moderate" | "Needs attention",
      "zones": null | [{"label": "Optimal", "min": null, "max": 100}, {"label": "Borderline High", "min": 100, "max": 130}, {"label": "High", "min": 130, "max": null}],
      "whatItIs": "string",
      "whatItMeans": "string",
      "lifestyle": ["string", "string"],
      "doctorQuestions": ["string", "string"],
      "reassurance": "string"
    }
  ],
  "normalMarkerNames": ["string"],
  "summary": {
    "highLevel": "string",
    "focusAreas": ["string"],
    "reassurance": "string"
  },
  "smartTip": null | {
    "insight": "string",
    "meaning": "string",
    "action": "string",
    "doctorPrompt": "string"
  }
}`;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const pdfFile = formData.get('pdf') as File | null;

  if (!pdfFile) {
    return NextResponse.json({ error: 'No PDF provided.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const base64 = buffer.toString('base64');

    let savedPdfId: string | undefined;
    let savedPdfOriginalName: string | undefined;

    // Save PDF to disk for history download
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const pdfId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      fs.writeFileSync(path.join(UPLOADS_DIR, pdfId), buffer);
      savedPdfId = pdfId;
      savedPdfOriginalName = pdfFile.name;
    } catch {
      // Non-fatal — proceed without saving
    }

    const historyContext = buildHistoryContext();
    const historyNote = historyContext
      ? `\n\n${historyContext}\n\nIf the patient in this report matches a patient in the history above AND there is a meaningful trend (a marker worsening or improving across reports, or related markers forming a pattern), generate a SmartTip describing that trend. Otherwise set smartTip to null.`
      : '\n\nNo prior history available. Set smartTip to null.';

    const userContent: Anthropic.ContentBlockParam[] = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as Anthropic.ContentBlockParam,
      {
        type: 'text',
        text: `Extract and interpret all lab markers from this report. Return the full JSON interpretation.${historyNote}`,
      },
    ];

    // PDF document blocks require the beta API
    const response = await client.beta.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: userContent }],
      betas: ['pdfs-2024-09-25'],
    });

    const firstBlock = response.content[0] as { type: string; text?: string };
    const raw = firstBlock.type === 'text' ? (firstBlock.text ?? '').trim() : '';
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let result: InterpretationResult;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Claude response (length=' + cleaned.length + ', stop_reason=' + response.stop_reason + '):', cleaned.slice(-300));
      const hint = response.stop_reason === 'max_tokens' ? ' Response was too long — try again.' : '';
      return NextResponse.json({ error: 'Could not parse interpretation.' + hint + ' Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ...result, pdfId: savedPdfId, pdfOriginalName: savedPdfOriginalName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Interpret error:', err);
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 });
  }
}
