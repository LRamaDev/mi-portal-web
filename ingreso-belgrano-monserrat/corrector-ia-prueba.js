(() => {
  'use strict';
  const ui=id=>document.getElementById(id);
  const button=ui('run-check');
  const settingsButton=ui('check-settings');
  const settingsStatus=ui('settings-status');
  const accessStatus=ui('connection-status');
  const testStatus=ui('test-status');
  const panel=ui('result-panel');
  const extra=ui('extra-feedback');
  const MODEL_LABELS={glm:'GLM 4.7 Flash',oss:'GPT-OSS 20B'};
  const FIXTURES=['ficcion-01','ficcion-02'];
  let client=null;
  let running=false;

  function message(element,text,state){ element.textContent=text;element.dataset.state=state; }

  async function checkAccess(){
    button.disabled=true;
    settingsButton.disabled=true;
    try{
      if(localStorage.getItem('ingreso-access-mode-v1')==='visitor'){
        message(accessStatus,'La aplicación está en modo visitante. Ingresá con la cuenta familiar para realizar la prueba.','error');
        return;
      }
      const cfg=window.INGRESO_CONFIG;
      if(!window.supabase?.createClient||!cfg?.supabaseUrl||!cfg?.supabaseAnonKey){
        message(accessStatus,'No se pudo cargar la configuración de Supabase. Actualizá la página.','error');return;
      }
      // Un único cliente en este documento; no cargamos la app ni sus otros clientes.
      client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{detectSessionInUrl:false}});
      const {data:userData,error:authError}=await client.auth.getUser();
      if(authError||!userData?.user?.id){
        message(accessStatus,'No hay sesión familiar válida. Ingresá en la app y volvé aquí.','error');return;
      }
      const {data:allowed,error:accessError}=await client.from('study_access')
        .select('user_id').eq('user_id',userData.user.id).maybeSingle();
      if(accessError||!allowed?.user_id){
        message(accessStatus,'La cuenta no está autorizada para esta aplicación.','error');return;
      }
      button.disabled=false;
      settingsButton.disabled=false;
      message(accessStatus,'Sesión familiar autorizada. Podés realizar la prueba.','ok');
      message(testStatus,'Elegí un relato ficticio y un modelo para comprobar la conexión.','idle');
    }catch{
      message(accessStatus,'No se pudo comprobar la sesión. Revisá la conexión y actualizá.','error');
    }
  }

  function list(id,items){
    const target=ui(id);target.replaceChildren();
    for(const item of items){
      const li=document.createElement('li');li.textContent=String(item);target.appendChild(li);
    }
  }
  async function detailFor(error){
    const status=Number(error?.context?.status);
    if(status===401)return 'Sesión no aceptada (401).';
    if(status===403)return 'La cuenta no está autorizada (403).';
    if(status===429)return 'Se alcanzó el límite global de cuatro pruebas reales por día (429).';
    if(status===503){
      // Solo códigos de error predefinidos: nunca volcamos la respuesta cruda.
      try {
        const response=await error.context.clone().json();
        const messages={
          mode_disabled:'El corrector está deshabilitado. Revisá POC_AI_MODE en Supabase: para una prueba real debe ser exactamente live.',
          quota_unavailable:'Supabase no pudo consultar el contador diario. No se consumió una consulta de IA.',
          config_invalid_account:'El Account ID no tiene el formato esperado. Ejecutá el diagnóstico sin cupo.',
          config_invalid_token:'El token tiene un formato inválido. Ejecutá el diagnóstico sin cupo.',
          config_invalid_header:'No pudo construirse la autorización de Cloudflare. Ejecutá el diagnóstico sin cupo.'
        };
        if(typeof response?.code==='string' && Object.hasOwn(messages,response.code)) return messages[response.code];
        if(response?.error==='Prueba deshabilitada')return messages.mode_disabled;
      }catch{}
      return 'No se pudo habilitar la prueba (503). Usá «Comprobar configuración» antes de repetirla.';
    }
    if(status===502){
      try{
        const response=await error.context.clone().json();
        if(response?.code==='provider_http'){
          const remoteStatus=Number(response?.providerStatus);
          if(Number.isInteger(remoteStatus)&&remoteStatus>=400&&remoteStatus<=599){
            if(remoteStatus===401||remoteStatus===403) return 'Cloudflare rechazó las credenciales o sus permisos (HTTP '+remoteStatus+').';
            if(remoteStatus===429) return 'Cloudflare limitó las solicitudes (HTTP 429).';
            if(remoteStatus===400||remoteStatus===422) return 'Cloudflare rechazó el formato de solicitud (HTTP '+remoteStatus+').';
            return 'Cloudflare devolvió HTTP '+remoteStatus+'.';
          }
        }
        const kinds={
          provider_invalid_json:'Cloudflare respondió, pero no devolvió JSON válido.',
          provider_invalid_schema:'Cloudflare respondió, pero no respetó la rúbrica pedida.',
          provider_truncated:'Cloudflare interrumpió su respuesta antes de terminarla.',
          provider_empty:'Cloudflare devolvió una respuesta vacía.',
          provider_invalid_envelope:'Cloudflare devolvió un formato de respuesta inesperado.',
          provider_invalid_format:'Cloudflare devolvió un formato de contenido no admitido.',
          provider_network:'No se pudo establecer conexión de salida con Cloudflare.',
          provider_timeout:'Cloudflare no respondió antes del límite de tiempo.'
        };
        if(typeof response?.code==='string'&&Object.hasOwn(kinds,response.code))return kinds[response.code];
      }catch{}
      return 'No se obtuvo una corrección válida del proveedor (502).';
    }
    return Number.isInteger(status)&&status>0 ? 'La función respondió HTTP '+status+'.'
      : 'No fue posible conectar con la función.';
  }

  async function verifySettings() {
    if(running||!client||settingsButton.disabled)return;
    running=true;
    settingsButton.disabled=true;
    button.disabled=true;
    const resultList=ui('settings-results');
    resultList.hidden=true;
    message(settingsStatus,'Comprobando la configuración local en Supabase…','busy');
    try {
      const {data,error}=await client.functions.invoke('corrector-ia-poc',{
        body:{accion:'diagnostico'}
      });
      if(error) {
        const status=Number(error?.context?.status);
        message(settingsStatus,'No se pudo completar el diagnóstico (HTTP '+(status||'?')+').','error');
        return;
      }
      const checks=data?.comprobaciones;
      if(data?.modo!=='diagnostico'||data?.consumeCupo!==false||
         data?.realizoSolicitudExterna!==false||
         !checks||typeof checks.cuenta!=='boolean'||
         typeof checks.token!=='boolean'||typeof checks.cabecera!=='boolean') {
        message(settingsStatus,'La función todavía no tiene disponible el diagnóstico. No se realizó una prueba de IA.','error');
        return;
      }
      const entries=[
        ['Account ID',checks.cuenta],
        ['Formato del token',checks.token],
        ['Cabecera de autorización',checks.cabecera]
      ];
      resultList.replaceChildren();
      for(const [label,valid] of entries){
        const li=document.createElement('li');
        li.textContent=(valid?'Correcto: ':'Revisar: ')+label;
        resultList.appendChild(li);
      }
      resultList.hidden=false;
      const allValid=entries.every(([_,valid])=>valid);
      const modeNames={real:'REAL: acepta pruebas con IA',simulado:'SIMULADO: no utiliza Cloudflare',
        deshabilitado:'DESHABILITADO: POC_AI_MODE no es live ni mock'};
      const mode=typeof data.modoServicio==='string'&&Object.hasOwn(modeNames,data.modoServicio)
        ? data.modoServicio : 'deshabilitado';
      const modeItem=document.createElement('li');
      modeItem.textContent='Modo del corrector: '+modeNames[mode];
      resultList.appendChild(modeItem);
      const mainMessage=allValid
        ? 'Los formatos son válidos. Esto no confirma la conexión ni los permisos de Cloudflare.'
        : 'Se encontró un problema de formato. Revisá el secreto indicado en Supabase.';
      const modeAdvice=mode==='real'
        ? ' El corrector está habilitado para pruebas reales.'
        : mode==='simulado'
        ? ' El corrector está en modo simulado. Para una corrección real, poné POC_AI_MODE en live.'
        : ' El corrector está deshabilitado. Revisá POC_AI_MODE en Supabase.';
      message(settingsStatus,mainMessage+modeAdvice,
        allValid&&mode!=='deshabilitado'?'ok':'error');
    }catch{
      message(settingsStatus,'El diagnóstico no pudo completarse. No se consumió una corrección de IA.','error');
    }finally{
      running=false;
      settingsButton.disabled=false;
      button.disabled=false;
    }
  }

  async function runCheck(){
    if(running||!client||button.disabled)return;
    const fixtureId=ui('fixture-select').value,modelo=ui('model-select').value;
    if(!FIXTURES.includes(fixtureId)||!Object.hasOwn(MODEL_LABELS,modelo)){
      message(testStatus,'Prueba o modelo no reconocido.','error');return;
    }
    running=true;button.disabled=true;settingsButton.disabled=true;panel.hidden=true;
    message(testStatus,'Consultando la función experimental…','busy');
    try{
      const {data,error}=await client.functions.invoke('corrector-ia-poc',{body:{fixtureId,modelo}});
      if(error){message(testStatus,'No se completó la prueba. '+await detailFor(error),'error');return;}
      const result=data?.resultado;
      if(data?.fixtureId!==fixtureId||data?.modelo!==modelo||
         !['simulado','proveedor'].includes(data?.modo)||
         !Number.isInteger(result?.puntajeEstimado)||result.puntajeEstimado<0||result.puntajeEstimado>35||
         result.maximo!==35||!Array.isArray(result.fortalezas)){
        message(testStatus,'El proveedor devolvió una estructura inesperada. No se considera una evaluación válida.','error');
        return;
      }
      if(data.modo==='simulado'&&result.puntajeEstimado!==23){
        message(testStatus,'La respuesta simulada no coincide con el valor de control.','error');return;
      }
      ui('result-mode').textContent=data.modo==='simulado'?'Simulado':'Cloudflare';
      ui('result-model').textContent=MODEL_LABELS[modelo];
      ui('result-score').textContent=result.puntajeEstimado+' / 35';
      ui('result-note').textContent=data.modo==='simulado'
        ? 'Resultado simulado · No generado por IA'
        : 'Evaluación generada por IA sobre un texto ficticio';
      list('result-strengths',result.fortalezas);
      if(data.modo==='proveedor'){
        list('result-tips',Array.isArray(result.sugerencias)?result.sugerencias:[]);
        list('result-errors',Array.isArray(result.errores)?
          result.errores.map(x=>x.fragmento+' → '+x.correccion+': '+x.explicacion):[]);
        extra.hidden=false;
      }else extra.hidden=true;
      panel.hidden=false;
      message(testStatus,data.modo==='simulado'
        ? 'Conexión verificada; el modo simulado sigue activo.'
        : 'Cloudflare devolvió una corrección del relato ficticio. Revisá sus observaciones.','ok');
    }catch{
      message(testStatus,'La prueba no pudo completarse. No se enviaron textos personales.','error');
    }finally{running=false;button.disabled=false;settingsButton.disabled=false;}
  }
  button.addEventListener('click',runCheck);
  settingsButton.addEventListener('click',verifySettings);
  checkAccess();
})();
