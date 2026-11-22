(function fractionChallenges() {
  'use strict';
  const dialog = document.getElementById('fraction-challenge-dialog');
  const app = document.getElementById('fraction-challenge-content');
  const closeButton = document.getElementById('fraction-challenge-close');
  let session = null;
  let loading = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const button = (text, id, secondary = false) =>
    `<button id="${id}" class="${secondary ? 'secondary-button' : 'primary-button'}" type="button">${text}</button>`;
  const notice = (title, body, good = false) =>
    `<div class="fraction-notice${good ? ' fraction-notice-good' : ''}" role="status"><strong>${esc(title)}</strong><div>${body}</div></div>`;

  function cell(id, shape, attrs, label) {
    return `<${shape} data-fraction-cell="${id}" ${attrs} tabindex="0" role="button" aria-label="${esc(label)}" aria-pressed="false"></${shape}>`;
  }
  function discs() {
    return `<div class="fraction-figures">${[0, 1].map(group => {
      let paths = '';
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4, b = a + Math.PI / 4;
        const x1 = 57 + 48 * Math.cos(a), y1 = 57 + 48 * Math.sin(a);
        const x2 = 57 + 48 * Math.cos(b), y2 = 57 + 48 * Math.sin(b);
        paths += cell(group * 8 + i, 'path',
          `d="M57 57 L${x1} ${y1} A48 48 0 0 1 ${x2} ${y2} Z"`,
          `Sector ${i + 1} de la rueda ${group + 1}`);
      }
      return `<div class="fraction-figure"><svg viewBox="0 0 114 114" aria-label="Rueda ${group + 1}">${paths}</svg><span>Rueda ${group + 1}</span></div>`;
    }).join('')}</div>`;
  }
  function squares() {
    const cells = [[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2],[0,3],[1,3],[2,3],[3,3]];
    return `<svg class="fraction-squares" viewBox="0 0 240 240" aria-label="Figura de doce cuadrados">${cells.map(([x,y],i) =>
      cell(i, 'rect', `x="${23 + x * 48}" y="${23 + y * 48}" width="48" height="48"`, `Cuadrado ${i + 1}`)
    ).join('')}</svg>`;
  }
  function mixed() {
    return `<div class="fraction-figures">${[0,1].map(group =>
      `<div class="fraction-figure"><svg viewBox="0 0 166 132" aria-label="Tablero ${group + 1}">${Array.from({length:6},(_,i) =>
        cell(group * 6 + i, 'rect',
          `x="${11+(i % 3)*48}" y="${11+Math.floor(i/3)*48}" width="48" height="48"`,
          `Cuadrado ${i+1} del tablero ${group+1}`)
      ).join('')}</svg><span>Tablero ${group+1}</span></div>`
    ).join('')}</div>`;
  }
  function triangles(task) {
    const count = task.count, cols = 8, rows = Math.ceil(count / cols);
    return `<svg class="fraction-triangles" viewBox="0 0 343 ${rows*40+7}" aria-label="${count} triángulos">${Array.from({length:count},(_,i) => {
      const x=8+(i%cols)*41, y=8+Math.floor(i/cols)*40;
      return cell(i, 'polygon', `points="${x+18},${y} ${x+36},${y+32} ${x},${y+32}"`, `Triángulo ${i+1}`);
    }).join('')}</svg>`;
  }
  // Recta numérica accesible con clic, toque o teclado (intervalos 0-1 y 0-2).
  function line(task) {
    const ticks = task.denominator * task.max;
    return `<div class="fraction-numberline"><svg viewBox="0 0 620 145" role="group" aria-label="Recta numérica de cero a ${task.max}">
      <line x1="40" y1="75" x2="580" y2="75" class="fraction-axis"></line>
      ${Array.from({length:ticks + 1},(_,i) => {
        const x = 40 + 540 * i / ticks;
        const label = i % task.denominator === 0
          ? `<text x="${x}" y="123" text-anchor="middle" class="fraction-axis-label">${i/task.denominator}</text>` : '';
        return `<line x1="${x}" y1="64" x2="${x}" y2="86" class="fraction-axis-tick"></line>` +
          cell(i,'circle',`cx="${x}" cy="75" r="15"`,`Seleccionar ${i}/${task.denominator}`) + label;
      }).join('')}</svg><p>Elegí una marca de la recta.</p></div>`;
  }
  function unit(task) {
    return `<div class="fraction-unit"><p>Las primeras ${task.given} fichas ya están dadas. Agregá las que faltan.</p><div class="fraction-circles">${Array.from({length:task.given+session.added},(_,i) =>
      `<span class="fraction-circle${i>=task.given?' fraction-circle-added':''}" aria-label="${i>=task.given?'Ficha agregada':'Ficha dada'}"></span>`).join('')}</div><div class="fraction-stepper"><button type="button" id="fraction-minus" aria-label="Quitar ficha">−</button><output>${session.added} agregadas</output><button type="button" id="fraction-plus" aria-label="Agregar ficha">+</button></div></div>`;
  }

  // Nuevos bloques del modelo: el mismo diálogo, controles, pistas, revisión
  // y sistema de resultados que las tandas de fracciones originales.
  function modelGrid(task) {
    const cols = task.cells > 12 ? 4 : task.cells % 5 === 0 ? 5 : 4;
    const rows = Math.ceil(task.cells / cols);
    const w = cols*48+16, h = rows*48+16;
    let cells = '';
    for(let i=0;i<task.cells;i++){
      const x=8+i%cols*48, y=8+Math.floor(i/cols)*48;
      const full = task.kind === 'visual-half' ? Math.floor(task.shadedHalves/2) > i : task.shaded > i;
      const half = task.kind === 'visual-half' && Math.floor(task.shadedHalves/2) === i && task.shadedHalves % 2 === 1;
      cells += `<rect x="${x}" y="${y}" width="48" height="48" fill="${full?'#79b8ed':'#fff'}" stroke="#3e5976" stroke-width="2"></rect>`;
      if(half) cells += `<path d="M${x} ${y} L${x+48} ${y} L${x} ${y+48} Z" fill="#79b8ed" stroke="#3e5976" stroke-width="1"></path>`;
    }
    return `<div class="model-grid"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Figura de ${task.cells} cuadrados iguales, con zonas pintadas">${cells}</svg></div>`;
  }
  function modelPaint(task) {
    const cols=task.cells>12?4:4, rows=Math.ceil(task.cells/cols);
    return `<div class="model-grid"><svg viewBox="0 0 208 ${rows*48+16}" role="group" aria-label="Cuadrícula para pintar">
      ${Array.from({length:task.cells},(_,i)=>cell(i,'rect',
        `x="${8+i%cols*48}" y="${8+Math.floor(i/cols)*48}" width="48" height="48"`,
        `Cuadrado ${i+1}`)).join('')}</svg></div>`;
  }
  function modelChips(task) {
    const group=(name,count)=>`<div class="model-chip-group"><strong>Fila ${name}: ${count} fichas</strong>
      <div class="model-chips">${Array.from({length:count},(_,i)=>
        `<span class="model-chip" aria-label="Ficha ${i+1}"></span>`).join('')}</div></div>`;
    return `<div class="model-chip-compare">${group('A',task.top)}${group('B',task.bottom)}</div>`;
  }
  function modelWord(task) {
    return `<div class="model-word" role="group" aria-label="Palabra ${esc(task.word)}">
      ${[...task.word].map(ch=>`<span>${esc(ch)}</span>`).join('')}</div>`;
  }
  function modelSegments(figure) {
    const segments=[];
    const add=(a,b,outer=true)=>segments.push({a,b,outer});
    let fill='';
    if(figure==='joined'){
      fill='<path d="M35 30 H145 V30 H200 V85 H145 V150 H35 Z" fill="#dceafb" stroke="none"></path>';
      const pts=[[35,30],[145,30],[200,30],[200,85],[145,85],[145,150],[35,150]];
      for(let i=0;i<pts.length;i++)add(pts[i],pts[(i+1)%pts.length]);
      add([145,30],[145,85],false);
    } else if(figure==='square-hole'){
      fill='<path d="M45 25 H185 V165 L115 43 L45 165 Z" fill="#dceafb" stroke="none"></path>';
      add([45,25],[185,25]);add([185,25],[185,165]);add([185,165],[115,43]);
      add([115,43],[45,165]);add([45,165],[45,25]);
      add([45,165],[185,165],false);
    } else if(figure==='rectangle-join'){
      fill='<path d="M35 25 H150 V70 H230 V130 H150 V160 H35 Z" fill="#dceafb" stroke="none"></path>';
      const pts=[[35,25],[150,25],[150,70],[230,70],[230,130],[150,130],[150,160],[35,160]];
      for(let i=0;i<pts.length;i++)add(pts[i],pts[(i+1)%pts.length]);
      add([150,70],[150,130],false);
    } else if(figure==='hex-wings'){
      fill='<path d="M26 45 L102 68 L158 68 L236 45 L186 120 L158 170 L102 170 L74 120 Z" fill="#dceafb" stroke="none"></path>';
      const pts=[[26,45],[102,68],[158,68],[236,45],[186,120],[158,170],[102,170],[74,120]];
      for(let i=0;i<pts.length;i++)add(pts[i],pts[(i+1)%pts.length]);
      add([102,68],[74,120],false);
      add([158,68],[186,120],false);
    }
    return {fill,segments};
  }
  function modelFigure(task) {
    const {fill,segments}=modelSegments(task.figure);
    const selectable=task.kind==='perimeter-select';
    return `<div class="model-perimeter-figure">
      <svg viewBox="0 0 280 205" role="${selectable?'group':'img'}" aria-label="Figura geométrica ${selectable?'con segmentos seleccionables':'de referencia, no a escala'}">
        ${fill}
        ${segments.map((part,i) =>
          `<line x1="${part.a[0]}" y1="${part.a[1]}" x2="${part.b[0]}" y2="${part.b[1]}"
             class="${selectable?'model-select-edge':'model-static-edge'}"
             ${selectable?`data-fraction-cell="${i}" tabindex="0" role="button" aria-label="Tramo ${i+1}" aria-pressed="false"`:''}></line>`).join('')}
      </svg>
      <p>${selectable?'Tocá los tramos del borde que correspondan. Podés seleccionar varios.':'Esquema de la figura (no está a escala).'}</p>
    </div>`;
  }
  function modelBoard(task) {
    if(['visual-read','visual-half'].includes(task.kind))return modelGrid(task) + modelFractionInput();
    if(task.kind==='visual-compare')return modelChips(task) + modelFractionInput();
    if(task.kind==='visual-word')return modelWord(task) + modelFractionInput();
    if(task.kind==='visual-paint')return modelPaint(task);
    if(task.kind==='perimeter-select')return modelFigure(task);
    if(task.kind==='perimeter-number')return modelFigure(task)+`<div class="fraction-fields">
       <label>Perímetro exterior (${esc(task.unit)})<input id="fraction-ans1" type="text" inputmode="numeric" autocomplete="off" placeholder="Escribí la medida"></label></div>`;
    if(task.kind==='perimeter-pair')return modelFigure(task)+`<div class="fraction-fields">
       <label>${esc(task.question1)}<input id="fraction-ans1" type="text" inputmode="numeric" autocomplete="off"></label>
       <label>${esc(task.question2)}<input id="fraction-ans2" type="text" inputmode="numeric" autocomplete="off"></label></div>`;
    return '';
  }
  function modelFractionInput(){
    return '<div class="fraction-fields"><label>Escribí la fracción que corresponde<input id="fraction-ans1" type="text" inputmode="text" placeholder="Por ejemplo: 3/4" autocomplete="off"></label></div>';
  }
  function modelEvaluate(task) {
    if(['visual-read','visual-half','visual-compare','visual-word'].includes(task.kind)){
      const f=readFraction();
      if(!f)return {valid:false};
      return {valid:true,correct:f[0]*task.expected[1]===task.expected[0]*f[1],
        reason:'Revisá qué cantidad se toma como unidad de referencia, qué se cuenta y si tu fracción es equivalente.'};
    }
    if(task.kind==='visual-paint'){
      return {valid:session.selection.size>0,correct:session.selection.size===task.paint,
        reason:`Pintaste ${session.selection.size} cuadrados. Revisá cuántos representa la fracción solicitada.`};
    }
    if(task.kind==='perimeter-select'){
      const segments=modelSegments(task.figure).segments;
      const expected=segments.map((p,i)=>p.outer?i:-1).filter(i=>i>=0);
      const correct=expected.length===session.selection.size && expected.every(i=>session.selection.has(i));
      return {valid:session.selection.size>0,correct,reason:'Seguí el borde de la región solicitada y revisá si marcaste algún segmento interior o te falta algún tramo exterior.'};
    }
    if(task.kind==='perimeter-number'){
      const answer=readNumber('ans1');
      return {valid:answer!==null,correct:answer===task.expected,
        reason:'Revisá las medidas de los lados del contorno. Los bordes compartidos no se suman al perímetro exterior.'};
    }
    if(task.kind==='perimeter-pair'){
      const first=readNumber('ans1'),second=readNumber('ans2');
      return {valid:first!==null && second!==null,
        correct:first===task.expected[0]&&second===task.expected[1],
        reason:first!==task.expected[0]?'Primero hallá cuánto mide el lado chico usando la relación entre los cuadrados.':'La medida del lado chico está bien. Revisá el tramo compartido al calcular el perímetro exterior.'};
    }
    return {valid:false};
  }


  // Ortografía Monserrat: mismas tandas de siete, corrección, ayudas y resumen,
  // con respuesta activa (no solo reconocimiento por descarte).
  function spelling(value) {
    return String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('es');
  }
  function orthoButtons(options) {
    return '<div class="orthography-options" role="group" aria-label="Elegí una respuesta">' +
      options.map((item,index) =>
        '<button type="button" class="orthography-option" data-orth-option="' + index +
        '" aria-pressed="false">' + esc(item) + '</button>').join('') + '</div>';
  }
  function orthoTextInput(label,placeholder) {
    return '<div class="fraction-fields orthography-fields"><label>' + esc(label) +
      '<input id="fraction-ans1" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="80" placeholder="' +
      esc(placeholder) + '"></label></div>';
  }
  function orthoBoard(task) {
    if(task.kind==='orth-classify') return '<div class="orthography-keyword" lang="es">' +
      esc(task.word) + '</div>' + orthoButtons(['Diptongo','Hiato']);
    if(task.kind==='orth-sentence') return '<blockquote class="orthography-sentence" lang="es">' +
      esc(task.sentence) + '</blockquote>' + orthoButtons(['Correcta','Incorrecta']) +
      orthoTextInput('Si elegiste «Incorrecta», escribí aquí la palabra bien escrita.','Palabra corregida');
    if(task.kind==='orth-fill') return '<blockquote class="orthography-sentence" lang="es">' +
      esc(task.sentence) + '</blockquote>' + orthoTextInput('Escribí la palabra completa, con todas sus letras y tildes.','Palabra completa');
    if(task.kind==='orth-accent') return orthoButtons(task.options) +
      orthoTextInput('Escribí la palabra seleccionada con la tilde correcta.','Palabra con tilde');
    if(task.kind==='orth-diacritic') return '<blockquote class="orthography-sentence" lang="es">' +
      esc(task.context) + '</blockquote>' + orthoButtons(task.options);
    return '';
  }
  function orthoEvaluate(task) {
    const selected=session.choice;
    const word=spelling(app.querySelector('#fraction-ans1')?.value);
    if(task.kind==='orth-classify'){
      const values=['diptongo','hiato'];
      return {valid:selected!==null,correct:selected!==null&&values[selected]===task.expected,
        reason:'Pronunciá despacio y comprobá si las vocales consecutivas pertenecen a la misma sílaba.'};
    }
    if(task.kind==='orth-sentence'){
      const values=['correcta','incorrecta'],choice=values[selected];
      if(selected===null || (choice==='incorrecta'&&!word))return {valid:false};
      const detected=choice===task.expected;
      const corrected=task.expected==='correcta'||word===spelling(task.correction);
      return {valid:true,correct:detected&&corrected,
        reason:!detected?'Revisá las palabras con G y J antes de decidir si hay un error.':
          'Reconociste que hay un error, pero necesitás escribir correctamente la palabra completa.'};
    }
    if(task.kind==='orth-fill')return {valid:Boolean(word),
      correct:word===spelling(task.expected),
      reason:'Revisá las letras que faltan, la familia de palabras y la acentuación al escribirla completa.'};
    if(task.kind==='orth-accent'){
      if(selected===null||!word)return {valid:false};
      return {valid:true,
        correct:task.options[selected]===task.unaccented&&word===spelling(task.expected),
        reason:'Identificá la sílaba tónica y aplicá la regla de agudas, graves o esdrújulas. Escribí la palabra completa con tilde.'};
    }
    if(task.kind==='orth-diacritic')return {valid:selected!==null,
      correct:selected!==null&&task.options[selected]===task.expected,
      reason:'La tilde depende de la función y el significado que tiene la palabra en esta oración.'};
    return {valid:false};
  }
  function chooseOrthOption(index) {
    if(!session||session.locked)return;
    session.choice=index;
    app.querySelectorAll('[data-orth-option]').forEach(el=>{
      const selected=Number(el.dataset.orthOption)===index;
      el.classList.toggle('selected',selected);
      el.setAttribute('aria-pressed',String(selected));
    });
    app.querySelector('#fraction-selected-count').textContent='Elegiste: '+(app.querySelector('[data-orth-option="'+index+'"]')?.textContent||'');
  }

  function board(task) {
    if (task.kind === 'discs') return discs();
    if (task.kind === 'squares') return squares();
    if (task.kind === 'mixed') return mixed();
    if (task.kind === 'triangles') return triangles(task);
    if (task.kind === 'unit') return unit(task);
    if (task.kind === 'line') return line(task);
    if (task.kind === 'cards') return `<div class="fraction-fields">
      <label>${esc(task.question1 || '¿Cuántas son de vehículos?')}<input id="fraction-ans1" type="text" inputmode="numeric" autocomplete="off"></label>
      <label>${esc(task.question2 || '¿Cuántas de animales son especiales?')}<input id="fraction-ans2" type="text" inputmode="numeric" autocomplete="off"></label>
    </div>`;
    if (task.kind === 'remainder' || task.kind === 'fractioninput') return `<div class="fraction-fields"><label>${esc(task.question || '¿Qué fracción se obtuvo?')}<input id="fraction-ans1" type="text" inputmode="text" placeholder="Por ejemplo: 3/8" autocomplete="off"></label></div>`;
    if (task.kind === 'number') return `<div class="fraction-fields"><label>${esc(task.question || '¿Cuál es el total?')}<input id="fraction-ans1" type="text" inputmode="numeric" placeholder="Escribí un número" autocomplete="off"></label></div>`;
    if(task.orthographyBlock) return orthoBoard(task);
    if(task.block) return modelBoard(task);
    return '';
  }
  function taskNow() { return session?.tasks[session.index]; }
  function drawUnit() {
    document.getElementById('fraction-board').innerHTML = unit(taskNow());
    bindStepper();
  }
  function bindStepper() {
    document.getElementById('fraction-minus').onclick = () => {
      if (!session.locked && session.added > 0) { session.added--; drawUnit(); }
    };
    document.getElementById('fraction-plus').onclick = () => {
      if (!session.locked && session.added < 30) { session.added++; drawUnit(); }
    };
  }
  function countLabel() {
    const task = taskNow();
    const counts = [0,1].map(group => [...session.selection].filter(k => Math.floor(k/(task.kind==='discs'?8:6))===group).length);
    if (task.kind === 'discs') return `Rueda 1: ${counts[0]}/8 · Rueda 2: ${counts[1]}/8`;
    if (task.kind === 'mixed') return `Tablero 1: ${counts[0]}/6 · Tablero 2: ${counts[1]}/6`;
    if (task.kind === 'line') {
      const tick = [...session.selection][0];
      return tick === undefined ? 'Elegí un punto de la recta.' : `Marcaste ${tick}/${task.denominator}.`;
    }
    if (task.kind === 'visual-paint') return `Pintaste ${session.selection.size} cuadrados.`;
    if (task.kind === 'perimeter-select') return `Marcaste ${session.selection.size} tramos del contorno.`;
    return `Pintaste ${session.selection.size} partes.`;
  }
  function toggleCell(i) {
    if (session?.locked) return;
    if (taskNow().kind === 'line') {
      for (const old of session.selection) {
        const previous=app.querySelector(`[data-fraction-cell="${old}"]`);
        previous?.classList.remove('selected');
        previous?.setAttribute('aria-pressed','false');
      }
      session.selection.clear();
      session.selection.add(i);
    } else if (session.selection.has(i)) session.selection.delete(i);
    else session.selection.add(i);
    const el=app.querySelector(`[data-fraction-cell="${i}"]`);
    el.classList.toggle('selected', session.selection.has(i));
    el.setAttribute('aria-pressed', String(session.selection.has(i)));
    app.querySelector('#fraction-selected-count').textContent = countLabel();
  }
  function showTask() {
    const task=taskNow();
    if (!task) return showSummary();
    session.selection=new Set(); session.choice=null; session.added=0; session.attempts=0; session.hints=0;
    session.locked=false; session.startedAt=Date.now();
    app.innerHTML=`<div class="fraction-progress"><span>Desafío ${session.index+1} de ${session.tasks.length}</span><span>${(session.block||session.orthographyBlock)?'Circuito':'Tanda'} ${esc(session.round)}</span></div>
      <div class="fraction-track"><span style="width:${session.results.size/session.tasks.length*100}%"></span></div>
      <p class="eyebrow">${esc(task.title)}</p><h2>${esc(task.prompt)}</h2>
      <div id="fraction-board" class="fraction-board">${board(task)}</div>
      <p class="fraction-selected" id="fraction-selected-count" aria-live="polite"></p>
      <div id="fraction-feedback" aria-live="polite"></div>
      <div class="fraction-controls">${button('Comprobar','fraction-check')}${button('Dame una pista','fraction-hint',true)}${button('Siguiente desafío','fraction-next')}</div>
      <p class="fraction-info">Podés corregir tu respuesta. Si pedís pistas o revisás un error, queda registrado como resolución con ayuda.</p>`;
    const next=app.querySelector('#fraction-next');
    next.hidden=true;
    const count=app.querySelector('#fraction-selected-count');
    count.textContent=['discs','squares','mixed','triangles','line','visual-paint','perimeter-select'].includes(task.kind)?countLabel():'';
    app.querySelector('#fraction-check').onclick=check;
    app.querySelector('#fraction-hint').onclick=hint;
    next.onclick=advance;
    app.querySelectorAll('[data-fraction-cell]').forEach(el => {
      const id=Number(el.dataset.fractionCell);
      el.addEventListener('click',()=>toggleCell(id));
      el.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleCell(id);}
      });
    });
    app.querySelectorAll('[data-orth-option]').forEach(el => {
      el.addEventListener('click',()=>chooseOrthOption(Number(el.dataset.orthOption)));
    });
    if(task.kind==='unit') bindStepper();
  }
  const readNumber=id=>{
    const s=app.querySelector('#fraction-'+id)?.value.trim()||'';
    const plain = /^\d{1,10}$/.test(s) ? s
      : /^\d{1,3}(?:\.\d{3})+$/.test(s) ? s.replace(/\./g,'') : null;
    return plain === null ? null : Number(plain);
  };
  function readFraction() {
    const value=app.querySelector('#fraction-ans1')?.value.trim()||'';
    const match=/^(\d{1,10})\s*\/\s*(\d{1,10})$/.exec(value);
    return match && Number(match[2])>0?[Number(match[1]),Number(match[2])]:null;
  }
  function evaluate(t) {
    if(t.orthographyBlock) return orthoEvaluate(t);
    if(t.block) return modelEvaluate(t);
    const sel=session.selection;
    if(t.kind==='line') {
      const tick=[...sel][0];
      const correct=sel.size===1 && tick===t.numerator;
      const value=tick===undefined?'ninguno':tick+'/'+t.denominator;
      return {valid:sel.size===1,correct,reason:`Marcaste ${value}. Revisá cuántas partes iguales hay entre 0 y 1 y contá desde el cero.`};
    }
    if(t.kind==='discs') {
      const counts=[0,1].map(g=>[...sel].filter(i=>Math.floor(i/8)===g).length);
      return {valid:sel.size>0,correct:counts.every(n=>n===t.numerator),reason:`Marcaste ${counts[0]} y ${counts[1]} sectores. Revisá la fracción total que pide la consigna en CADA rueda, sin sumar las dos ruedas entre sí.`};
    }
    if(t.kind==='mixed') {
      const counts=[0,1].map(g=>[...sel].filter(i=>Math.floor(i/6)===g).length), part=6*t.numerator/t.denominator;
      return {valid:sel.size>0,correct:(counts[0]===6&&counts[1]===part)||(counts[1]===6&&counts[0]===part),reason:`Marcaste ${counts[0]} y ${counts[1]} cuadrados. Un tablero debe representar una unidad completa y el otro la parte adicional.`};
    }
    if(t.kind==='squares'||t.kind==='triangles') {
      const expected=t.kind==='squares'?t.count*t.numerator/t.denominator:t.target;
      return {valid:sel.size>0,correct:sel.size===expected,reason:`Pintaste ${sel.size} partes. Revisá la cantidad que pide la fracción.`};
    }
    if(t.kind==='unit') {
      const full=t.given*t.totalParts/t.parts, expected=full-t.given;
      return {valid:true,correct:session.added===expected,reason:session.added===full?'Encontraste la unidad completa, pero la pregunta pide cuántas fichas AGREGAR.':`Agregaste ${session.added} fichas. ¿Cuántas faltan para completar la unidad?`};
    }
    if(t.kind==='cards') {
      const other=readNumber('ans1'),special=readNumber('ans2');
      if(other===null||special===null) return {valid:false};
      const mistakes=[];
      const subset=t.subsetLabel || 'animales', rest=t.restLabel || 'vehículos', specialName=t.specialLabel || 'especiales';
      if(other!==t.other) mistakes.push(other===t.portion?`Ese es el total de ${subset}, no de ${rest}.`:`Para encontrar ${rest}, restá ${subset} del total.`);
      if(special!==t.special) mistakes.push(special===t.total/t.smallDenominator?`Calculaste sobre el total general; la parte de ${specialName} se obtiene solo de ${subset}.`:`Calculá la fracción correspondiente a ${specialName} sobre ${subset}.`);
      return {valid:true,correct:other===t.other&&special===t.special,reason:mistakes.join(' ')};
    }
    if(t.kind==='remainder') {
      const f=readFraction();
      if(!f) return {valid:false};
      const correct=f[0]*t.remaining[1]===f[1]*t.remaining[0];
      const covered=f[0]*t.covered[1]===f[1]*t.covered[0];
      return {valid:true,correct,reason:covered?'Esa es la fracción ocupada; la pregunta pide el resto.':'Primero calculá la parte ocupada y restala del entero.'};
    }
    if(t.kind==='fractioninput') {
      const f=readFraction();
      if(!f)return {valid:false};
      const correct=f[0]*t.expected[1]===f[1]*t.expected[0];
      return {valid:true,correct,reason:'Una fracción de otra se calcula multiplicando numeradores entre sí y denominadores entre sí. Después podés simplificar.'};
    }
    if(t.kind==='number') {
      const n=readNumber('ans1');
      return {valid:n!==null,correct:n===t.expected,reason:'Si conocés una parte, averiguá cuánto vale una fracción unitaria antes de reconstruir el total.'};
    }
    return {valid:false};
  }
  function feedback(html) { app.querySelector('#fraction-feedback').innerHTML=html; }
  function hint() {
    if(!session||session.locked)return;
    const t=taskNow();
    if(session.hints>=2||session.attempts>=2) return showSolution();
    feedback(notice(`Pista ${session.hints+1}`,esc(t.hints[session.hints])));
    session.hints++;
    if(session.hints>=2) app.querySelector('#fraction-hint').textContent='Ver explicación';
  }
  function steps(t) { return `<ol class="fraction-steps">${t.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`; }
  function storeResult(status) {
    const task=taskNow();
    const result={id:task.id,round:session.round,block:session.block||null,orthographyBlock:session.orthographyBlock||null,status,skill:task.skill,difficulty:task.difficulty,durationMs:Math.max(0,Date.now()-session.startedAt)};
    session.results.set(task.id,result);
    try{session.onResult(result);}catch(err){console.error('[Desafíos] Error al guardar resultado',err);}
  }
  function lock() {
    session.locked=true;
    app.querySelector('#fraction-check').hidden=true;
    app.querySelector('#fraction-hint').hidden=true;
    app.querySelector('#fraction-next').hidden=false;
    app.querySelectorAll('[data-fraction-cell]').forEach(el=>{el.setAttribute('aria-disabled','true');el.tabIndex=-1;});
    app.querySelectorAll('input').forEach(el=>el.disabled=true);
    app.querySelectorAll('[data-orth-option]').forEach(el=>el.disabled=true);
    app.querySelectorAll('#fraction-plus,#fraction-minus').forEach(el=>el.disabled=true);
  }
  function check() {
    if(!session||session.locked)return;
    const task=taskNow(), answer=evaluate(task);
    if(!answer.valid) return feedback(notice('Falta una respuesta','Elegí partes o completá todos los casilleros antes de comprobar.'));
    session.attempts++;
    if(answer.correct){
      const helped=session.hints>0||session.attempts>1;
      storeResult(helped?'ayuda':'autonoma');
      feedback(notice(helped?'¡Lo resolviste!':'¡Muy bien!',
        `${helped?'Pudiste revisar tu respuesta y llegar al resultado.':'Lo resolviste sin pistas.'}<details><summary>Ver explicación</summary>${steps(task)}</details>`,true));
      lock();
    }else{
      feedback(notice('Todavía no está resuelto',esc(answer.reason)+'<p>Podés corregir la respuesta e intentarlo otra vez.</p>'));
      if(session.attempts>=2)app.querySelector('#fraction-hint').textContent='Ver explicación';
    }
  }
  function showSolution() {
    if(!session||session.locked)return;
    storeResult('revisar');
    feedback(notice('Veamos el procedimiento',steps(taskNow())+'<p>Este desafío queda señalado para practicar con nuevos datos.</p>'));
    lock();
  }
  function advance() {
    if(!session||!session.locked)return;
    session.index++;
    while(session.index<session.tasks.length&&session.results.has(session.tasks[session.index].id))session.index++;
    if(session.index>=session.tasks.length)showSummary();else showTask();
  }
  function showSummary() {
    if(!session)return;
    const results=[...session.results.values()], count=status=>results.filter(r=>r.status===status).length;
    const names={autonoma:'✓ Sin ayuda',ayuda:'↗ Con ayuda',revisar:'↺ Para revisar'};
    app.innerHTML=`<p class="eyebrow">${(session.block||session.orthographyBlock)?"Circuito":"Tanda"} ${esc(session.round)} completado</p><h2>¡Terminaste los desafíos!</h2>
      <p>Este resumen es de la práctica realizada: no representa una calificación ni un porcentaje de dominio.</p>
      <div class="fraction-summary"><div><strong>${count('autonoma')}</strong><span>Sin ayuda</span></div><div><strong>${count('ayuda')}</strong><span>Con ayuda</span></div><div><strong>${count('revisar')}</strong><span>Para revisar</span></div></div>
      <ul class="fraction-summary-list">${session.tasks.map(t=>`<li><span>${esc(t.title)}</span><b>${names[session.results.get(t.id)?.status]||'Pendiente'}</b></li>`).join('')}</ul>
      <p class="fraction-info">La app guardará estos intentos en tu perfil y sugerirá nuevas actividades según lo que necesitás practicar.</p>
      <div class="fraction-controls">${button('Volver a la app','fraction-finish')}</div>`;
    app.querySelector('#fraction-finish').onclick=close;
    if(!session.completeNotified){
      session.completeNotified=true;
      try{session.onComplete({round:session.round,block:session.block||null,orthographyBlock:session.orthographyBlock||null,results});}catch(err){console.error('[Desafíos] Error al registrar la sesión',err);}
    }
  }
  function close() {
    if(dialog.open)dialog.close();
    session=null;
    document.getElementById('fraction-challenge-title').textContent='Desafíos de ingreso: Fracciones';
    const subtitle=document.getElementById('fraction-challenge-subtitle');
    if(subtitle) subtitle.textContent='Matemática · práctica individual';
  }
  if(dialog&&app&&closeButton){
    closeButton.addEventListener('click',close);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  }
  async function open({round='A',block=null,orthographyBlock=null,prior=[],onResult=()=>{},onComplete=()=>{}}={}) {
    if(!dialog||!app||loading||dialog.open||!['A','B','C','D','E','F','G','H'].includes(round))return;
    if(block!==null && !['R','P'].includes(block))return;
    if(orthographyBlock!==null && !['D','J','B','A','T'].includes(orthographyBlock))return;
    if(block&&orthographyBlock)return;
    if((block||orthographyBlock) && !['A','B'].includes(round))return;
    loading=true;
    dialog.showModal();
    app.innerHTML='<p role="status">Cargando los desafíos…</p>';
    try{
      const version=document.querySelector('meta[name="app-version"]')?.content || '6.31.0';
      const source=orthographyBlock?'./data/desafios-ortografia.json':block?'./data/desafios-modelo.json':'./data/desafios-fracciones.json';
      const response=await fetch(source+'?v='+encodeURIComponent(version));
      if(!response.ok)throw new Error('No se pudo cargar el banco de desafíos');
      const data=await response.json();
      const tasks=orthographyBlock?data.blocks?.[orthographyBlock]?.[round]:block?data.blocks?.[block]?.rounds?.[round]:data.rounds?.[round];
      document.getElementById('fraction-challenge-title').textContent=orthographyBlock
        ? 'Desafíos de Lengua: '+(data.blocks?.[orthographyBlock]?.label||'Ortografía')
        :block?'Desafíos de ingreso: '+(data.blocks?.[block]?.label||'Práctica por bloques')
        :'Desafíos de ingreso: Fracciones';
      const subtitle=document.getElementById('fraction-challenge-subtitle');
      if(subtitle)subtitle.textContent=orthographyBlock?'Lengua · Ortografía · práctica individual':'Matemática · práctica individual';
      if(!Array.isArray(tasks)||tasks.length!==7||new Set(tasks.map(t=>t.id)).size!==7)throw new Error('Banco de desafíos incompleto');
      if(!dialog.open)return;
      const taskIds=new Set(tasks.map(t=>t.id));
      const results=new Map(prior.filter(r=>taskIds.has(r.id)&&['autonoma','ayuda','revisar'].includes(r.status)).map(r=>[r.id,r]));
      session={round,block,orthographyBlock,tasks,index:0,results,onResult,onComplete,selection:new Set(),choice:null,added:0,attempts:0,hints:0,locked:false,completeNotified:false,startedAt:0};
      while(session.index<tasks.length&&results.has(tasks[session.index].id))session.index++;
      if(session.index===tasks.length)showSummary();else showTask();
    }catch(error){
      console.error('[Desafíos]',error);
      app.innerHTML='<p role="alert">No se pudieron cargar los desafíos. Revisá la conexión y volvé a intentarlo.</p>';
    }finally{loading=false;}
  }
  window.IngresoFractionChallenges={open,close};
})();
