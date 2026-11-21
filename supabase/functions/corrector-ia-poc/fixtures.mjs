// Solo relatos inventados para pruebas técnicas. No incorporar textos reales de estudiantes.
export const FIXTURES = Object.freeze({
  "ficcion-01": Object.freeze({
    consigna: "Continuá una narración: alguien descubre una caja cerrada en el patio. Incorporá un conflicto y una resolución sin diálogo.",
    texto: "La caja estaba escondida bajo una maceta. El chico quizo abrirla pero la llave se callo. Despues busco una rama y logro sacar la llave del barro. Cuando la abrió encontro semillas para el jardín."
  }),
  "ficcion-02": Object.freeze({
    consigna: "Narrá una pequeña aventura en una biblioteca. Mostrá una dificultad y su resolución sin utilizar diálogo.",
    texto: "Una mañana el mapa desapareció. La bibliotecaria lo buscó por todos lados estaba muy nerviosa. Finalmente lo encontró dentro de un libro, pero nadie explicó como había llegado ahí."
  })
});

export function getFixture(id) {
  return Object.hasOwn(FIXTURES, id) ? FIXTURES[id] : null;
}
