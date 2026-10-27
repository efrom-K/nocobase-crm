// «Планирование» на дашборде: посуточное начисление и цена по «Дополнительным расчётам». Запуск: node tests/plan.test.js (идёт в CI)
const fs=require('fs'); const src=fs.readFileSync(require('path').join(__dirname, '../src/dashboard.js'),'utf8');
const grab=n=>{const i=src.indexOf('function '+n+'('); let d=0,j=src.indexOf('{',i); for(let k=j;;k++){if(src[k]=='{')d++; if(src[k]=='}'&&--d==0) return src.slice(i,k+1);} };
eval(['dKop','dDate','dDateTxt','dDateIso','planLinesArea','planMul','planPrice','planContractMonth'].map(grab).join('\n'));
const assert=require('assert');
const oct={dim:31,iso:d=>'2026-10-'+('0'+d).slice(-2)}, nov={dim:30,iso:d=>'2026-11-'+('0'+d).slice(-2)};
// въезд 15-го: 17/31 от 100 000
let r={date_act:'2026-10-15',rent_amount:100000,utility_amount:null};
let m=planContractMonth(r,'active',[],oct); assert.strictEqual(m.rent,Math.round(10000000*17/31)); assert.strictEqual(m.days,17); assert.strictEqual(m.note,'с 15.10.2026');
// полный месяц
m=planContractMonth(r,'active',[],nov); assert.strictEqual(m.total,10000000); assert.strictEqual(m.note,'');
// расторжение 15.10 (архив)
m=planContractMonth({date_act:'2026-02-01',termination_date:'2026-10-15',rent_amount:53760,utility_amount:6720},'completed',[],oct); assert.strictEqual(m.days,15); assert.strictEqual(m.total,Math.round(5376000*15/31)+Math.round(672000*15/31));
// доп. расчёт: с 11.11 цена 200 000 (fixed), до этого основная 100 000
const per=[{date_from:'2026-11-11',date_to:'2099-12-31',basis:'fixed',amount:200000,rent_on:true,unit:'month'}];
m=planContractMonth({date_act:'2025-01-01',base_rent_amount:100000,rent_amount:200000},'active',per,nov);
assert.strictEqual(m.rent,Math.round((10*10000000+20*20000000)/30)); assert.strictEqual(m.note,'доп. расчёт');
// ставка за м²
m=planContractMonth({date_act:'2025-01-01',base_area_sqm:10,base_rent_amount:0},'active',[{date_from:'2026-11-01',date_to:'2026-11-30',basis:'per_sqm',amount:500,unit:'month'}],nov); assert.strictEqual(m.rent,500000);
assert.strictEqual(planContractMonth({date_act:'2026-12-01',rent_amount:1},'active',[],nov),null);
console.log('ok');
