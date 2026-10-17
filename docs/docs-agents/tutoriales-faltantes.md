# Tutoriales externos faltantes

Lista de trabajo de los trucos del piloto de tutoriales (familia de Wackknife y trucos basicos y populares) que todavia no tienen un tutorial externo aprobado. La mantienen las tareas de contenido. Es la referencia para que el usuario pase enlaces manualmente cuando los tenga.

Este documento esta referenciado desde `AGENTS.md`. No se duplica su contenido en otros documentos.

## Como se armaron los tutoriales aprobados

Proceso aplicado en la corrida de contenido:

1. Consulta exacta por truco: `<nombre> tricking tutorial`, primero en espanol (`tutorial <nombre> tricking espanol` y variantes) y luego en ingles.
2. Variantes por sitio cuando la busqueda general no daba un canal claro (por ejemplo `site:youtube.com`, o el nombre del truco con `b-kick`, `btwist`, `backflip`).
3. Validacion de la metadata con oEmbed del proveedor, sin API keys: `https://www.youtube.com/oembed?url=<url>&format=json` (y equivalentes de Vimeo, Dailymotion y TikTok). Se confirmo titulo y autor reales antes de guardar.
4. Criterios de seguridad (regla conservadora de `reglas-legal.md` y `reglas-contenido-trucos.md`): solo canales oficiales o reconocidos de la comunidad, que ensenen el truco y sin menores visibles. Ante cualquier duda, el candidato no se incluye.
5. Los aprobados quedan en `packages/db/src/seed/tutorial-sources/*.json` y se siembran con `role='tutorial'` y su `language`.

Nota sobre el idioma: se buscó primero en espanol en todos los casos. Para la familia de Wackknife y para los basicos del piloto, los resultados en espanol fueron canales pequenos o no verificables (motivacion, parkour amateur), que no cumplen el criterio de "canal reconocido". Por eso los tutoriales aprobados quedaron en ingles. Los candidatos en espanol encontrados quedan abajo como sugerencia para que el usuario los revise y decida.

## Trucos del piloto sin tutorial aprobado

Columna `Enlace`: vacia. El usuario puede pegar una URL de YouTube, Vimeo, Dailymotion o TikTok y la tarea de contenido la valida con oEmbed y la agrega a la semilla.

### Familia de Wackknife

| Truco                      | trickId                    | Seccion        | Consultas intentadas                                                                         | Resultado                                                                                        | Enlace |
| -------------------------- | -------------------------- | -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Wackknife Round            | `wackknifeRound`           | vertical-kicks | `wackknife round tricking tutorial`, `wackknife round turbo doubleleg tricking tutorial`     | Sin tutorial dedicado. Solo aparece el tutorial general de Wack-Knife y las fichas de Loopkicks. |        |
| Wackknife Turbo            | `wackknifeTurbo`           | vertical-kicks | `wackknife turbo tricking tutorial`, `wackknife round turbo doubleleg tricking tutorial`     | Sin tutorial dedicado. Ficha de Loopkicks sin video de ensenanza propio.                         |        |
| Wackknife Doubleleg        | `wackknifeDoubleleg`       | vertical-kicks | `wackknife doubleleg tricking tutorial`, `wackknife round turbo doubleleg tricking tutorial` | Sin tutorial dedicado. Los resultados apuntan a double leg generico, no al Wackknife.            |        |
| Backside 1260 Wackknife    | `backside1260Wackknife`    | vertical-kicks | `backside 1260 wackknife tricking tutorial`                                                  | Sin tutorial dedicado. Truco muy avanzado y poco documentado en video.                           |        |
| Full Wackknife             | `fullWackknife`            | backward       | `full wackknife tricking tutorial`                                                           | Sin tutorial dedicado. Solo fichas de Loopkicks y el tutorial general de Wack-Knife.             |        |
| Full Wackknife Round       | `fullWackknifeRound`       | backward       | `full wackknife round tricking tutorial`                                                     | Sin tutorial dedicado.                                                                           |        |
| Full Wackknife Hyperhook   | `fullWackknifeHyperhook`   | backward       | `full wackknife hyperhook tricking tutorial`                                                 | Sin tutorial dedicado. Ficha de Loopkicks sin video de ensenanza propio.                         |        |
| Corkscrew Wackknife        | `corkscrewWackknife`       | backward       | `corkscrew wackknife tricking tutorial`                                                      | Sin tutorial dedicado. Aparecen tutoriales de corkscrew y de Wackknife por separado.             |        |
| Double Corkscrew Wackknife | `doubleCorkscrewWackknife` | backward       | `double corkscrew wackknife tricking tutorial`                                               | Sin tutorial dedicado.                                                                           |        |
| Rodeo Full Wackknife       | `rodeoFullWackknife`       | backward       | `rodeo full wackknife tricking tutorial`                                                     | Sin tutorial dedicado.                                                                           |        |
| Gainer Wackknife           | `gainerWackknife`          | backward       | `gainer wackknife tricking tutorial`                                                         | Sin tutorial dedicado. Aparecen tutoriales de gainer o de gainer flash, no del Wackknife.        |        |
| Butterfly Twist Wackknife  | `butterflyTwistWackknife`  | inside         | `butterfly twist wackknife tricking tutorial`                                                | Sin tutorial dedicado. Hay tutoriales de b-twist y de Wackknife por separado.                    |        |
| Tak Full Wackknife         | `takFullWackknife`         | inside         | `tak full wackknife tricking tutorial`                                                       | Sin tutorial dedicado.                                                                           |        |
| Sailor Moon Wackknife      | `sailorMoonWackknife`      | outside        | `sailor moon wackknife tricking tutorial`                                                    | Sin tutorial dedicado.                                                                           |        |
| Wackest Knife              | `wackestKnife`             | vertical-kicks | `wackest knife tricking tutorial`                                                            | Sin tutorial dedicado.                                                                           |        |
| Crackknife                 | `crackknife`               | outside        | `crackknife tricking tutorial`                                                               | Sin tutorial dedicado.                                                                           |        |

### Basicos y populares

Todos los trucos basicos y populares elegidos en el piloto quedaron con tutorial aprobado (ver la seccion siguiente). Si se suman mas trucos populares en la proxima ola, se agregan a esta tabla.

## Tutoriales aprobados en el piloto

Estos ya estan en `packages/db/src/seed/tutorial-sources/` y se siembran con `language: 'en'`. Todos son de canales reconocidos y el truco es el tema central del video.

| Truco           | trickId          | Autor                  | Video                                          |
| --------------- | ---------------- | ---------------------- | ---------------------------------------------- |
| Wackknife       | `wackknife`      | Mastering Tricking 22  | Wack-Knife (The Mastering Series)              |
| Tornado         | `tornado`        | Thomas Inauen          | How To Tornado Kick - In 3 Steps For Beginners |
| Butterfly Kick  | `butterflyKick`  | Ronnie Street Stunts   | How To BUTTERFLY KICK - Free Running Tutorial  |
| Butterfly Twist | `butterflyTwist` | Ginger Ninja Trickster | Butterfly Twist Tutorial (B-Twist)             |
| Back Tuck       | `backTuck`       | Ginger Ninja Trickster | Back Flip (Back Tuck) Tutorial                 |
| Aerial          | `aerial`         | Mastering Tricking 22  | Easy How To Aerial                             |
| Roundoff        | `roundoff`       | Strength Project       | How to do a Round Off Tutorial                 |
| 540             | `540`            | Ginger Ninja Trickster | Taekwondo 540 Kick Tutorial                    |
| Corkscrew       | `corkscrew`      | Kojos Trick Lab        | CORK TUTORIAL                                  |
| Gainer Flash    | `gainerFlash`    | Zak Ferguson           | How to Gainer Flash                            |
| Double Full     | `doubleFull`     | Plan Zero              | How to Double Full (Backflip 720)              |
| Raiz            | `raiz`           | Johzuke                | Raiz and Touchdown Raiz                        |
| Scoot           | `scoot`          | Ronnie Street Stunts   | How To SCOOT                                   |
| Front Tuck      | `frontTuck`      | Hadyn Wiseman          | How To Frontflip For Beginners                 |
| Sideflip        | `sideflip`       | Omar Zaki              | SIDEFLIP Tutorial                              |

## Candidatos en espanol para revisar

Se encontraron, pero NO se incluyeron por no ser un canal claramente reconocido de tricking (regla conservadora). El usuario puede revisarlos y, si los aprueba, pasarlos para agregarlos.

| Truco      | Consulta                                          | Candidato                                    | Canal                  |
| ---------- | ------------------------------------------------- | -------------------------------------------- | ---------------------- |
| Back Tuck  | `tutorial mortal atras backflip tricking espanol` | Como hacer un mortal hacia atras paso a paso | KALISTENIKA MOTIVACION |
| Back Tuck  | `tutorial mortal atras backflip tricking espanol` | Tutorial de Mortal Hacia Atras               | Sport Ranger Moves     |
| Back Tuck  | `tutorial mortal atras backflip tricking espanol` | Tutorial del Backflip en 4 pasos             | ElMuni Parkour         |
| 540        | `como hacer 540 kick tutorial espanol tricking`   | Como dominar la 540 Kick                     | Mauchas Tkd            |
| 540        | `como hacer 540 kick tutorial espanol tricking`   | Aprende como hacer la patada 540             | RUNFIT                 |
| Front Tuck | `tutorial dart flip front tuck espanol acrobacia` | Frontflip Tutorial #2 (espanol)              | Shifer                 |
| Aerial     | `tutorial aerial tricking espanol como hacer`     | Tutorial Aerial en 30 segundos               | Instagram (reel)       |

Nota: para la familia de Wackknife no se encontro ningun candidato en espanol; la busqueda devolvio solo el tutorial en ingles y fichas de Loopkicks.

## Como agregar un tutorial

1. Validar el enlace con oEmbed del proveedor (titulo y autor reales, sin API key).
2. Confirmar que es un canal oficial o reconocido, que ensena el truco y que no aparecen menores visibles. Ante duda, no se agrega.
3. Agregar la entrada en `packages/db/src/seed/tutorial-sources/*.json` con los campos `trickId`, `provider`, `url`, `embedUrl`, `author`, `title`, `language`, `kind` y `aspect`.
4. Al aprobarlo, quitar la fila de este documento o marcar el estado como listo.
5. Sembrar con el script de tutoriales del paquete de base de datos.
