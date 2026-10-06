# Decisiones visuales

Decisiones de diseño del sitio: sistema de temas, paletas, colores semánticos, colores por dificultad, colores por categoría, tipografías, utilidades de efecto y colores de la sección de Tips. Consultar este documento siempre antes de tocar interfaz.

## Sistema de temas

Dos temas, dark-first:

- `tricking-dark`: tema por defecto (`default: true`). El modo oscuro es el default del proyecto.
- `tricking-light`: tema claro, disponible para quien lo elija. No es el default; se usa solo si el sistema prefiere claro o si el usuario lo elige.

La paleta se llama "Neón nocturno". El modo oscuro es la referencia y el claro es su adaptación a fondo claro.

## Resolución del tema

El tema se resuelve en este orden:

1. Preferencia manual guardada en localStorage con la clave `tricking:theme`.
2. Preferencia del sistema vía `prefers-color-scheme`: si el sistema prefiere claro, se usa `tricking-light`.
3. Default del proyecto: `tricking-dark` (modo oscuro).

## Reglas del tema

- El tema se aplica con `data-theme` en `<html>`, nunca con clases condicionales.
- Prohibido escribir colores sueltos con hex en los componentes. Todo sale de las variables del tema.
- El script inline anti-flash vive en el `<head>` del layout raíz y es uno de los dos `dangerouslySetInnerHTML` permitidos sin autorización adicional (el otro es el JSON-LD de datos estructurados, con el carácter `<` escapado).
- El tema persistido usa la clave `tricking:theme` con TTL de 1 año.
- El cambio es instantáneo, sin recargar.
- El botón de toggle tiene `aria-label` descriptivo y `aria-pressed`, y es operable por teclado.

## Tipografías

- `Anton`: titulares display. Se carga con `next/font/google` (peso 400, subsets latin, display swap) y expone la variable `--font-anton`.
- `Inter`: texto de cuerpo. Se carga con `next/font/google` (subsets latin, display swap) y expone la variable `--font-inter`.
- Ambas variables se aplican al elemento `<html>` y se usan desde `globals.css`: el cuerpo toma `--font-sans` (Inter) y los titulares display toman `--font-display` (Anton, con Inter de respaldo).
- `next/font` es parte de Next; no agrega dependencias npm.

## Paleta en modo oscuro (default)

| Rol                  | Nombre         | Valor   |
| -------------------- | -------------- | ------- |
| Fondo principal      | Tinta nocturna | #07080D |
| Fondo de tarjetas    | Azul carbón    | #0F1220 |
| Superficies elevadas | Azul profundo  | #171B2E |
| Bordes               | Acero nocturno | #232842 |
| Texto principal      | Blanco humo    | #F5F7FC |
| Texto secundario     | Gris piedra    | #8A92A8 |
| Primario             | Rosa neón      | #FF2E88 |
| Contenido primario   | Tinta nocturna | #0A0B10 |
| Secundario           | Lima neón      | #C6FF3D |
| Contenido secundario | Tinta nocturna | #0A0B10 |
| Acento               | Violeta neón   | #7C6CFF |
| Contenido de acento  | Tinta nocturna | #0A0B10 |
| Neutral              | Azul grafito   | #1C2236 |
| Contenido neutral    | Blanco humo    | #F5F7FC |

## Paleta en modo claro

| Rol                  | Nombre         | Valor   |
| -------------------- | -------------- | ------- |
| Fondo principal      | Papel cálido   | #F7F6F3 |
| Fondo de tarjetas    | Blanco nieve   | #FFFFFF |
| Superficies elevadas | Arena clara    | #EFEDE8 |
| Bordes               | Arena borde    | #E2E0D9 |
| Texto principal      | Tinta noche    | #0B0D14 |
| Texto secundario     | Grafito medio  | #4A5162 |
| Primario             | Magenta oscuro | #C61A67 |
| Contenido primario   | Blanco nieve   | #FFFFFF |
| Secundario           | Oliva profundo | #4E7A00 |
| Contenido secundario | Blanco nieve   | #FFFFFF |
| Acento               | Violeta oscuro | #5B45D6 |
| Contenido de acento  | Blanco nieve   | #FFFFFF |
| Neutral              | Pizarra        | #334155 |
| Contenido neutral    | Papel cálido   | #F7F6F3 |

## Colores semánticos

| Estado      | Oscuro  | Contenido oscuro | Claro   | Contenido claro |
| ----------- | ------- | ---------------- | ------- | --------------- |
| Éxito       | #2FD97F | #0A0B10          | #059669 | #FFFFFF         |
| Advertencia | #FFB020 | #0A0B10          | #D97706 | #FFFFFF         |
| Error       | #FF4D4D | #0A0B10          | #DC2626 | #FFFFFF         |
| Info        | #4D9EFF | #0A0B10          | #2563EB | #FFFFFF         |

## Colores por dificultad de truco

Escala de 0 a 5. Se usa en los badges de dificultad.

| Rango          | Nombre        | Oscuro  | Claro   |
| -------------- | ------------- | ------- | ------- |
| 0 (básico)     | Verde menta   | #10B981 | #047451 |
| 1 (fácil)      | Lima          | #84CC16 | #467209 |
| 2 (intermedio) | Ámbar sol     | #F59E0B | #9A5404 |
| 3 (avanzado)   | Naranja flama | #F97316 | #B04209 |
| 4 (experto)    | Rojo coral    | #F05353 | #C32121 |
| 5 (élite)      | Púrpura neón  | #B268F8 | #8C30DF |

Los tonos de la columna Claro se oscurecieron y los de la columna Oscuro se aclararon lo mínimo para cumplir contraste WCAG AA (4.5:1) como texto de badge. El texto del badge es el propio token y el fondo es `color-mix` al 12% de ese token sobre `base-100` o `base-200`. Ver la nota de contraste al final del documento.

## Colores por categoría de truco

Se usan en badges de categoría y en cualquier agrupación por categoría.

| Categoría   | Oscuro  | Claro   |
| ----------- | ------- | ------- |
| Kicks       | #488BF7 | #225CDC |
| Flips       | #F97316 | #B04209 |
| Twists      | #B268F8 | #8C30DF |
| Transitions | #22D3EE | #066F89 |
| Básicos     | #10B981 | #047451 |

## Utilidades de efecto

Estas utilidades viven en `apps/web/src/app/globals.css` y son el contrato de las fases de rediseño. Todo color sale de variables de tema.

- `.tb-display`: tipografía display (Anton), mayúsculas, tracking cerrado y línea compacta.
- `.tb-eyebrow`: etiqueta pequeña en mayúsculas, tracking amplio y color secundario.
- `.tb-surface`: superficie de tarjeta (fondo `base-200`, borde del tema, radio box).
- `.tb-surface-hover`: en hover el borde pasa a `primary` y la superficie se eleva con una sombra sutil.
- `.tb-glow`: sombra con resplandor del color primario.
- `.tb-gradient-text`: texto con degradado `primary` a `accent` (`background-clip: text`).
- `.tb-mesh`: capa de fondo con degradados radiales (malla) usando los colores del tema.
- `.tb-grain`: overlay de grano con SVG `feTurbulence` embebido como data URI y opacidad baja.
- `.tb-reveal` y `.tb-reveal.is-visible`: estado inicial (opacidad 0 y desplazamiento) y estado final; el componente `Reveal` agrega `is-visible` con `IntersectionObserver`.
- `.tb-marquee`: pista de marquesina con el keyframe `tb-marquee` (translateX -50%).
- `.tb-float`, `.tb-fade-up` y `.tb-pulse-glow`: animaciones de flotado, aparición y pulso con resplandor.

Accesibilidad: toda animación y transición se desactiva bajo `@media (prefers-reduced-motion: reduce)`. El componente `Reveal` además muestra su contenido de inmediato cuando el usuario prefiere menos movimiento o no hay `IntersectionObserver`.

## Colores para la sección de Tips

Los tipos de truco de la sección de Tips reutilizan los colores de categoría de truco.

| Tipo de truco | Color reutilizado   |
| ------------- | ------------------- |
| Patadas       | Azul de Kicks       |
| Giros         | Púrpura de Twists   |
| Side flip     | Naranja de Flips    |
| Mortales      | Naranja de Flips    |
| Horizontales  | Cian de Transitions |
| Aerial        | Cian de Transitions |

Colores propios de los bloques destacados de Tips:

- Idea clave: cian eléctrico con fondo suave.
- Regla de oro: ámbar advertencia con ícono de alerta.
- Resumen corto: neutro con borde de acento.

## Contraste WCAG AA

Los colores de dificultad y de categoría se usan como texto de badge. El texto es el propio token y el fondo es el fondo efectivo de `.tb-badge` (`color-mix(in srgb, currentColor 12%, transparent)`), que se apoya en `base-100` (#F7F6F3 claro, #07080D oscuro) o `base-200` (#FFFFFF claro, #0F1220 oscuro). Se midió con la fórmula de luminancia relativa de WCAG 2.1 y se toma el peor caso entre las dos bases.

Ratios medidos con las bases nuevas (peor caso):

| Token           | Claro | Oscuro |
| --------------- | ----- | ------ |
| difficulty-0    | 4.531 | 6.205  |
| difficulty-1    | 4.506 | 7.704  |
| difficulty-2    | 4.521 | 7.204  |
| difficulty-3    | 4.502 | 5.742  |
| difficulty-4    | 4.502 | 4.768  |
| difficulty-5    | 4.508 | 4.791  |
| cat-kicks       | 4.513 | 4.830  |
| cat-flips       | 4.502 | 5.742  |
| cat-twists      | 4.508 | 4.791  |
| cat-transitions | 4.509 | 8.287  |
| cat-basics      | 4.531 | 6.205  |

Todos los tokens alcanzan al menos 4.5:1. En claro el peor caso es sobre `base-100`; en oscuro, sobre `base-200`. El borde del badge (`color-mix` al 45%) es refuerzo decorativo: la información la lleva el texto, que ya cumple AA.

Otros textos medidos con las bases nuevas: `base-content` 17.96 en claro y 17.37 en oscuro; la variable `--color-muted` 6.14 en claro y 5.12 en oscuro; el secundario 4.73 en claro y 15.76 en oscuro; el primario 5.19 en claro y 5.32 en oscuro; el acento 5.95 en claro y 4.83 en oscuro. Todos cumplen AA como texto normal.

## Créditos de imágenes

Las imágenes libres del rediseño viven en `apps/web/public/img/` y provienen de Pexels (licencia Pexels, uso libre). El detalle por archivo, autor y ficha está en `apps/web/public/img/CREDITS.md`.

## Nota de ajuste

Todas las paletas y los colores de esta sección pueden ajustarse si el usuario lo pide. Mientras no se pida un cambio, se consideran cerrados y son la referencia para los componentes de interfaz.
