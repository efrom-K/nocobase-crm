const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const navy = '#1c2d58';
const ink = '#1f2433';
const muted = '#5b6478';
const line = '#dfe3ec';
let brand;

function validContractPdf(input) {
  return !!input && typeof input.kind === 'string' && input.kind.length <= 60 &&
    Array.isArray(input.sections) && input.sections.length > 0 && input.sections.length <= 12 &&
    input.sections.every(section => section && typeof section.title === 'string' && section.title.length <= 120 &&
      Array.isArray(section.rows) && section.rows.length > 0 && section.rows.length <= 150 &&
      section.rows.every(row => Array.isArray(row) && row.length === 2 &&
        typeof row[0] === 'string' && row[0].length <= 160 &&
        typeof row[1] === 'string' && row[1].length <= 16000));
}

async function contractPdf(input) {
  if (!brand) {
    const dir = process.env.CONTRACT_PDF_BRAND_DIR || path.join(__dirname, 'brand');
    const mark = fs.readFileSync(path.join(dir, 'kn-mark.svg'), 'utf8');
    brand = { regular: path.join(dir, 'tilda-sans-regular.ttf'), semibold: path.join(dir, 'tilda-sans-semibold.ttf'),
      mark: mark.match(/<path[^>]* d="([^"]+)"/)[1] };
  }
  const pdf = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true,
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
    pdf.font('Semibold').fillColor(ink).fontSize(12).text('КОНСАЛТ НЕДВИЖИМОСТЬ', x + 42, 36, { lineBreak: false });
    pdf.font('Regular').fillColor(muted).fontSize(10).text('Управляющая компания', x + 42, 53, { lineBreak: false });
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
  pdf.end();
  return output;
}

module.exports = { validContractPdf, contractPdf };
