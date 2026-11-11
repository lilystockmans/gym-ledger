# Gym Ledger design brief

Reference: `design/reference/palette.jpg` (orange replaced by green #73795D).

## Colour tokens (in `theme.ts`), revised 2026-11-11 after Lily's feedback

No white anywhere. Beige is the background. Off-black for text and buttons.

| Token | Hex | Use |
|---|---|---|
| bg | #D8D6C9 | Beige. Main background |
| surface | #C3C1B1 | Darker beige: 1 px rules, cards |
| ink | #303236 | Off-black: text, numbers, primary buttons |
| muted | #52555A | Secondary text |
| accent | #73795D | Giant titles, ticks, chart lines. Not for small text |
| accentText | #4F543E | Small green text |
| pool | #868C6C | Gradient pool colour. Lighter than accent so ink stays readable on it |
| glow | #E6E4D8 | Light highlight in the gradient, top right |
| onAccent / onDark | #E4E2D6 | Light beige text on dark buttons and the dark screens |
| dark | #303236 | Rest timer and finish screen background |
| accentOnDark | #9CA37F | Green on charcoal |

## Type

Inter Tight (OFL). Display (screen title): 100 px, weight 500, letter spacing -3%, one per screen, wraps naturally (Lily chose 100 px on 2026-11-11; 148 px was the largest that fits a word per line). Exercise names: 18 px bold (700). Logged numbers 40 px tabular. Labels 12 px uppercase, +6% letter spacing.

## Background

`components/Background.tsx`, mounted once in `app/(tabs)/_layout.tsx`. It is fixed: it does not move when a screen scrolls or the tab changes. Beige base, a fluid organic green pool in the lower left that melts diagonally to the upper right, a light glow top right (like `design/reference/palette.jpg`). Screens on top must keep a transparent background (no `backgroundColor` on tab screens). The tab bar is a translucent beige.

## Layout

24 px side margin, much empty space, left-aligned, 1 px rules in `surface` instead of boxes and shadows. No icons where a word fits. Primary buttons are off-black with light beige text.

## Gym safety

Tap targets at least 56 px high. Set tick and +/- buttons in the bottom half of the screen. Numbers always big. Rest timer fills the screen in `dark`.
