// ===== Выгрузки в Excel — общий фрагмент: все кнопки «Выгрузить в Excel» в CRM собирают файл одинаково =====
// .xlsx собирается прямо в браузере (zip без сжатия + XML), без библиотек. Единый вид каждого листа:
//   строка 1 — название отчёта, строка 2 — когда, кто выгрузил и с какими фильтрами, строка 4 — заголовки (тёмно-синие, закреплены, с фильтром),
//   данные зеброй с форматами (₽, м², даты, %, дни), строка «Итого» формулами ПРОМЕЖУТОЧНЫЕ.ИТОГИ — пересчитывается при фильтре,
//   «в срок, %» — цветом (≥80 зелёный, ≥50 жёлтый, ниже — красный), печать — альбомная по ширине листа. Последний лист — «О выгрузке».
// Вызов: crmXlsx('Имя файла', { title: 'Заголовок отчёта', filters: [['Период', '30 дней']], notes: [['Колонка', 'что значит']],
//   sheets: [{ name: 'Лист', title?: 'заголовок листа', cols: [{ h: 'Объект', t: 'text', w?: 30 }, …], rows: [[…], …], total?: true }] })
// Типы колонок t: text, long (перенос строк), int, num, money (₽), area (м²), date ('ГГГГ-ММ-ДД' или Date), pct (число 0–100), days (0,0).
// В колонке можно задать total: 'sum' (по умолчанию для int/num/money/area), 'avg', число или текст; total: false — пусто.
const CRM_XLSX_T = ['text', 'long', 'int', 'num', 'money', 'area', 'date', 'pct', 'days'];
function crmXlsxBlob(spec) {
  const W = window, Enc = W.TextEncoder;
  const enc = Enc ? new Enc() : { encode: function(str) {   // запасной UTF-8, если в песочнице нет TextEncoder
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.codePointAt(i); if (c > 0xffff) i++;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return new Uint8Array(out);
  } };
  const x = function(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); };
  const col = function(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const serial = function(v) {   // дата → число Excel (сортируется и фильтруется как дата)
    if (v === null || v === undefined || v === '') return null;
    const m = v instanceof Date ? [0, v.getFullYear(), v.getMonth() + 1, v.getDate()] : /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    if (!m) return null;
    return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000;
  };
  const pad = function(n) { return ('0' + n).slice(-2); };
  const now = new Date(), stamp = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  const who = spec.user || (W.__crmRtc && W.__crmRtc.myName) || '';
  const filt = (spec.filters || []).filter(function(f) { return f && f[1] !== undefined && f[1] !== null && f[1] !== ''; });
  const sub = 'Выгружено ' + stamp + (who ? ' · ' + who : '') + (filt.length ? ' · ' + filt.map(function(f) { return f[0] + ': ' + f[1]; }).join(' · ') : '');

  // ---- стили: шрифты, заливки, рамки, числовые форматы; индекс стиля ячейки = 6 + тип*3 + (0 обычная | 1 зебра | 2 итог) ----
  const NUMFMT = { text: 0, long: 0, int: 164, num: 165, money: 166, area: 167, date: 168, pct: 169, days: 170 };
  const fonts = '<fonts count="6"><font><sz val="10.5"/><color rgb="FF1F1F1F"/><name val="Calibri"/></font><font><b/><sz val="10.5"/><color rgb="FF1F1F1F"/><name val="Calibri"/></font>'
    + '<font><b/><sz val="15"/><color rgb="FF1C2D58"/><name val="Calibri"/></font><font><sz val="9.5"/><color rgb="FF6B7280"/><name val="Calibri"/></font>'
    + '<font><b/><sz val="10.5"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FF1C2D58"/><name val="Calibri"/></font></fonts>';
  const fills = '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
    + '<fill><patternFill patternType="solid"><fgColor rgb="FF1C2D58"/><bgColor indexed="64"/></patternFill></fill>'
    + '<fill><patternFill patternType="solid"><fgColor rgb="FFF5F7FA"/><bgColor indexed="64"/></patternFill></fill>'
    + '<fill><patternFill patternType="solid"><fgColor rgb="FFE8ECF3"/><bgColor indexed="64"/></patternFill></fill></fills>';
  const thin = '<left style="thin"><color rgb="FFDDE2EA"/></left><right style="thin"><color rgb="FFDDE2EA"/></right><bottom style="thin"><color rgb="FFDDE2EA"/></bottom>';
  const borders = '<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>'
    + '<border>' + thin.replace('<bottom', '<top style="thin"><color rgb="FFDDE2EA"/></top><bottom') + '<diagonal/></border>'
    + '<border><left style="thin"><color rgb="FFDDE2EA"/></left><right style="thin"><color rgb="FFDDE2EA"/></right><top style="medium"><color rgb="FF1C2D58"/></top><bottom style="thin"><color rgb="FFDDE2EA"/></bottom><diagonal/></border></borders>';
  const numFmts = '<numFmts count="7"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="#,##0.00"/>'
    + '<numFmt numFmtId="166" formatCode="#,##0.00\\ &quot;₽&quot;"/><numFmt numFmtId="167" formatCode="#,##0.00\\ &quot;м²&quot;"/>'
    + '<numFmt numFmtId="168" formatCode="dd.mm.yyyy"/><numFmt numFmtId="169" formatCode="0%"/><numFmt numFmtId="170" formatCode="0.0"/></numFmts>';
  // 0 обычный, 1 заголовок отчёта, 2 подзаголовок, 3 шапка колонок, 4 текст «О выгрузке», 5 подзаголовок раздела
  let xfs = '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
    + '<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>';
  CRM_XLSX_T.forEach(function(t) {
    [[0, 0], [3, 0], [4, 2]].forEach(function(v, i) {   // [заливка, рамка]: обычная, зебра, итог
      const b = i === 2 ? 2 : 1, f = i === 2 ? 1 : 0;
      xfs += '<xf numFmtId="' + NUMFMT[t] + '" fontId="' + f + '" fillId="' + v[0] + '" borderId="' + b + '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">'
        + '<alignment vertical="' + (t === 'long' ? 'top' : 'center') + '"' + (t === 'long' ? ' wrapText="1"' : '') + (t === 'date' ? ' horizontal="center"' : '') + '/></xf>';
    });
  });
  const xfCount = 6 + CRM_XLSX_T.length * 3;
  const sid = function(t, v) { return 6 + CRM_XLSX_T.indexOf(CRM_XLSX_T.indexOf(t) === -1 ? 'text' : t) * 3 + v; };
  // условное форматирование «в срок, %»: зелёный / жёлтый / красный текст
  const dxfs = '<dxfs count="3"><dxf><font><b/><color rgb="FF389E0D"/></font></dxf><dxf><font><b/><color rgb="FFD48806"/></font></dxf><dxf><font><b/><color rgb="FFCF1322"/></font></dxf></dxfs>';
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + numFmts + fonts + fills + borders
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' + xfCount + '">' + xfs + '</cellXfs>'
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' + dxfs + '</styleSheet>';

  // ---- листы ----
  const sheets = (spec.sheets || []).filter(function(s) { return s && s.cols && s.cols.length; }).slice();
  const about = [['Отчёт', spec.title || ''], ['Выгружено', stamp]].concat(who ? [['Кто выгрузил', who]] : []).concat(filt.map(function(f) { return [f[0], String(f[1])]; }))
    .concat([['Листы', sheets.map(function(s) { return s.name + ' — ' + (s.rows || []).length + ' строк'; }).join('; ')]]);
  const usedNames = {};
  const sheetXml = function(sh) {
    const cols = sh.cols, n = cols.length, rows = sh.rows || [], last = col(n - 1);
    const H = 4, first = H + 1, end = H + rows.length;
    let out = '<row r="1" ht="22" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">' + x(sh.title || spec.title || sh.name) + '</t></is></c></row>'
      + '<row r="2"><c r="A2" t="inlineStr" s="2"><is><t xml:space="preserve">' + x(sub) + '</t></is></c></row>'
      + '<row r="' + H + '" ht="30" customHeight="1">' + cols.map(function(c, i) { return '<c r="' + col(i) + H + '" t="inlineStr" s="3"><is><t xml:space="preserve">' + x(c.h) + '</t></is></c>'; }).join('') + '</row>';
    rows.forEach(function(r, ri) {
      const R = first + ri, z = ri % 2;
      out += '<row r="' + R + '">' + cols.map(function(c, ci) {
        const t = c.t || 'text', ref = col(ci) + R, s = ' s="' + sid(t, z) + '"';
        let v = r[ci];
        if (t === 'date') v = serial(v);
        else if (t === 'pct' && typeof v === 'number') v = v / 100;
        if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '<c r="' + ref + '"' + s + '/>';
        return typeof v === 'number' ? '<c r="' + ref + '"' + s + '><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"' + s + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
      }).join('') + '</row>';
    });
    const hasTotal = sh.total && rows.length;
    if (hasTotal) {
      const R = end + 1;
      out += '<row r="' + R + '">' + cols.map(function(c, ci) {
        const t = c.t || 'text', ref = col(ci) + R, s = ' s="' + sid(t, 2) + '"', rng = col(ci) + first + ':' + col(ci) + end;
        const how = c.total !== undefined ? c.total : (['int', 'num', 'money', 'area'].indexOf(t) !== -1 ? 'sum' : (ci === 0 ? 'Итого' : false));
        // формула + готовое значение: Excel пересчитает при фильтре, а предпросмотр (почта, мессенджер, QuickLook) покажет сразу
        const nums = rows.map(function(r) { return r[ci]; }).filter(function(v) { return typeof v === 'number' && isFinite(v); });
        const sum = nums.reduce(function(a, v) { return a + v; }, 0);
        if (how === 'sum') return '<c r="' + ref + '"' + s + '><f>SUBTOTAL(109,' + rng + ')</f><v>' + Math.round(sum * 100) / 100 + '</v></c>';
        if (how === 'avg') return nums.length ? '<c r="' + ref + '"' + s + '><f>IFERROR(SUBTOTAL(101,' + rng + '),"")</f><v>' + Math.round(sum / nums.length * 100) / 100 + '</v></c>' : '<c r="' + ref + '"' + s + '/>';
        if (typeof how === 'number') return '<c r="' + ref + '"' + s + '><v>' + (t === 'pct' ? how / 100 : how) + '</v></c>';
        if (typeof how === 'string') return '<c r="' + ref + '" t="inlineStr"' + s + '><is><t xml:space="preserve">' + x(how) + '</t></is></c>';
        return '<c r="' + ref + '"' + s + '/>';
      }).join('') + '</row>';
    }
    const widths = cols.map(function(c, ci) {
      if (c.w) return c.w;
      const lens = rows.slice(0, 300).map(function(r) { const v = r[ci]; return v === null || v === undefined ? 0 : c.t === 'money' || c.t === 'area' ? String(Math.round(Number(v) || 0)).length + 7 : c.t === 'date' ? 10 : String(v).length; });
      return Math.min(c.t === 'long' ? 60 : 45, Math.max(9, Math.ceil(String(c.h).length * 0.8), Math.max.apply(null, lens.concat([0])) + 2));
    });
    let cf = '', pr = 1;
    cols.forEach(function(c, ci) {
      if (c.t !== 'pct' || !rows.length) return;
      const rng = col(ci) + first + ':' + col(ci) + (end + (hasTotal ? 1 : 0)), a = col(ci) + first;
      cf += '<conditionalFormatting sqref="' + rng + '"><cfRule type="expression" dxfId="0" priority="' + (pr++) + '"><formula>AND(ISNUMBER(' + a + '),' + a + '&gt;=0.8)</formula></cfRule>'
        + '<cfRule type="expression" dxfId="1" priority="' + (pr++) + '"><formula>AND(ISNUMBER(' + a + '),' + a + '&gt;=0.5,' + a + '&lt;0.8)</formula></cfRule>'
        + '<cfRule type="expression" dxfId="2" priority="' + (pr++) + '"><formula>AND(ISNUMBER(' + a + '),' + a + '&lt;0.5)</formula></cfRule></conditionalFormatting>';
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:' + last + Math.max(H, end + (hasTotal ? 1 : 0)) + '"/>'
      + '<sheetViews><sheetView workbookViewId="0" zoomScale="100"><pane ' + (sh.freezeCols ? 'xSplit="' + sh.freezeCols + '" ' : '') + 'ySplit="' + H + '" topLeftCell="' + col(sh.freezeCols || 0) + first + '" activePane="' + (sh.freezeCols ? 'bottomRight' : 'bottomLeft') + '" state="frozen"/></sheetView></sheetViews>'
      + '<sheetFormatPr defaultRowHeight="16"/><cols>' + widths.map(function(w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>'
      + '<sheetData>' + out + '</sheetData>'
      + (rows.length ? '<autoFilter ref="A' + H + ':' + last + end + '"/>' : '')
      + '<mergeCells count="2"><mergeCell ref="A1:' + (n > 1 ? last : 'B') + '1"/><mergeCell ref="A2:' + (n > 1 ? last : 'B') + '2"/></mergeCells>' + cf
      + '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
  };
  const aboutXml = function() {
    let r = 1, out = '<row r="' + (r++) + '" ht="22" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t>О выгрузке</t></is></c></row>';
    const line = function(a, b, sa) { out += '<row r="' + r + '"><c r="A' + r + '" t="inlineStr" s="' + (sa || 0) + '"><is><t xml:space="preserve">' + x(a) + '</t></is></c>' + (b !== undefined ? '<c r="B' + r + '" t="inlineStr" s="4"><is><t xml:space="preserve">' + x(b) + '</t></is></c>' : '') + '</row>'; r++; };
    r++;
    about.forEach(function(a) { line(a[0], a[1]); });
    if ((spec.notes || []).length) { r++; line('Что значат колонки', undefined, 5); spec.notes.forEach(function(nt) { line(nt[0], nt[1]); }); }
    r++; line('Как читать', undefined, 5);
    line('Итого', 'Строка «Итого» считается формулой и пересчитывается, если отфильтровать таблицу (стрелки в заголовках).');
    line('Источник', 'CRM «Консалт Недвижимость» — те же данные и правила подсчёта, что на экране.');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/></cols><sheetData>' + out + '</sheetData></worksheet>';
  };
  const all = sheets.map(function(s) {
    let nm = String(s.name || 'Лист').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    while (usedNames[nm]) nm = nm.slice(0, 28) + ' ' + (Object.keys(usedNames).length + 1);
    usedNames[nm] = 1;
    return { name: nm, xml: sheetXml(s) };
  }).concat([{ name: 'О выгрузке', xml: aboutXml() }]);

  const files = [];
  files.push(['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + all.map(function(s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>']);
  files.push(['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>']);
  files.push(['docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + x(spec.title || '') + '</dc:title><dc:creator>' + x(who || 'CRM') + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now.toISOString().slice(0, 19) + 'Z</dcterms:created></cp:coreProperties>']);
  files.push(['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>'
    + all.map(function(s, i) { return '<sheet name="' + x(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>'
    + '<definedNames>' + all.slice(0, -1).map(function(s, i) { return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(s.name).replace(/'/g, "''") + '\'!$A$4:$' + col(sheets[i].cols.length - 1) + '$' + (4 + (sheets[i].rows || []).length) + '</definedName><definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">\'' + x(s.name).replace(/'/g, "''") + '\'!$4:$4</definedName>'; }).join('') + '</definedNames>'
    + '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>']);
  files.push(['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + all.map(function(s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('')
    + '<Relationship Id="rId' + (all.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
  files.push(['xl/styles.xml', styles]);
  all.forEach(function(s, i) { files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', s.xml]); });

  // zip (метод store): локальные заголовки + центральный каталог
  const crcT = []; for (let k = 0; k < 256; k++) { let c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[k] = c >>> 0; }
  const crc = function(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const parts = [], central = []; let off = 0;
  files.forEach(function(f) {
    const name = enc.encode(f[0]), data = enc.encode(f[1]), c = crc(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(14, c, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const d = new DataView(new ArrayBuffer(46));
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x0800, true);
    d.setUint32(16, c, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, name.length, true); d.setUint32(42, off, true);
    central.push(new Uint8Array(d.buffer), name);
    off += 30 + name.length + data.length;
  });
  const cdSize = central.reduce(function(s, b) { return s + b.length; }, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
// собрать и скачать: имя файла получает дату выгрузки
function crmXlsx(fileName, spec) {
  const t = new Date(), d = ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + t.getFullYear();
  const blob = crmXlsxBlob(spec), a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = String(fileName).replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' ' + d + '.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 3000);
}
// ===== конец фрагмента выгрузок =====
