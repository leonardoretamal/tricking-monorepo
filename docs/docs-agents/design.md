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
- El script inline anti-flash vive en el `<head>` del layout raíz y es el único `dangerouslySetInnerHTML` permitido sin autorización expresa.
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
| 0 (básico)     | Verde menta     | #10B981 | #059669 |
| 1 (fácil)      | Lima            | #84CC16 | #65A30D |
| 2 (intermedio) | Ámbar sol       | #F59E0B | #D97706 |
| 3 (avanzado)   | Naranja flama   | #F97316 | #EA580C |
| 4 (experto)    | Rojo coral      | #EF4444 | #DC2626 |
| 5 (élite)      | Púrpura místico | #A855F7 | #9333EA |

## Colores por categoría de truco

Se usan en badges de categoría y en cualquier agrupación por categoría.

| Categoría   | Oscuro  | Claro   |
| ----------- | ------- | ------- |
| Kicks       | #3B82F6 | #2563EB |
| Flips       | #F97316 | #EA580C |
| Twists      | #A855F7 | #9333EA |
| Transitions | #22D3EE | #0891B2 |
| Básicos     | #10B981 | #059669 |

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

## Nota de ajuste

Todas las paletas y los colores de esta sección pueden ajustarse si el usuario lo pide. Mientras no se pida un cambio, se consideran cerrados y son la referencia para los componentes de interfaz.
