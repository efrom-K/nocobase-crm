const assert = require('node:assert/strict');
const {objectRoute} = require('./routes');
const realFetch = global.fetch, realNow = Date.now;
let now = 1000000, calls = 0;
Date.now = () => now;
const admin = {isAdmin:true};
const objects = [
  {id:1,map_location:{lat:55,lon:37}},
  {id:2,map_location:{lat:56,lon:38}},
  {id:3,map_location:{lat:57,lon:39}}
];
const load = async ids => objects.filter(o => ids.includes(o.id));
const result = {code:'Ok',routes:[{distance:5400,duration:530,geometry:{type:'LineString',coordinates:[[37,55],[38,56]]}}]};
const reply = (json=result, ok=true) => ({ok,json:async()=>json});
const status = code => e => e.status === code;
async function main() {
  global.fetch = async (url, options) => {
    calls++; assert(url.startsWith('https://routing.openstreetmap.de/routed-car/route/v1/driving/'));
    assert(options.headers['User-Agent'].includes('NocobaseCRM'));
    assert(options.signal instanceof AbortSignal);
    return reply();
  };
  let reads=0;
  await assert.rejects(objectRoute({isAdmin:false},{from:1,to:2},async()=>{reads++;return objects;}),status(403));
  assert.equal(reads,0);
  for (const body of [null,{}, {from:1,to:1},{from:'1',to:2},{from:-1,to:2},{from:1,to:NaN},{from:1,to:2.5}]) {
    await assert.rejects(objectRoute(admin,body,load),status(400));
  }
  await assert.rejects(objectRoute(admin,{from:1,to:99},load),status(404));
  await assert.rejects(objectRoute(admin,{from:1,to:2},async()=>[objects[0],{id:2,map_location:{lat:null,lon:38}}]),status(422));
  assert.equal(calls,0,'No routing requests for forbidden or invalid objects');
  const route=await objectRoute(admin,{from:1,to:2},load);
  assert.equal(route.distance,5400); assert.equal(route.geometry.type,'LineString');
  await objectRoute(admin,{from:1,to:2},load); assert.equal(calls,1,'Repeat uses cache');
  await assert.rejects(objectRoute(admin,{from:1,to:2},async()=>[]),status(404),'ACL checked before cache');
  await assert.rejects(objectRoute(admin,{from:2,to:1},load),status(429),'Global upstream rate limit');
  now+=1200;
  await objectRoute(admin,{from:2,to:1},load);assert.equal(calls,2,'Reverse direction is calculated separately');
  now+=1200;objects[0].map_location.lat=55.1;
  await objectRoute(admin,{from:1,to:2},load);assert.equal(calls,3,'Changed location does not reuse stale route');
  now+=86400001;
  await objectRoute(admin,{from:1,to:2},load);assert.equal(calls,4,'Expired cache refreshes');
  now+=1200;
  let complete;
  global.fetch=()=>new Promise(resolve=>{complete=resolve;});
  const pending=objectRoute(admin,{from:1,to:3},load);
  await Promise.resolve();
  now+=1200;
  await assert.rejects(objectRoute(admin,{from:2,to:3},load),status(429),'In-flight work is bounded');
  complete(reply());await pending;
  for (const bad of [
    {code:'NoSegment'}, {code:'NoRoute'}, {code:'Ok',routes:[]},
    {code:'Ok',routes:[{...result.routes[0],duration:-1}]},
    {code:'Ok',routes:[{...result.routes[0],geometry:{type:'LineString',coordinates:[[null,55],[38,56]]}}]},
    {code:'Ok',routes:[{...result.routes[0],geometry:{type:'Point',coordinates:[37,55]}}]}
  ]) {
    now+=1200;global.fetch=async()=>reply(bad);
    await assert.rejects(objectRoute(admin,{from:2,to:3},load),status(bad.code.startsWith('No')?422:502));
  }
  now+=1200;global.fetch=async()=>reply(null,false);
  await assert.rejects(objectRoute(admin,{from:2,to:3},load),status(502));
  now+=1200;global.fetch=async()=>{throw new Error('timeout');};
  await assert.rejects(objectRoute(admin,{from:2,to:3},load),status(502));
  now+=1200;global.fetch=async()=>reply();
  await objectRoute(admin,{from:2,to:3},load);
  console.log('Object routes: ACL, IDs, coordinates, cache, expiry, direction, rate limit and upstream failures passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{global.fetch=realFetch;Date.now=realNow;});
