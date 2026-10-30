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
const html = fs.readFileSync('requests-service/object-map.html','utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
let initialize, initialized;
const parent = {};
const frame = vm.createContext({parent,window:{addEventListener:(type,fn)=>{initialize=fn;}}});
vm.runInContext(scripts[0][1],frame);
frame.opMapFrame=(objects,channel)=>{initialized={objects,channel};};
const init={type:'crm-object-map-init',channel:'test-channel',objects:[{id:1,name:'Object',lat:55,lon:37}]};
initialize({source:{},data:init});assert.equal(initialized,undefined);
for (const objects of [[{id:1,name:'Object',lat:null,lon:37}],[{id:-1,name:'Object',lat:55,lon:37}],Array(1001).fill(init.objects[0])]) {
  initialize({source:parent,data:{...init,objects}});assert.equal(initialized,undefined);
}
initialize({source:parent,data:{...init,channel:''}});assert.equal(initialized,undefined);
initialize({source:parent,data:init});assert.equal(initialized.channel,'test-channel');assert.equal(initialized.objects.length,1);
initialized=null;initialize({source:parent,data:init});assert.equal(initialized,null,'Frame initializes only once');
console.log('Object map: coordinates, address search, message boundaries and isolated frame initialization passed');
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
  state.objs[1].map_location={lat:56,lon:38};
  state.routeFrom=null;state.routeTo=null;state.objId=2;
  let routes=0;
  context.fetch=async()=>{routes++;return {ok:true,json:async()=>({distance:1000,duration:120,geometry:{type:'LineString'}})};};
  await context.opRoutePick('to');
  assert.equal(state.routeTo,2);assert.equal(state.routeFrom,null);assert.equal(routes,0,'One endpoint only shows selection prompt');
  state.objId=1;await context.opRoutePick('from');
  assert.equal(routes,1,'Second card action builds automatically');assert.equal(state.routeResult.from,1);assert.equal(state.routeResult.to,2);
  await context.opRoutePick('to');
  assert.equal(state.routeTo,1);assert.equal(state.routeFrom,null);assert.equal(state.routeResult,null,'Same object clears opposite endpoint');
  state.objId=2;await context.opRoutePick('from');
  assert.equal(state.routeResult.from,2);assert.equal(state.routeResult.to,1,'Either endpoint can be selected first');
  state.objId=999;await context.opRoutePick('to');assert.equal(state.routeTo,1,'Unknown object cannot become endpoint');
  assert.equal(context.opMapPhoto({map_location:{photo:'https://untrusted.example/picture.webp'}}),'');
  assert.equal(context.opMapPhoto({map_location:{photo:'/storage/uploads/object-map/object-1.webp'}}),'/storage/uploads/object-map/object-1.webp');
  context.setTimeout=setTimeout;context.clearTimeout=clearTimeout;
  const replies=[];state.mapChannel='tile-channel';state.mapFrame={isConnected:true,contentWindow:{postMessage:d=>replies.push(d)}};
  let tileCalls=0;
  context.fetch=async(url,options)=>{tileCalls++;assert.equal(url,'https://tile.openstreetmap.org/2/1/2.png');assert.equal(options.referrerPolicy,'origin');assert.equal(options.headers,undefined);return {ok:true,headers:{get:()=> 'image/png'},arrayBuffer:async()=>new ArrayBuffer(8)};};
  const tile={requestId:1,z:2,x:1,y:2};
  await context.opMapTile({...tile,x:4});await context.opMapTile({...tile,z:19});assert.equal(tileCalls,0,'Tile bounds validated before fetch');
  await context.opMapTile(tile);assert.equal(replies[0].buffer.byteLength,8);assert.equal(replies[0].channel,'tile-channel');assert.equal(state.mapTileLoads,0);
  state.mapTileLoads=48;await context.opMapTile(tile);assert.equal(tileCalls,1);assert.equal(replies.at(-1).error,true);state.mapTileLoads=0;
  context.fetch=async()=>({ok:false});await context.opMapTile(tile);assert.equal(replies.at(-1).error,true);assert.equal(state.mapTileLoads,0);
  const replyCount=replies.length;state.mapFrame.contentWindow=null;await context.opMapTile(tile);assert.equal(replies.length,replyCount,'Closed frame safely ignores late tile response');
  console.log('Object route UI: request, cancellation, stale results, errors and identical endpoints passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
