const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('la portada V2 incluye navegación móvil accesible', () => {
  assert.match(portal, /id="main-nav"/);
  assert.match(portal, /id="menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="main-nav"/);
  assert.match(portal, /menuButton\.addEventListener\('click'/);
  assert.match(portal, /event\.key === 'Escape'/);
});

test('la portada diferencia proyectos principales y complementarios', () => {
  assert.match(portal, /id="proyectos-principales"/);
  assert.match(portal, /id="otros-proyectos"/);
  assert.equal((portal.match(/class="project-card(?: featured)?"/g) || []).length, 6);
  assert.equal((portal.match(/class="project-meta"/g) || []).length, 6);
});

test('la etapa 2 comunica casos de uso y proyectos activos', () => {
  assert.match(portal, /id="impacto"/);
  assert.match(portal, /De cronogramas a respuestas rápidas/);
  assert.match(portal, /De estudiar “a ciegas” a practicar con guía/);
  assert.match(portal, /De cuentas confusas a acuerdos simples/);
  assert.match(portal, /ERSeP Viaja:/);
  assert.match(portal, /Ingreso Belgrano · Monserrat:/);
  assert.match(portal, /\.use-cases \{[\s\S]*grid-template-columns: 1fr/);
});

test('la identidad para navegador y redes tiene archivos válidos', () => {
  assert.match(portal, /property="og:image" content="https:\/\/lramadev\.github\.io\/mi-portal-web\/assets\/img\/og-lea-rama-dev\.png"/);
  assert.match(portal, /rel="icon" href="\.\/assets\/img\/favicon\.svg"/);

  for (const relativePath of [
    'assets/img/favicon.svg',
    'assets/img/apple-touch-icon.png',
    'assets/img/og-lea-rama-dev.png',
  ]) {
    const stats = fs.statSync(path.join(root, relativePath));
    assert.ok(stats.size > 0, `${relativePath} no puede estar vacío`);
  }
});
