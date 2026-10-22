"use strict";
/* Ilustración vectorial original de las cinco tierras — sin recursos externos. */
const NEURO_WORLD_MAP_SVG = String.raw`<svg class="neuro-world-art" viewBox="0 0 1100 650" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Un mapa ilustrado con cinco territorios conectados por caminos: Ciudad Central, Valle de la Neurona, Bosque Sensorial, Ruta de los Reflejos y Torre Final">
<defs>
<linearGradient id="skyland" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c5edfb"/><stop offset="1" stop-color="#f2fbf1"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#94d8e9"/><stop offset="1" stop-color="#d8f5ee"/></linearGradient>
<linearGradient id="earth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f2d8a8"/><stop offset="1" stop-color="#cd9c77"/></linearGradient>
<linearGradient id="greenLand" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#b1e9ac"/><stop offset="1" stop-color="#7bc8aa"/></linearGradient>
<linearGradient id="purpleLand" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e3d3fb"/><stop offset="1" stop-color="#b7c1ef"/></linearGradient>
<linearGradient id="roseLand" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffdbba"/><stop offset="1" stop-color="#ffa89e"/></linearGradient>
<filter id="landShadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="12" stdDeviation="11" flood-color="#376587" flood-opacity=".22"/></filter>
<pattern id="wavePattern" width="48" height="32" patternUnits="userSpaceOnUse"><path d="M2 22Q12 16 23 22T46 22" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/></pattern>
</defs>
<rect width="1100" height="650" rx="38" fill="url(#skyland)"/>
<path d="M0 195Q115 105 250 180T570 195T880 175T1100 225V650H0Z" fill="url(#sea)" opacity=".9"/>
<path d="M0 195Q115 105 250 180T570 195T880 175T1100 225V650H0Z" fill="url(#wavePattern)" opacity=".75"/>
<g fill="none" stroke="#fff" stroke-width="3" opacity=".75"><path d="M0 92Q150 30 265 100T495 85T740 115T1100 40"/><path d="M0 580Q225 525 365 603T750 584T1100 550"/></g>
<!-- Glowing star dust -->
<g fill="#fff" opacity=".9"><circle cx="60" cy="130" r="5"/><circle cx="330" cy="54" r="4"/><circle cx="598" cy="86" r="6"/><circle cx="1000" cy="86" r="4"/><circle cx="1040" cy="334" r="5"/><circle cx="75" cy="440" r="4"/><circle cx="545" cy="515" r="4"/></g>
<!-- Curving dotted route -->
<path d="M235 195C310 120 356 96 440 143S641 260 760 200S810 333 710 418S485 475 350 448" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".8"/>
<path d="M235 195C310 120 356 96 440 143S641 260 760 200S810 333 710 418S485 475 350 448" fill="none" stroke="#5b8c9f" stroke-width="5" stroke-dasharray="1 17" stroke-linecap="round"/>
<!-- Land 1 -->
<g filter="url(#landShadow)">
<path d="M34 156Q13 101 90 88Q141 45 196 93Q282 81 293 149Q326 194 266 235Q209 274 142 239Q70 263 39 218Q5 190 34 156Z" fill="url(#earth)" stroke="#fff7e7" stroke-width="9"/>
<path d="M44 157Q58 94 112 110Q149 70 194 108Q261 91 273 152Q282 209 223 221Q167 246 123 218Q72 226 44 187Z" fill="#d1e9b6"/>
</g>
<!-- City / brain icon -->
<g stroke="#416e95" stroke-linejoin="round"><rect x="100" y="117" width="27" height="63" rx="5" fill="#73c1e2" stroke-width="3"/><rect x="132" y="100" width="34" height="80" rx="6" fill="#74b2e6" stroke-width="3"/><rect x="171" y="127" width="27" height="53" rx="4" fill="#93d7f0" stroke-width="3"/><rect x="202" y="113" width="30" height="67" rx="5" fill="#7bb7c6" stroke-width="3"/><path d="M95 181H237" stroke-width="6"/></g>
<g fill="#f5f9ff"><rect x="140" y="112" width="7" height="8" rx="2"/><rect x="151" y="112" width="7" height="8" rx="2"/><rect x="140" y="127" width="7" height="8" rx="2"/><rect x="151" y="127" width="7" height="8" rx="2"/><rect x="110" y="129" width="7" height="8" rx="2"/><rect x="110" y="143" width="7" height="8" rx="2"/></g>
<path d="M131 102Q116 73 137 67Q153 48 164 66Q180 54 185 76Q202 86 184 98Q164 109 153 100Q140 111 131 102Z" fill="#ffc9d8" stroke="#b678ae" stroke-width="4"/>
<!-- Land 2 -->
<g filter="url(#landShadow)"><path d="M348 108Q365 49 446 61Q502 26 543 68Q614 56 642 108Q685 148 641 192Q603 237 542 209Q486 232 438 206Q367 218 345 175Q316 147 348 108Z" fill="url(#purpleLand)" stroke="#fff" stroke-width="9"/></g>
<g stroke="#8b70ba" fill="none" stroke-width="8" stroke-linecap="round"><path d="M438 145L402 105 376 100M422 128L404 168 375 179M438 145L489 145 533 145 584 145M584 145L609 112M584 145L615 162M584 145L601 185"/></g>
<g fill="#f8d4fb" stroke="#8b70ba" stroke-width="4"><ellipse cx="438" cy="145" rx="30" ry="25"/><circle cx="439" cy="145" r="10" fill="#8f87cb"/></g>
<g stroke="#fff5c3" stroke-width="5" stroke-linecap="round"><path d="M490 130v30M526 130v30M563 130v30"/></g>
<!-- Land 3 -->
<g filter="url(#landShadow)"><path d="M699 140Q717 93 779 99Q841 66 886 109Q951 106 973 165Q1003 207 948 258Q904 291 837 258Q757 280 709 233Q668 192 699 140Z" fill="url(#greenLand)" stroke="#f7ffea" stroke-width="9"/></g>
<g stroke="#397c72" stroke-width="7" stroke-linecap="round"><path d="M754 223V171M822 233V160M907 230V168M875 244V199"/></g>
<g fill="#74bda0" stroke="#4fa28c" stroke-width="3"><circle cx="754" cy="157" r="27"/><circle cx="735" cy="173" r="19"/><circle cx="774" cy="178" r="19"/><circle cx="822" cy="148" r="37"/><circle cx="800" cy="164" r="20"/><circle cx="846" cy="167" r="22"/><circle cx="907" cy="158" r="32"/><circle cx="882" cy="176" r="19"/><circle cx="930" cy="178" r="19"/></g>
<g fill="#fff2af"><circle cx="790" cy="206" r="9"/><circle cx="866" cy="224" r="9"/><circle cx="945" cy="207" r="7"/></g>
<!-- Land 4 -->
<g filter="url(#landShadow)"><path d="M167 433Q153 374 216 345Q280 310 330 346Q400 333 450 374Q483 441 435 493Q395 551 319 534Q253 568 199 518Q141 506 167 433Z" fill="url(#roseLand)" stroke="#fff5e5" stroke-width="9"/></g>
<g fill="none" stroke="#fffdf7" stroke-width="19" stroke-linecap="round"><path d="M204 491Q223 403 287 432T406 407"/></g>
<g fill="none" stroke="#bf8c81" stroke-width="4" stroke-dasharray="4 13" stroke-linecap="round"><path d="M204 491Q223 403 287 432T406 407"/></g>
<g fill="#f9efbe" stroke="#9d6c68" stroke-width="5"><rect x="260" y="360" width="44" height="42" rx="6"/><rect x="354" y="394" width="44" height="44" rx="6"/></g>
<path d="M270 367l12 22 12-22M374 401v24" stroke="#f39a72" stroke-width="5" fill="none"/>
<!-- Land 5 -->
<g filter="url(#landShadow)"><path d="M654 427Q644 366 711 344Q755 300 823 336Q899 315 948 382Q996 452 930 506Q890 552 808 539Q742 558 694 513Q636 498 654 427Z" fill="url(#earth)" stroke="#fff7e7" stroke-width="9"/></g>
<path d="M685 456Q696 397 760 390Q801 350 861 393Q916 394 941 457Q913 522 828 515Q752 530 685 456Z" fill="#bde6c7"/>
<g stroke="#9573a4" stroke-width="5" stroke-linejoin="round"><path d="M771 465V387H797V365H818V329H848V365H873V387H900V465Z" fill="#a6a6e9"/><path d="M771 389L783 377 797 389M797 366L809 354 818 366M818 329l15-32 15 32M848 365l12-11 13 11M873 389l13-12 14 12" fill="#806cbd"/></g>
<rect x="820" y="414" width="33" height="51" rx="16" fill="#fbe2a3" stroke="#9573a4" stroke-width="4"/>
<g fill="#ffedb4"><rect x="779" y="401" width="12" height="15" rx="3"/><rect x="878" y="401" width="12" height="15" rx="3"/><circle cx="833" cy="369" r="11"/></g>
<!-- Sparks and map details -->
<g fill="#f8fff2" stroke="#71afbd" stroke-width="2"><path d="M76 335l9 17-9 17-9-17Z"/><path d="M582 309l8 15-8 15-8-15Z"/><path d="M1008 392l10 19-10 19-10-19Z"/></g>
<g font-size="30" opacity=".9"><text x="70" y="565">✦</text><text x="560" y="70">✧</text><text x="1020" y="268">✦</text></g>
</svg>`;
