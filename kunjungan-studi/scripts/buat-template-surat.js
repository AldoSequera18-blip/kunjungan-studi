// Membuat public/template/Template-Surat-Kunjungan.docx tanpa dependensi tambahan.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zip(files) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.from(text, "utf8");
    const comp = zlib.deflateRawSync(data);
    const nm = Buffer.from(name);
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    locals.push(lh, nm, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(offset, 42);
    central.push(ch, nm);
    offset += lh.length + nm.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const p = (t = "", o = {}) =>
  `<w:p><w:pPr><w:jc w:val="${o.jc || "left"}"/><w:spacing w:after="${o.after ?? 120}"/></w:pPr>` +
  (t ? `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.sz ? `<w:sz w:val="${o.sz}"/>` : ""}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>` : "") +
  `</w:p>`;

const body = [
  p("[KOP SURAT INSTANSI / SEKOLAH / KOMUNITAS]", { jc: "center", b: true, sz: 26 }),
  p("[Alamat lengkap, telepon, email]", { jc: "center", after: 360 }),
  p("Nomor\t: [nomor surat]", { after: 0 }),
  p("Lampiran\t: [jumlah lampiran / -]", { after: 0 }),
  p("Perihal\t: Permohonan Kunjungan Studi", { after: 240 }),
  p("Yth. Kepala Balai Layanan Perpustakaan DPAD DIY", { after: 0 }),
  p("di tempat", { after: 240 }),
  p("Dengan hormat,"),
  p("Sehubungan dengan kegiatan [nama kegiatan / program], kami yang bertanda tangan di bawah ini:"),
  p("Nama\t\t: [nama penanggung jawab]", { after: 0 }),
  p("Jabatan\t\t: [jabatan]", { after: 0 }),
  p("Instansi\t: [nama instansi]", { after: 0 }),
  p("No. Telepon\t: [nomor telepon]", { after: 240 }),
  p("mengajukan permohonan kunjungan studi ke Balai Layanan Perpustakaan DPAD DIY dengan rincian sebagai berikut:"),
  p("Nama Kelompok\t: [nama kelompok]", { after: 0 }),
  p("Jumlah Peserta\t: [jumlah] orang (termasuk pendamping)", { after: 0 }),
  p("Tanggal\t\t: [hari, tanggal bulan tahun]", { after: 0 }),
  p("Waktu\t\t: [jam mulai] – [jam selesai] WIB", { after: 0 }),
  p("Tujuan\t\t: [tujuan kunjungan]", { after: 240 }),
  p("Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami mengucapkan terima kasih.", { after: 480 }),
  p("[Kota], [tanggal surat]", { jc: "right", after: 0 }),
  p("Hormat kami,", { jc: "right", after: 960 }),
  p("[Nama penanggung jawab]", { jc: "right", b: true, after: 0 }),
  p("[Jabatan]", { jc: "right" }),
].join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`,
};

const out = path.join(__dirname, "..", "public", "template", "Template-Surat-Kunjungan.docx");
fs.writeFileSync(out, zip(files));
console.log("Dibuat:", out);
