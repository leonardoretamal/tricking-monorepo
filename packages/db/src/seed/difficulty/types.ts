// Dificultad curada (0 a 5) por id de truco. Cada seccion tiene su archivo para que
// las fases puedan curar su seccion sin pisarse. Regla de la propuesta inicial:
// base por rotacion (360 -> 2, 540/720 -> 3, 900/1080 -> 4, 1260/1440/1620 -> 5),
// variante compuesta +1, tope 5. Es ajustable por el usuario.

export type SectionDifficulty = Record<string, number>;
