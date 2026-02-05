import { createZip } from '@/lib/export/simpleZip';

function xmlEscape(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colName(n: number) {
  // 1 -> A
  let x = n;
  let s = '';
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

type Cell = string | number | null | undefined;

function sheetXml(rows: Cell[][], sharedStrings: Map<string, number>) {
  const sheetRows: string[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const cells: string[] = [];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (v === null || v === undefined || v === '') continue;
      const ref = `${colName(c + 1)}${r + 1}`;
      if (typeof v === 'number' && Number.isFinite(v)) {
        cells.push(`<c r="${ref}"><v>${v}</v></c>`);
      } else {
        const key = String(v);
        let idx = sharedStrings.get(key);
        if (idx === undefined) {
          idx = sharedStrings.size;
          sharedStrings.set(key, idx);
        }
        cells.push(`<c r="${ref}" t="s"><v>${idx}</v></c>`);
      }
    }
    sheetRows.push(`<row r="${r + 1}">${cells.join('')}</row>`);
  }

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${sheetRows.join('')}</sheetData>` +
    `</worksheet>`
  );
}

export function buildXlsx(params: {
  sheets: Array<{ name: string; rows: Cell[][] }>;
}): Buffer {
  const sharedStrings = new Map<string, number>();
  const sheetFiles: Array<{ path: string; data: Uint8Array }> = [];

  const sheetsXml = params.sheets.map((s, i) => {
    const relId = `rId${i + 1}`;
    return { name: s.name, sheetId: i + 1, relId };
  });

  for (let i = 0; i < params.sheets.length; i++) {
    const xml = sheetXml(params.sheets[i].rows, sharedStrings);
    sheetFiles.push({ path: `xl/worksheets/sheet${i + 1}.xml`, data: Buffer.from(xml, 'utf8') });
  }

  const sstItems = Array.from(sharedStrings.keys())
    .map((s) => `<si><t>${xmlEscape(s)}</t></si>`)
    .join('');

  const sharedStringsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.size}" uniqueCount="${sharedStrings.size}">` +
    `${sstItems}</sst>`;

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>` +
    sheetsXml
      .map((s) => `<sheet name="${xmlEscape(s.name)}" sheetId="${s.sheetId}" r:id="${s.relId}"/>`)
      .join('') +
    `</sheets>` +
    `</workbook>`;

  const workbookRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheetsXml
      .map(
        (s) =>
          `<Relationship Id="${s.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.sheetId}.xml"/>`
      )
      .join('') +
    `<Relationship Id="rIdSharedStrings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
    `</Relationships>`;

  const rootRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const contentTypesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
    sheetsXml
      .map(
        (s) =>
          `<Override PartName="/xl/worksheets/sheet${s.sheetId}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('') +
    `</Types>`;

  const files = [
    { path: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf8') },
    { path: '_rels/.rels', data: Buffer.from(rootRelsXml, 'utf8') },
    { path: 'xl/workbook.xml', data: Buffer.from(workbookXml, 'utf8') },
    { path: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRelsXml, 'utf8') },
    { path: 'xl/sharedStrings.xml', data: Buffer.from(sharedStringsXml, 'utf8') },
    ...sheetFiles,
  ];

  return createZip(files);
}


