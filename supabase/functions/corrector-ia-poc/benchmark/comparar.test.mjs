import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {REFERENCIAS,referenciaPara} from "./referencia-humana.mjs";
import {compararCobertura} from "./comparar.mjs";
import {getFixture} from "../fixtures.mjs";
import {normalizarCorreccion} from "../rubrica.mjs";

const testGLM=JSON.parse(readFileSync(new URL("./glm-ficcion01-captura-20261119.json",import.meta.url),"utf8"));

test("dos referencias cotejadas literalmente con los relatos ficticios",()=>{
  assert.deepEqual(Object.keys(REFERENCIAS).sort(),["ficcion-01","ficcion-02"]);
  assert.equal(referenciaPara("ficcion-01").referencia.erroresObligatorios.length,6);
  assert.equal(referenciaPara("ficcion-02").referencia.erroresObligatorios.length,2);
  assert.throws(()=>referenciaPara("A"),/no admitido/);
  for (const id of Object.keys(REFERENCIAS)) {
    const {texto,referencia}=referenciaPara(id);
    assert.equal(texto,getFixture(id).texto);
    for(const e of referencia.erroresObligatorios) {
      assert.ok(texto.includes(e.fragmento));
      assert.ok(!texto.includes(e.correccion), "El texto original ya contiene la forma corregida: "+e.id);
    }
  }
});
test("la transcripción de GLM identifica 5 de 6 errores del relato 1, omite se callo",()=>{
  const a=compararCobertura("ficcion-01",testGLM);
  assert.equal(a.detectados,5);
  assert.equal(a.correccionesCoincidentes,5);
  assert.equal(a.coberturaPorcentaje,83.3);
  assert.equal(a.citasNoVerificables,0);
  assert.deepEqual(a.objetivos.filter(o=>!o.detectado).map(o=>o.id),["se_callo"]);
  assert.equal(a.puntajeMaximoIncompatible,true);
  assert.equal(a.puntajePropuestoPorModelo,35);
  assert.equal(a.explicacionesGramaticalesVerificadas,false);
  assert.equal(a.requiereRevisionHumana,true);
});
test("dos correcciones sintéticas de Ficción 2 dan cobertura 2 de 2, no califican narrativa",()=>{
  const a=compararCobertura("ficcion-02",{
    errores:[
      {fragmento:"lo buscó por todos lados estaba",correccion:"lo buscó por todos lados. Estaba"},
      {fragmento:"como había",correccion:"cómo había"}
    ]
  });
  assert.equal(a.detectados,2);
  assert.equal(a.correccionesCoincidentes,2);
  assert.equal(a.coberturaPorcentaje,100);
  assert.equal(a.puntajePropuestoPorModelo,null);
  assert.equal(a.requiereRevisionHumana,true);
});
test("se distingue detectar un fragmento de proponer la corrección",()=>{
  const a=compararCobertura("ficcion-01",{errores:[{
    fragmento:"quizo", correccion:"quizo", explicacion:"Corrección errónea"
  }]});
  assert.equal(a.detectados,1);
  assert.equal(a.correccionesCoincidentes,0);
});
test("se cuentan citas inventadas, no se consideran detecciones",()=>{
  const a=compararCobertura("ficcion-01",{errores:[{
    fragmento:"un dragón azul",correccion:"un dragón verde"
  }]});
  assert.equal(a.citasNoVerificables,1);
  assert.equal(a.detectados,0);
});
test("el contrato del backend admite suficientes observaciones para Ficción 1",()=>{
  const errores=Array.from({length:6},(_,i)=>({
    fragmento:"texto "+i,correccion:"cambio "+i,explicacion:"Explicación mínima "+i
  }));
  const base={coherencia:5,complicacion_resolucion:5,recursos_expresivos:2,
    cohesion:3,morfosintaxis:2,ortografia:1,puntuacion:2};
  assert.equal(normalizarCorreccion({criterios:base,fortalezas:["Cuenta una historia breve"],
    sugerencias:["Ampliar el ambiente y los detalles"],errores}).errores.length,6);
  assert.throws(()=>normalizarCorreccion({criterios:base,fortalezas:["Cuenta una historia breve"],
    sugerencias:["Ampliar el ambiente y los detalles"],errores:Array.from({length:11},()=>errores[0])}));
});
