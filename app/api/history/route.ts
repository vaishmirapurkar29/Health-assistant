import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { HistoryRecord } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'history.json');
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

function readHistory(): HistoryRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    return [];
  }
}

function writeHistory(records: HistoryRecord[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export async function GET() {
  const records = readHistory();
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  let body: Omit<HistoryRecord, 'id' | 'savedAt'>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    patientName: body.patientName ?? 'Unknown',
    reportDate: body.reportDate ?? new Date().toISOString().slice(0, 10),
    abnormalMarkers: body.abnormalMarkers,
    normalMarkerNames: body.normalMarkerNames,
    summary: body.summary,
    smartTip: body.smartTip ?? null,
    pdfId: (body as { pdfId?: string }).pdfId,
    pdfOriginalName: (body as { pdfOriginalName?: string }).pdfOriginalName,
  };

  const records = readHistory();
  records.unshift(record); // newest first
  writeHistory(records);

  return NextResponse.json({ id: record.id });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const all = readHistory();
  const target = all.find((r) => r.id === id);
  if (target?.pdfId) {
    try { fs.unlinkSync(path.join(UPLOADS_DIR, target.pdfId)); } catch { /* already gone */ }
  }
  writeHistory(all.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
