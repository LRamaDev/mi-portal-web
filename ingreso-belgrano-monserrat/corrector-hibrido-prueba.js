(()=>{
'use strict';
const el=id=>document.getElementById(id);
const allowedFixtures=["ficcion-01","ficcion-02"],allowedModels=["glm","oss"];
const localButton=el("hybrid-local"),aiButton=el("hybrid-narrative");
let client=null,busy=false,lastFixture=null;
const status=(id,msg,state)=>{el(id).textContent=msg;el(id).dataset.state=state;};
const fill=(id,values)=>{const list=el(id);list.replaceChildren();
  for(const v of values){const li=document.createElement("li");li.textContent=v;list.appendChild(li);}
};
function reset(){
 lastFixture=null;localButton.disabled=!client;aiButton.disabled=true;
 el("hybrid-results").hidden=true;el("narrative-results").hidden=true;
 status("narrative-status","Primero revisá el relato con el botón anterior.","idle");
}
async function init(){
 try {
   if(localStorage.getItem("ingreso-access-mode-v1")==="visitor"){
     status("access-status","El modo visitante no puede realizar estas pruebas.","error");return;
   }
   const cfg=window.INGRESO_CONFIG;
   if(!window.supabase?.createClient||!cfg?.supabaseUrl||!cfg?.supabaseAnonKey){
     status("access-status","No se pudo cargar la configuración de Supabase.","error");return;
   }
   client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
     auth:{detectSessionInUrl:false}
   });
   const {data,error}=await client.auth.getUser();
   if(error||!data?.user?.id){
     status("access-status","No hay sesión familiar válida. Ingresá a la aplicación y volvé aquí.","error");
     client=null;return;
   }
   const permitted=await client.from("study_access").select("user_id")
     .eq("user_id",data.user.id).maybeSingle();
   if(permitted.error||!permitted.data?.user_id){
     status("access-status","La cuenta no está autorizada para la aplicación.","error");
     client=null;return;
   }
   localButton.disabled=false;
   status("access-status","Sesión familiar autorizada. Podés usar las pruebas ficticias.","ok");
   status("local-status","Elegí un relato y presioná el botón de correcciones verificadas.","idle");
 }catch{
   client=null;status("access-status","No se pudo verificar la sesión familiar.","error");
 }
}
function goodShape(o,fixtureId){
 if(o?.estado!=="ok"||o.modo!=="hibrido"||o.fixtureId!==fixtureId||
    typeof o.correccion?.texto!=="string"||o.correccion.fixtureId!==fixtureId||
    !Array.isArray(o.correccion.correcciones)||!Array.isArray(o.correccion.observacionesDeRevision)||
    o.correccion.calificacion!==null||o.correccion.calificacionValidada!==false)return false;
 return o.correccion.correcciones.every(c=>typeof c.original==="string"&&
    typeof c.propuesta==="string"&&typeof c.explicacion==="string"&&
    Number.isInteger(c.inicio)&&Number.isInteger(c.fin)&&c.inicio>=0&&
    c.fin>c.inicio&&o.correccion.texto.slice(c.inicio,c.fin)===c.original);
}
function errorStatus(error){
 const code=Number(error?.context?.status);
 if(code===429)return "Se alcanzó el límite diario; no repitas la solicitud.";
 if(code===503)return "La IA está en modo deshabilitado. Para probar la parte narrativa debe estar en mock o live.";
 if(code===502)return "La IA no devolvió una sugerencia válida. No repitas la solicitud.";
 if(code===401||code===403)return "La cuenta no está autorizada para esta prueba.";
 return "No se completó la consulta (HTTP "+(code||"?")+").";
}
async function runLocal(){
 if(!client||busy||localButton.disabled)return;
 const fixtureId=el("hybrid-fixture").value;
 if(!allowedFixtures.includes(fixtureId))return;
 busy=true;localButton.disabled=true;aiButton.disabled=true;
 el("hybrid-results").hidden=true;el("narrative-results").hidden=true;
 status("local-status","Consultando el corrector verificado…","busy");
 try{
   const {data,error}=await client.functions.invoke("corrector-ia-poc",{
     body:{accion:"hibrido",fixtureId}
   });
   if(error){status("local-status",errorStatus(error),"error");return;}
   if(!goodShape(data,fixtureId)){
     status("local-status","La función todavía no devolvió un resultado híbrido válido.","error");return;
   }
   const result=data.correccion;
   el("hybrid-story").textContent=result.texto;
   fill("hybrid-corrections",result.correcciones.map(c=>
     "«"+c.original+"» → «"+c.propuesta+"». "+c.explicacion));
   fill("hybrid-observations",result.observacionesDeRevision.map(String));
   el("hybrid-results").hidden=false;
   lastFixture=fixtureId;aiButton.disabled=false;
   status("local-status",result.totalCorrecciones+" correcciones verificadas. Sin IA, sin nota y sin gastar cupo.","ok");
   status("narrative-status","Si querés, pedí una sugerencia narrativa opcional.","idle");
 }catch{
   status("local-status","No se pudo realizar la prueba local.","error");
 }finally{busy=false;localButton.disabled=!client; }
}
async function runNarrative(){
 if(!client||busy||aiButton.disabled||!lastFixture)return;
 const modelo=el("hybrid-model").value,fixtureId=el("hybrid-fixture").value;
 if(!allowedModels.includes(modelo)||fixtureId!==lastFixture)return;
 busy=true;aiButton.disabled=true;localButton.disabled=true;
 el("narrative-results").hidden=true;
 status("narrative-status","Solicitando sugerencias para el relato ficticio…","busy");
 try{
   const {data,error}=await client.functions.invoke("corrector-ia-poc",{
     body:{accion:"hibrido",fixtureId,modelo,narrativa:true}
   });
   if(error){status("narrative-status",errorStatus(error),"error");return;}
   const n=data?.narrativa;
   if(!goodShape(data,fixtureId)||!n||n.calificacion!==null||
      n.calificacionValidada!==false||
      !["pendiente_revision_adulta","simulada_no_generada_por_ia"].includes(n.estado)||
      !Array.isArray(n.fortalezas)||!Array.isArray(n.sugerencias)||
      !Array.isArray(n.preguntasRevision)){
     status("narrative-status","Respuesta narrativa inesperada; no se muestra como válida.","error");return;
   }
   fill("narrative-strengths",n.fortalezas);
   fill("narrative-tips",n.sugerencias);
   fill("narrative-questions",n.preguntasRevision);
   el("narrative-badge").textContent=n.estado==="simulada_no_generada_por_ia"
     ?"Simulación · No generada por IA"
     :"Generada por IA · Pendiente de revisión adulta";
   el("narrative-results").hidden=false;
   status("narrative-status",n.estado==="simulada_no_generada_por_ia"
     ?"Prueba simulada completada, sin gastar cupo."
     :"La IA respondió. Sus sugerencias requieren revisión adulta.","ok");
 }catch{
   status("narrative-status","No se pudo completar la prueba narrativa.","error");
 }finally{busy=false;localButton.disabled=!client;
   aiButton.disabled=!client||fixtureId!==lastFixture;}
}
localButton.addEventListener("click",runLocal);
aiButton.addEventListener("click",runNarrative);
el("hybrid-fixture").addEventListener("change",reset);
init();
})();
