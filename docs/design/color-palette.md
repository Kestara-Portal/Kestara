# Kestara — Color Palette

> **Status:** Draft with one confirmed direction  
> **Confirmed direction:** Green Teal  
> **Confirmed primary color:** `#176B62`

## 1. Confirmed Brand Direction

Kestara uses a Green Teal visual direction. The primary color supplied by the previous design documentation is:

| Token | Value | Status |
|---|---|---|
| `--color-primary` | `#176B62` | Confirmed direction / value used in project drafts |

## 2. Proposed Supporting Tokens

The following values are design proposals, not yet approved brand colors. Validate contrast and review with the UI/UX owner before implementation.

| Token | Proposed value | Intended use |
|---|---|---|
| `--color-primary-hover` | `#145A53` | Hover/pressed state |
| `--color-primary-dark` | `#0F4C46` | Dark emphasis |
| `--color-primary-soft` | `#E8F3F1` | Soft backgrounds |
| `--color-teal-accent` | `#36A69A` | Secondary accent, use sparingly |
| `--color-text` | `#172B28` | Main text |
| `--color-muted` | `#647571` | Secondary text |
| `--color-border` | `#DCE6E3` | Borders/dividers |
| `--color-surface` | `#FFFFFF` | Cards and surfaces |
| `--color-background` | `#F7FAF9` | Page background |
| `--color-danger` | `#B42318` | Destructive/error state |
| `--color-warning` | `#B54708` | Warning state |
| `--color-success` | `#16794A` | Success state |

## 3. Usage Rules

- Use primary teal for main actions, active navigation, and selected states.
- Do not use teal for every element; preserve hierarchy and whitespace.
- Use semantic status colors consistently and pair them with text/icons.
- Do not communicate status through color alone.
- Keep body text contrast readable.
- Avoid gradients unless approved in the final design system.

## 4. Accessibility Gate

Before declaring the palette final:
- Check text/background contrast against WCAG 2.2 AA targets.
- Check focus indicators and disabled states.
- Test the palette in light and dark contexts if dark mode is required.
- Check color-blind distinguishability for status indicators.

Only `#176B62` and the Green Teal direction are recorded as established project choices. Supporting tokens remain proposed.
