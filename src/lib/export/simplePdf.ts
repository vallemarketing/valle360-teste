function pdfEscape(s: string) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildSimplePdf(params: { title: string; lines: string[] }): Buffer {
  // PDF básico: 1 página, fonte Helvetica, linhas de texto.
  const header = Buffer.from('%PDF-1.4\n', 'utf8');

  const objects: Buffer[] = [];
  const offsets: number[] = [];

  function addObject(content: string | Buffer) {
    const idx = objects.length + 1;
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const obj = Buffer.concat([Buffer.from(`${idx} 0 obj\n`, 'utf8'), body, Buffer.from('\nendobj\n', 'utf8')]);
    objects.push(obj);
    return idx;
  }

  const fontObj = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

  // Content stream
  const startY = 800;
  const lineH = 14;
  const marginX = 50;

  const allLines = [params.title, '', ...params.lines];
  const contentLines: string[] = [];
  contentLines.push('BT');
  contentLines.push(`/F1 12 Tf`);
  contentLines.push(`${marginX} ${startY} Td`);
  for (let i = 0; i < allLines.length; i++) {
    const line = pdfEscape(allLines[i] || '');
    if (i === 0) {
      contentLines.push(`(${line}) Tj`);
    } else {
      contentLines.push(`0 -${lineH} Td`);
      contentLines.push(`(${line}) Tj`);
    }
  }
  contentLines.push('ET');
  const contentStream = contentLines.join('\n');
  const contentBytes = Buffer.from(contentStream, 'utf8');

  const contentObj = addObject(
    Buffer.concat([
      Buffer.from(`<< /Length ${contentBytes.length} >>\nstream\n`, 'utf8'),
      contentBytes,
      Buffer.from('\nendstream', 'utf8'),
    ])
  );

  const pageObj = addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`
  );

  const pagesObj = addObject(`<< /Type /Pages /Count 1 /Kids [${pageObj} 0 R] >>`);
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  // Assemble with xref
  const parts: Buffer[] = [header];
  let cursor = header.length;

  offsets.push(0); // object 0
  for (const obj of objects) {
    offsets.push(cursor);
    parts.push(obj);
    cursor += obj.length;
  }

  const xrefStart = cursor;
  const xrefLines: string[] = [];
  xrefLines.push('xref');
  xrefLines.push(`0 ${objects.length + 1}`);
  xrefLines.push('0000000000 65535 f ');
  for (let i = 1; i < offsets.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `);
  }

  const trailer =
    `trailer\n` +
    `<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\n` +
    `startxref\n` +
    `${xrefStart}\n` +
    `%%EOF\n`;

  parts.push(Buffer.from(xrefLines.join('\n') + '\n' + trailer, 'utf8'));
  return Buffer.concat(parts);
}


