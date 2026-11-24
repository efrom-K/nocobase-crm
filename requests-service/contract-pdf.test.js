const assert = require('node:assert/strict');
const test = require('node:test');
process.env.CONTRACT_PDF_BRAND_DIR = require('node:path').join(__dirname, '..', 'brand');
const { contractPdf, validContractPdf } = require('./contract-pdf');

test('validates the input and embeds Cyrillic text across A4 pages', async () => {
  const input = {
    kind: 'Активный договор',
    sections: [{ title: 'Данные по договору', rows: [
      ['Номер договора', 'ТЕСТ-123'],
      ['Площадь и арендная плата', '125,50 м² · 1 200,00 ₽'],
      ['Особые условия', 'Примечание с кириллицей. '.repeat(350)]
    ] }]
  };
  assert.equal(validContractPdf(input), true);
  assert.equal(validContractPdf({ ...input, sections: [{ title: 'Данные', rows: [['Номер', 42]] }] }), false);
  const pdf = (await contractPdf(input)).toString('latin1');
  assert.match(pdf, /^%PDF-/);
  assert.match(pdf, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(pdf, /\/Count [2-9]/);
  assert.match(pdf, /\/ToUnicode/);
});

test('keeps the complete contents of same-named attachments and rejects a truncated upload', async () => {
  const { parseContractPdf } = require('./contract-pdf');
  const one = Buffer.from([0, 10, 255, 12]);
  const two = Buffer.from('Синтетическое приложение');
  const input = {
    kind: 'Договор в архиве',
    sections: [{ title: 'Файлы договора', rows: [['Файл', 'Приложение.txt']] }],
    attachments: [one, two].map(file => ({name:'Приложение.txt',size:file.length}))
  };
  const body = Buffer.concat([Buffer.from(JSON.stringify(input) + '\n'), one, two]);
  assert.equal(parseContractPdf(body.subarray(0, -1)), null);
  const payload = parseContractPdf(body);
  assert.deepEqual([...payload.files], [['Приложение.txt', one], ['Приложение (2).txt', two]]);
  const pdf = (await contractPdf(payload.input, payload.files)).toString('latin1');
  assert.match(pdf, /\/EmbeddedFiles/);
  assert.equal((pdf.match(/\/Type \/EmbeddedFile\b/g) || []).length, 2);
});
