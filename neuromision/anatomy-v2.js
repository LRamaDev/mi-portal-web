"use strict";
/* Diagramas vectoriales v2 con regiones coloreadas, sin respuestas escritas. */
const NEURO_HUMAN_V2=String.raw`<svg viewBox="120 10 300 332" role="img" aria-label="Ilustración ampliada de cuerpo humano con cerebro, cerebelo, médula espinal y red de nervios">
<defs>
 <linearGradient id="hmBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d1f3ff"/><stop offset=".54" stop-color="#88c9e6"/><stop offset="1" stop-color="#6aaacb"/></linearGradient>
 <linearGradient id="hmBrain" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#ffbdcd"/><stop offset="1" stop-color="#d696d8"/></linearGradient>
 <filter id="hmGlow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#4694ad" flood-opacity=".27"/></filter>
</defs>
<g opacity=".42" fill="none" stroke="#9dd9e9" stroke-width="2"><circle cx="270" cy="165" r="125"/><circle cx="270" cy="165" r="94"/><path d="M128 160H412M270 22V337"/></g>
<g opacity=".5"><circle cx="180" cy="74" r="8" fill="#fff"/><circle cx="361" cy="92" r="5" fill="#79c8e2"/><circle cx="156" cy="277" r="5" fill="#93e5ce"/><circle cx="388" cy="277" r="7" fill="#fff"/></g>
<!-- Silueta corporal -->
<path d="M270 21C238 21 217 45 218 76C217 97 227 114 242 124L235 135L194 148Q163 155 151 187L122 264Q121 271 131 275L146 280Q151 280 154 273L187 220L198 215L209 288L231 337H260L270 268L280 337H309L331 288L342 215L353 220L386 273Q389 280 394 280L409 275Q419 271 418 264L389 187Q377 155 346 148L305 135L298 124C313 114 323 97 322 76C323 45 302 21 270 21Z" fill="url(#hmBody)" stroke="#548eb7" stroke-width="3.5" filter="url(#hmGlow)"/>
<path d="M245 134Q270 145 295 134M227 152Q270 168 313 152M269 173V316" stroke="#e7fbff" stroke-width="3.5" opacity=".38" fill="none"/>
<!-- Encéfalo -->
<path d="M236 69Q231 52 246 48Q249 35 264 40Q277 30 290 44Q307 43 309 58Q320 71 307 82Q310 96 294 101Q283 107 273 99Q255 106 247 97Q227 97 231 82Q223 73 236 69Z" fill="url(#hmBrain)" stroke="#ae6fbd" stroke-width="2.8"/>
<g fill="none" stroke="#ba70bb" stroke-width="2" stroke-linecap="round"><path d="M247 45Q245 57 258 62Q246 70 252 83M269 39Q278 54 267 64Q282 76 275 94M293 47Q284 61 297 73Q286 83 296 96M237 74Q252 73 256 93"/></g>
<!-- Cerebelo diferenciado -->
<path d="M279 98Q286 89 299 93Q318 97 313 111Q308 124 292 120Q281 118 279 110Z" fill="#f4db82" stroke="#ba9548" stroke-width="2.6"/>
<path d="M288 103Q299 98 308 107M288 113Q301 108 307 116" stroke="#d6ae55" stroke-width="2" fill="none"/>
<!-- Médula -->
<path d="M270 111Q268 155 270 203T269 287" fill="none" stroke="#fff0b8" stroke-width="11" stroke-linecap="round"/>
<path d="M270 113Q268 155 270 203T269 287" fill="none" stroke="#eba864" stroke-width="4" stroke-linecap="round"/>
<!-- Nervios periféricos, ramificaciones -->
<g fill="none" stroke="#1b9baf" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M270 149L231 166 193 188 171 231M270 155L310 167 348 188 369 230"/>
<path d="M270 183L223 205 188 245 162 257M270 183L317 205 351 245 379 257"/>
<path d="M270 211L245 244 236 290 227 319M270 211L295 244 304 290 312 319"/>
<path d="M270 235L252 265 253 310M270 235L288 265 287 310"/>
</g>
<g fill="#e1feff" stroke="#0a8ea3" stroke-width="2"><circle cx="193" cy="188" r="4"/><circle cx="348" cy="188" r="4"/><circle cx="162" cy="257" r="4"/><circle cx="379" cy="257" r="4"/><circle cx="236" cy="290" r="4"/><circle cx="304" cy="290" r="4"/></g>
</svg>`;
const NEURO_NEURON_V2=String.raw`<svg viewBox="0 0 660 300" role="img" aria-label="Ilustración detallada de neurona con dendritas, cuerpo celular, axón, mielina y terminales">
<defs>
<linearGradient id="nnSoma" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#98ebeb"/><stop offset="1" stop-color="#b6a0f1"/></linearGradient>
<linearGradient id="nnMyelin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff6ae"/><stop offset=".5" stop-color="#d9f59c"/><stop offset="1" stop-color="#9fe0be"/></linearGradient>
<filter id="nnShadow"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#619cb9" flood-opacity=".24"/></filter>
</defs>
<g opacity=".48" fill="none" stroke="#badfed" stroke-width="2"><circle cx="244" cy="151" r="120"/><circle cx="244" cy="151" r="90"/><path d="M18 150H643M329 0V300"/></g>
<g fill="#fff" opacity=".8"><circle cx="58" cy="46" r="6"/><circle cx="418" cy="61" r="5"/><circle cx="622" cy="44" r="8"/><circle cx="584" cy="260" r="4"/></g>
<!-- Dendritas, con ramificaciones finas -->
<g fill="none" stroke="#168ea9" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
<path d="M212 132L168 122 130 82 92 74M175 126L137 151 82 145M204 111L177 76 144 52M206 173L172 202 120 229M184 186L138 187 91 213M220 198L200 233 168 260"/>
</g>
<g fill="none" stroke="#8bdac6" stroke-width="4" stroke-linecap="round"><path d="M130 82L109 51M130 82L108 104M137 151L98 174M144 52L140 27M120 229L98 254M168 260L164 282M91 213L65 206"/></g>
<!-- Soma y núcleo -->
<path d="M203 124Q221 94 260 101Q300 98 320 127Q349 151 320 185Q300 216 255 212Q218 214 198 180Q181 151 203 124Z" fill="url(#nnSoma)" stroke="#4f9caf" stroke-width="4" filter="url(#nnShadow)"/>
<path d="M217 130Q224 111 245 113M218 187Q247 213 278 195M301 122Q321 142 314 166" fill="none" stroke="#e9ffff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
<circle cx="257" cy="154" r="28" fill="#7662bb" stroke="#faf0ff" stroke-width="4"/>
<circle cx="261" cy="150" r="9" fill="#edccff"/>
<!-- Axón continuo y segmento mielínico -->
<path d="M316 155H573" stroke="#b56f8d" stroke-width="15" stroke-linecap="round"/>
<path d="M316 155H573" stroke="#ffd0bd" stroke-width="8" stroke-linecap="round"/>
<g fill="url(#nnMyelin)" stroke="#6ab89b" stroke-width="3.2" filter="url(#nnShadow)">
<rect x="340" y="132" width="44" height="45" rx="21"/><rect x="398" y="132" width="44" height="45" rx="21"/><rect x="456" y="132" width="44" height="45" rx="21"/>
</g>
<g fill="none" stroke="#c4a76b" stroke-width="2"><path d="M363 138Q350 155 363 170M421 138Q408 155 421 170M478 138Q465 155 478 170"/></g>
<!-- Terminales sinápticas -->
<g fill="none" stroke="#c47b91" stroke-width="8" stroke-linecap="round"><path d="M570 155L598 119 630 100M570 155L609 153 641 164M570 155L599 195 625 220"/></g>
<g fill="#ffc9b4" stroke="#ad5a7e" stroke-width="2"><circle cx="631" cy="100" r="10"/><circle cx="642" cy="164" r="10"/><circle cx="627" cy="220" r="10"/></g>
<g fill="#d6a1d8"><circle cx="607" cy="91" r="4"/><circle cx="648" cy="130" r="4"/><circle cx="614" cy="244" r="5"/></g>
</svg>`;
