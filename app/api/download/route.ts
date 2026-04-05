import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pdfId = searchParams.get('id');
  const filename = searchParams.get('filename') ?? 'lab-report.pdf';

  if (!pdfId || pdfId.includes('..') || pdfId.includes('/')) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, pdfId);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
