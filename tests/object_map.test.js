const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let listener;
const state = { screen: 'map', mapChannel: 'test-channel', q: '', objs: [
  { id: 1, name: 'North', map_location: { address: 'First street', lat: 55, lon: 37 } },
  { id: 2, name: 'South', map_location: null }
] };
const context = vm.createContext({ op: state, window: { addEventListener: (type, fn) => { listener = fn; } }, opRoot: () => ({ isConnected: true }) });
vm.runInContext(fs.readFileSync('src/_crm-object-map.js', 'utf8'), context);
assert.equal(context.opLocated(state.objs[0]), true);
for (const map_location of [null, {}, { lat: null, lon: 0 }, { lat: '55', lon: 37 }, { lat: 91, lon: 0 }, { lat: 0, lon: -181 }, { lat: NaN, lon: 0 }]) {
  assert.equal(context.opLocated({ map_location }), false);
}
assert.equal(context.opLocated({ map_location: { lat: 0, lon: 0 } }), true);
state.q = 'FIRST'; assert.equal(context.opMapObjects()[0].id, 1);
state.q = 'south'; assert.equal(context.opMapObjects()[0].id, 2);
state.q = 'missing'; assert.equal(context.opMapObjects().length, 0);
state.q = '';
let selected;
context.opSelectObject = id => { selected = id; };
const message = { type: 'crm-object-map-select', channel: state.mapChannel, id: 1 };
listener({ origin: 'https://untrusted.example', data: message }); assert.equal(selected, undefined);
listener({ origin: 'null', data: { ...message, channel: 'wrong' } }); assert.equal(selected, undefined);
listener({ origin: 'null', data: { ...message, id: 2 } }); assert.equal(selected, undefined);
listener({ origin: 'null', data: { ...message, id: 999 } }); assert.equal(selected, undefined);
listener({ origin: 'null', data: message }); assert.equal(selected, 1);
state.q = 'south'; selected = undefined;
listener({ origin: 'null', data: message }); assert.equal(selected, undefined);
const html = context.opMapDoc([{ id: 1, name: '</script><img src=x onerror=alert(1)>', lat: 0, lon: 0 }], 'test');
assert(!html.includes('</script><img'));
assert(html.includes('\\u003c/script>'));
assert(html.includes('integrity="sha256-'));
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
new vm.Script(scripts[0][1]);
console.log('Object map: coordinates, address search, message boundaries and frame escaping passed');
(async function() {
  context.location = {port:''}; context.localStorage = {getItem:()=>''};
  context.opRoutePanel = ()=>{}; context.opRouteDraw = ()=>{};
  state.routeFrom=1;state.routeTo=2;
  let complete, calls=0;
  context.fetch=async(url, options)=>{
    calls++;assert.equal(url,'/rqsvc/object-route');
    assert.deepEqual(JSON.parse(options.body),{from:1,to:2});
    return new Promise(resolve=>{complete=resolve;});
  };
  const pending=context.opRouteBuild();
  assert.equal(state.routeBusy,true);
  context.opRouteReset();
  complete({ok:true,json:async()=>({distance:1000,duration:120,geometry:{type:'LineString'}})});
  await pending;
  assert.equal(state.routeResult,null,'Cancelled request cannot restore an old route');
  assert.equal(state.routeBusy,false);
  context.fetch=async()=>({ok:true,json:async()=>({distance:1000,duration:120,geometry:{type:'LineString'}})});
  await context.opRouteBuild();assert.equal(state.routeResult.from,1);assert.equal(state.routeResult.to,2);
  context.fetch=async()=>({ok:false,json:async()=>({error:'Temporarily unavailable'})});
  await context.opRouteBuild();assert.equal(state.routeResult,null);assert.equal(state.routeError,'Temporarily unavailable');
  state.routeTo=1;
  context.fetch=async()=>{throw new Error('Must not fetch identical endpoints');};
  await context.opRouteBuild();assert.equal(state.routeBusy,false);assert.equal(state.routeResult,null);
  assert.equal(calls,1);
  console.log('Object route UI: request, cancellation, stale results, errors and identical endpoints passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
