# Decisiones visuales

Decisiones de diseño del sitio: sistema de temas, paletas, colores semánticos, colores por dificultad, colores por categoría y colores de la sección de Tips. Consultar este documento siempre antes de tocar interfaz.

## Sistema de temas

Dos temas:

- `tricking-light`: tema por defecto.
- `tricking-dark`: tema oscuro, marcado como `prefersdark`.

## Resolución del tema

El tema se resuelve en este orden:

1. Preferencia manual guardada en localStorage con la clave `tricking:theme`.
2. Preferencia del sistema vía `prefers-color-scheme`.
3. Default del proyecto (modo claro).

## Reglas del tema

- El tema se aplica con `data-theme` en `<html>`, nunca con clases condicionales.
- Prohibido escribir colores sueltos con hex en los componentes. Todo sale de las variables del tema.
- El script inline anti-flash vive en el `<head>` del layout raíz y es uno de los dos `dangerouslySetInnerHTML` permitidos sin autorización adicional (el otro es el JSON-LD de datos estructurados, con el carácter `<` escapado).
- El tema persistido usa la clave `tricking:theme` con TTL de 1 año.
- El cambio es instantáneo, sin recargar.
- El botón de toggle tiene `aria-label` descriptivo y `aria-pressed`, y es operable por teclado.

## Paleta en modo claro

| Rol                  | Nombre          | Valor   |
| -------------------- | --------------- | ------- |
| Fondo principal      | Blanco perla    | #FAFAFA |
| Fondo de tarjetas    | Blanco nieve    | #FFFFFF |
| Superficies elevadas | Gris bruma      | #F1F5F9 |
| Bordes               | Gris cemento    | #E2E8F0 |
| Texto principal      | Azul noche      | #0B0F1A |
| Texto secundario     | Grafito azulado | #334155 |
| Primario             | Naranja oscuro  | #E85A0D |
| Secundario           | Cian profundo   | #0891B2 |

## Paleta en modo oscuro

| Rol                  | Nombre          | Valor   |
| -------------------- | --------------- | ------- |
| Fondo principal      | Azul noche      | #0B0F1A |
| Fondo de tarjetas    | Azul carbón     | #131826 |
| Superficies elevadas | Grafito azulado | #1C2333 |
| Bordes               | Acero           | #2A3344 |
| Texto principal      | Blanco humo     | #F1F5F9 |
| Texto secundario     | Gris piedra     | #94A3B8 |
| Primario             | Naranja flama   | #FF6B1A |
| Secundario           | Cian eléctrico  | #22D3EE |

## Colores semánticos

| Estado      | Oscuro  | Claro   |
| ----------- | ------- | ------- |
| Éxito       | #10B981 | #059669 |
| Advertencia | #F59E0B | #D97706 |
| Error       | #EF4444 | #DC2626 |
| Info        | #3B82F6 | #2563EB |

## Colores por dificultad de truco

Escala de 0 a 5. Se usa en los badges de dificultad.

| Rango          | Nombre          | Oscuro  | Claro   |
| -------------- | --------------- | ------- | ------- |
| 0 (básico)     | Verde menta     | #10B981 | #047753 |
| 1 (fácil)      | Lima            | #84CC16 | #487409 |
| 2 (intermedio) | Ámbar sol       | #F59E0B | #9D5604 |
| 3 (avanzado)   | Naranja flama   | #F97316 | #B34309 |
| 4 (experto)    | Rojo coral      | #F05353 | #C62222 |
| 5 (élite)      | Púrpura místico | #B268F8 | #8F31E3 |

Los tonos de la columna Claro se oscurecieron y los de la columna Oscuro se aclararon lo mínimo para cumplir contraste WCAG AA (4.5:1) como texto de badge. El texto del badge es el propio token y el fondo es `color-mix` al 12% de ese token sobre `base-100` o `base-200`. Ver la nota de contraste al final del documento.

## Colores por categoría de truco

Se usan en badges de categoría y en cualquier agrupación por categoría.

| Categoría   | Oscuro  | Claro   |
| ----------- | ------- | ------- |
| Kicks       | #488BF7 | #235EE0 |
| Flips       | #F97316 | #B34309 |
| Twists      | #B268F8 | #8F31E3 |
| Transitions | #22D3EE | #06718B |
| Básicos     | #10B981 | #047753 |

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

Los colores de dificultad y de categoría se usan como texto de badge. El texto es el propio token y el fondo es el fondo efectivo de `.tb-badge` (`color-mix(in srgb, currentColor 12%, transparent)`), que se apoya en `base-100` (#FAFAFA claro, #0B0F1A oscuro) o `base-200` (#FFFFFF claro, #131826 oscuro). Se midió con la fórmula de luminancia relativa de WCAG 2.1.

Ratios medidos después del ajuste (peor caso entre `base-100` y `base-200`):

| Token           | Claro antes | Claro después | Oscuro antes | Oscuro después |
| --------------- | ----------- | ------------- | ------------ | -------------- |
| difficulty-0    | 3.13        | 4.51          | 5.82         | 5.82           |
| difficulty-1    | 2.63        | 4.53          | 7.21         | 7.21           |
| difficulty-2    | 2.69        | 4.53          | 6.77         | 6.77           |
| difficulty-3    | 2.95        | 4.54          | 5.41         | 5.41           |
| difficulty-4    | 3.85        | 4.54          | 4.21         | 4.51           |
| difficulty-5    | 4.32        | 4.53          | 3.93         | 4.52           |
| cat-kicks       | 4.20        | 4.53          | 4.16         | 4.54           |
| cat-flips       | 2.95        | 4.54          | 5.41         | 5.41           |
| cat-twists      | 4.32        | 4.53          | 3.93         | 4.52           |
| cat-transitions | 3.07        | 4.54          | 7.75         | 7.75           |
| cat-basics      | 3.13        | 4.51          | 5.82         | 5.82           |

Todos los tokens alcanzan al menos 4.5:1. El borde del badge (`color-mix` al 45%) es refuerzo decorativo: la información la lleva el texto, que ya cumple AA. Los textos `text-base-content/60`, `/70` y `/80` y la variable `--color-muted` también se midieron y cumplen AA en ambos temas, por lo que no se ajustaron.

## Nota de ajuste

Todas las paletas y los colores de esta sección pueden ajustarse si el usuario lo pide. Mientras no se pida un cambio, se consideran cerrados y son la referencia para los componentes de interfaz.
