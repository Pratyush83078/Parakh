import { NextResponse } from 'next/server';
import { realpath, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getProjectByCode } from '@/lib/dataEngine';

export const runtime = 'nodejs';

export async function GET(_request, context) {
  const { code } = await context.params;
  const project = getProjectByCode(code);
  if (!project?.source_pdf) {
    return NextResponse.json({ error: 'Source PDF is not recorded for this project.' }, { status: 404 });
  }

  try {
    const pdfRoot = await realpath(path.resolve(process.cwd(), 'data/pdfs'));
    const sourcePath = await realpath(project.source_pdf);
    const relativePath = path.relative(pdfRoot, sourcePath);
    if (!relativePath || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)
        || path.extname(sourcePath).toLowerCase() !== '.pdf') {
      return NextResponse.json({ error: 'Recorded source is outside the report directory.' }, { status: 403 });
    }

    const info = await stat(sourcePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: 'Source PDF is unavailable.' }, { status: 404 });
    }
    const filename = path.basename(sourcePath).replace(/[\r\n"\\]/g, '_');
    return new NextResponse(await readFile(sourcePath), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(info.size),
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Source PDF is unavailable.' }, { status: 404 });
  }
}
