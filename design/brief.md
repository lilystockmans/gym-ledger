# Gym Ledger design brief

Reference: `design/reference/palette.jpg` (orange replaced by green #73795D).

## Colour tokens (in `theme.ts`)

| Token | Hex | Use |
|---|---|---|
| bg | #F5F5F5 | Main background |
| surface | #D8D6C9 | Cards, planner cells, 1 px rules, gradient end |
| ink | #303236 | All small text and numbers (12.2:1 on bg) |
| muted | #52555A | Secondary small text (7.0:1) |
| accent | #73795D | Big headings, buttons, ticks, chart lines. Never small text, never on charcoal (4.2:1 on bg) |
| accentText | #5C6149 | Small green text on light (5.9:1) |
| accentOnDark | #9CA37F | Green on charcoal (4.9:1) |
| dark | #303236 | Rest timer and finish screen background |

## Type

Inter Tight (OFL). Display 64 px (up to 80 on short words), weight 500, letter spacing -3%, one per screen. Logged numbers 40 px tabular. Body and labels 12 to 13 px, labels uppercase with +6% letter spacing.

## Layout

24 px side margin, much empty space, left-aligned, 1 px rules in `surface` instead of boxes and shadows. No icons where a word fits.

## Gym safety

Tap targets at least 56 px high. Set tick and +/- buttons in the bottom half of the screen. Numbers always big. Rest timer fills the screen in `dark`.

## Gradient

One soft radial blob per screen at most (`components/Blob.tsx`): behind the Home heading and on the finish screen.
