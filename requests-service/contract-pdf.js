const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const navy = '#1c2d58';
const ink = '#1f2433';
const muted = '#5b6478';
const line = '#dfe3ec';
let brand;
const MAX_CONTRACT_PDF_BYTES = 25 * 1024 * 1024;
const MAX_CONTRACT_PDF_METADATA_BYTES = 2 * 1024 * 1024;

function validContractPdf(input) {
  return !!input && typeof input.kind === 'string' && input.kind.length <= 60 &&
    Array.isArray(input.sections) && input.sections.length > 0 && input.sections.length <= 24 &&
    input.sections.every(section => section && typeof section.title === 'string' && section.title.length <= 120 &&
      Array.isArray(section.rows) && section.rows.length > 0 && section.rows.length <= 10000 &&
      section.rows.every(row => Array.isArray(row) && row.length === 2 &&
        typeof row[0] === 'string' && row[0].length <= 160 &&
        typeof row[1] === 'string' && row[1].length <= MAX_CONTRACT_PDF_METADATA_BYTES));
}

// The UTF-8 JSON header is followed by the original binary files in manifest order.
function parseContractPdf(body) {
  const newline = body.indexOf(10);
  if (newline < 0 || newline > MAX_CONTRACT_PDF_METADATA_BYTES) return null;
  let input;
  try { input = JSON.parse(body.subarray(0, newline).toString('utf8')); } catch { return null; }
  if (!validContractPdf(input) || !Array.isArray(input.attachments) || input.attachments.length > 1000) return null;
  let start = newline + 1;
  const files = new Map();
  for (const entry of input.attachments) {
    if (!entry || typeof entry.name !== 'string' || !entry.name || entry.name.length > 512 ||
        !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > body.length - start) return null;
    // PDF readers use one entry per name. Preserve every file when names coincide.
    const clean = entry.name.replace(/[\\/:\x00-\x1f\x7f]/g, '_');
    const name = clean in Object.prototype ? 'Вложение ' + clean : clean;
    let unique = name;
    for (let n = 2; files.has(unique); n++) {
      const extension = path.extname(name);
      unique = name.slice(0, name.length - extension.length) + ' (' + n + ')' + extension;
    }
    files.set(unique, body.subarray(start, start + entry.size));
    start += entry.size;
  }
  return start === body.length ? { input, files } : null;
}

async function contractPdf(input, files = new Map()) {
  if (!brand) {
    const dir = process.env.CONTRACT_PDF_BRAND_DIR || path.join(__dirname, 'brand');
    const mark = fs.readFileSync(path.join(dir, 'kn-mark.svg'), 'utf8');
    brand = { regular: path.join(dir, 'tilda-sans-regular.ttf'), semibold: path.join(dir, 'tilda-sans-semibold.ttf'),
      mark: mark.match(/<path[^>]* d="([^"]+)"/)[1] };
  }
  const pdf = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true, pdfVersion: '1.7',
    info: { Title: 'Карточка договора', Author: 'Консалт Недвижимость' } });
  const chunks = [];
  const output = new Promise((resolve, reject) => {
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
  pdf.registerFont('Regular', brand.regular).registerFont('Semibold', brand.semibold).font('Regular');
  const x = pdf.page.margins.left;
  const width = pdf.page.width - x * 2;
  const labelWidth = 170;
  const bottom = pdf.page.height - pdf.page.margins.bottom;

  function header() {
    pdf.save().translate(x, 36).scale(0.32).rect(0, 0, 100, 100).fill(navy).path(brand.mark).fill('#ffffff').restore();
    pdf.font('Semibold').fillColor(ink).fontSize(12).text('КОНСАЛТ НЕДВИЖИМОСТЬ', x + 42, 45, { lineBreak: false });
    pdf.font('Regular');
    pdf.moveTo(x, 81).lineTo(x + width, 81).strokeColor(line).stroke();
    pdf.x = x;
    pdf.y = 100;
    pdf.fillColor(ink).fontSize(11);
  }
  pdf.on('pageAdded', header);
  header();
  pdf.font('Semibold').fillColor(navy).fontSize(25).text('Карточка договора', x, pdf.y, { width });
  pdf.font('Regular').fillColor(muted).fontSize(11).text(input.kind, { width });
  pdf.moveDown(1.2);

  const labelOptions = { width: labelWidth - 16 };
  const valueOptions = { width: width - labelWidth - 8, features: ['tnum'] };
  function rowHeight([label, value]) {
    const labelHeight = pdf.fontSize(10).heightOfString(label, labelOptions);
    return Math.max(labelHeight, pdf.fontSize(11).heightOfString(value, valueOptions)) + 10;
  }

  for (const section of input.sections) {
    if (pdf.y + 30 + Math.min(rowHeight(section.rows[0]), bottom - 130) > bottom) pdf.addPage();
    const y = pdf.y;
    pdf.rect(x, y, width, 25).fill('#eef2f9');
    pdf.font('Semibold').fillColor(navy).fontSize(12).text(section.title, x + 8, y + 5, { width: width - 16, lineBreak: false });
    pdf.font('Regular');
    pdf.y = y + 30;

    for (const row of section.rows) {
      const [label, value] = row;
      const height = rowHeight(row);
      if (pdf.y + (height <= bottom - 130 ? height : 40) > bottom) pdf.addPage();
      const rowY = pdf.y;
      pdf.fillColor(muted).fontSize(10).text(label, x + 8, rowY + 3, labelOptions);
      const labelEnd = pdf.y;
      const startPage = pdf.page;
      pdf.fillColor(ink).fontSize(11).text(value, x + labelWidth, rowY + 3, valueOptions);
      if (pdf.page === startPage) pdf.y = Math.max(pdf.y, labelEnd);
      pdf.moveTo(x, pdf.y + 3).lineTo(x + width, pdf.y + 3).strokeColor(line).stroke();
      pdf.y += 7;
    }
    pdf.y += 12;
  }

  const pages = pdf.bufferedPageRange().count;
  const date = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' }).format();
  for (let i = 0; i < pages; i++) {
    pdf.switchToPage(i);
    pdf.fillColor(muted).fontSize(9).text('Выгружено из CRM · ' + date, x, bottom + 14, { lineBreak: false });
    const pageNumber = `${i + 1} / ${pages}`;
    pdf.text(pageNumber, x + width - pdf.widthOfString(pageNumber), bottom + 14, { lineBreak: false });
  }
  for (const [name, bytes] of files) pdf.file(bytes, { name, relationship: 'Supplement' });
  pdf.end();
  return output;
}

module.exports = { validContractPdf, contractPdf, parseContractPdf, MAX_CONTRACT_PDF_BYTES, MAX_CONTRACT_PDF_METADATA_BYTES };
