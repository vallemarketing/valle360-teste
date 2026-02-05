import { crc32 } from '@/lib/export/crc32';

type ZipFile = { path: string; data: Uint8Array };

function u16(n: number) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n & 0xffff, 0);
  return b;
}

function u32(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

export function createZip(files: ZipFile[]): Buffer {
  // ZIP "store" (no compression) para manter simples e sem deps
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];

  let offset = 0;

  for (const f of files) {
    const filename = Buffer.from(f.path, 'utf8');
    const data = Buffer.from(f.data);
    const crc = crc32(data);
    const size = data.length;

    // Local file header
    const localHeader = Buffer.concat([
      u32(0x04034b50), // signature
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression method 0 = store
      u16(0), // mod time
      u16(0), // mod date
      u32(crc),
      u32(size),
      u32(size),
      u16(filename.length),
      u16(0), // extra len
      filename,
    ]);

    localParts.push(localHeader, data);

    // Central directory header
    const centralHeader = Buffer.concat([
      u32(0x02014b50), // signature
      u16(20), // version made by
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression method
      u16(0), // mod time
      u16(0), // mod date
      u32(crc),
      u32(size),
      u32(size),
      u16(filename.length),
      u16(0), // extra len
      u16(0), // comment len
      u16(0), // disk start
      u16(0), // int attrs
      u32(0), // ext attrs
      u32(offset), // local header offset
      filename,
    ]);

    centralParts.push(centralHeader);

    offset += localHeader.length + size;
  }

  const centralDir = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  const centralOffset = localData.length;

  const end = Buffer.concat([
    u32(0x06054b50), // end of central dir signature
    u16(0), // disk number
    u16(0), // disk where central dir starts
    u16(files.length), // entries on this disk
    u16(files.length), // total entries
    u32(centralDir.length), // central dir size
    u32(centralOffset), // central dir offset
    u16(0), // comment len
  ]);

  return Buffer.concat([localData, centralDir, end]);
}


