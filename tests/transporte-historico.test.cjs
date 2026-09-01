'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const History=require('../app-transporte/historico.js');
const Routes=require('../app-transporte/recorridos.js');
const root=path.join(__dirname,'../app-transporte/data/historico');
const index=JSON.parse(fs.readFileSync(path.join(root,'indice.json'),'utf8'));

function snapshot(entry){
  const compressed=fs.readFileSync(path.join(root,entry.snapshot));
  assert.equal(crypto.createHash('sha256').update(compressed).digest('hex'),entry.snapshot_sha256);
  const raw=zlib.gunzipSync(compressed);
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),entry.content_sha256);
  return JSON.parse(raw);
}

test('el índice selecciona la publicación aplicable a la fecha del reclamo',()=>{
  assert.equal(History.selectPublication(index,'2026-08-25').publication_date,'2026-08-21');
  assert.equal(History.selectPublication(index,'2026-08-30').publication_date,'2026-08-28');
  assert.equal(History.selectPublication(index,'2026-08-20'),null);
  assert.equal(History.weekday('2026-08-25'),2);
  assert.equal(History.weekday('2026-08-30'),7);
});

test('los respaldos gzip son íntegros y autosuficientes',()=>{
  for(const entry of index.publications){
    const data=snapshot(entry);
    assert.equal(data.schema_version,1);
    assert.equal(data.publication_date,entry.publication_date);
    assert.equal(data.schedule.services.length,entry.services);
    assert.ok(Object.keys(data.locations.locations).length>100);
    assert.ok(data.routes.profiles.length>100);
  }
});

test('la consulta histórica distingue un servicio retirado',()=>{
  const oldEntry=History.selectPublication(index,'2026-08-25'),newEntry=History.selectPublication(index,'2026-09-01');
  const old=snapshot(oldEntry),current=snapshot(newEntry);
  const oldEngine=Routes.create(old.schedule,old.locations,old.routes),currentEngine=Routes.create(current.schedule,current.locations,current.routes);
  const filters={search:'ALTO ALEGRE',origin:'',destination:'',corridor:'',line:'',direction:'',company:'',modality:'',day:'2'};
  assert.equal(oldEngine.query(filters).length,2);
  assert.equal(currentEngine.query(filters).length,0);
});

test('la publicación nueva conserva los dos horarios modificados de Saira',()=>{
  const data=snapshot(History.selectPublication(index,'2026-09-01'));
  const services=data.schedule.services.filter(service=>service.line==='VILLA MARÍA - SAIRA'&&service.direction==='V');
  assert.ok(services.some(service=>service.time==='14:45'&&service.service_days.includes(1)));
  assert.ok(services.some(service=>service.time==='18:45'&&service.service_days.includes(7)));
  assert.ok(!services.some(service=>service.time==='16:30'||service.time==='19:00'));
});

test('el informe estructurado separa modificados de eliminados',()=>{
  const report=JSON.parse(fs.readFileSync(path.join(root,'cambios/cambios-2026-08-28.json'),'utf8'));
  assert.deepEqual(report.summary,{previous_services:5506,current_services:5504,unchanged:5502,modified:2,added:0,removed:2});
  assert.deepEqual(report.modified.map(item=>[item.before.time,item.after.time]),[['16:30','14:45'],['19:00','18:45']]);
  assert.ok(report.removed.every(service=>service.line==='VILLA MARÍA - ALTO ALEGRE'));
});

test('el CSV del informe protege comas y comillas',()=>{
  const output=History.csv([['Estado','Línea'],['Modificado','A, "B"']]);
  assert.match(output,/"A, ""B"""/);
});
