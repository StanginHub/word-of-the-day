---
name: Word of the Day
description: A public word-of-the-day browser delivering Oxford dictionary data with Thai translations.
colors:
  primary: "#1a1a1a"
  accent:
    base: "#1d4ed8"
    soft: "#dbeafe"
    strong: "#1e3a8a"
  bg:
    page: "#ffffff"
    surface: "#f8fafc"
    elevated: "#ffffff"
  ink:
    primary: "#0f172a"
    secondary: "#475569"
    tertiary: "#64748b"
    disabled: "#cbd5e1"
  border:
    subtle: "#e2e8f0"
    default: "#cbd5e1"
    strong: "#94a3b8"
  status:
    green: "#059669"
    green-soft: "#d1fae5"
    red: "#dc2626"
    red-soft: "#fee2e2"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.02em"
    textTransform: "uppercase"
  thai:
    fontFamily: "Noto Sans Thai, IBM Plex Sans Thai, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    lineHeight: 1.8
rounded:
  none: "0px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
components:
  badge-accent:
    backgroundColor: "{colors.accent.soft}"
    textColor: "{colors.accent.strong}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-neutral:
    backgroundColor: "{colors.bg.surface}"
    textColor: "{colors.ink.secondary}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg.page}"
    rounded: "{rounded.lg}"
    typography: "{typography.label}"
    padding: "8px 20px"
  separator:
    height: "1px"
    width: "100%"
---

# Design System: Word of the Day

## 1. Overview

**Creative North Star: "The Modern Reference"**

A single-minded commitment to editorial clarity. Like a well-designed dictionary app — confident black ink on crisp white, typographic hierarchy that guides the eye without decoration, and exactly one accent color used sparingly to mark the most important relationships. This is reference design: the content is the hero, and every pixel of chrome earns its place by making the content easier to read, scan, and understand.

The system rejects softness, decoration, and trend-chasing. No glassmorphism, no gradient text, no oversized rounded cards. The warmth comes from generous whitespace and rhythm, not from tinted backgrounds.

**Key Characteristics:**
- Pure monochrome foundation — black, white, and disciplined gray
- Single accent (blue) used at ≤10% saturation across any given screen
- Generous whitespace and clear typographic hierarchy
- Content-first: the word data commands all attention
- Flat surfaces at rest; shadows only for interactive elements on hover

## 2. Colors

A controlled, near-monochrome palette anchored by deep warm-black ink and crisp white backgrounds. One accent — a confident blue — injects precision and authority at the moments that matter most: interactive elements, selected states, and key relationships.

### Primary
- **Ink Black** (#1a1a1a): Primary text and solid surfaces. The visual anchor. Used for primary buttons, headings, and the header bar.
- **White** (#ffffff): Page background. Clean, bright, reading-optimized.

### Accent
- **Reference Blue** (#1d4ed8): The sole accent. Used for links, active states, selected date chips, and the focus ring. Appears on ≤10% of any screen. Its rarity is the point.
- **Soft Blue** (#dbeafe): Accent background for badges and subtle highlights.
- **Deep Blue** (#1e3a8a): Accent text on light backgrounds.

### Neutral
- **Surface** (#f8fafc): Card and container backgrounds. Subtle differentiation from the page without introducing color.
- **Ink Secondary** (#475569): Supporting text, labels, metadata.
- **Ink Tertiary** (#64748b): Muted captions, placeholder text, timestamp.
- **Border Subtle** (#e2e8f0): Dividers, card borders, separator lines.
- **Border Default** (#cbd5e1): Interactive element borders in resting state.

### Named Rules
**The 90/10 Rule.** The accent color covers at most 10% of any screen. Its restraint creates the impact; a screen with 30% blue is a screen without hierarchy.
**The No-Warm-Tint Rule.** Body backgrounds are white (chroma 0) or very lightly tinted toward blue (chroma ≤0.005). No cream, sand, or warm paper tones. This is a modern reference, not a vintage library.

## 3. Typography

**Display Font:** Geist (Vercel, 2024) — a Swiss-style grotesque with tight apertures and precise geometry
**Body Font:** Geist — same family, lighter weight; the continuity creates cohesion without competing typefaces
**Label/Mono Font:** Geist Mono — for IPA, dates, and metadata; legible at small sizes with distinct letterforms

Geist is the sole typeface. One family, multiple weights — not a pairing. The restraint keeps the focus on content.

### Hierarchy
- **Display** (700, clamp(2.5rem, 5vw, 3.75rem), 1.1): The word itself. Hero position, maximum weight, tight line-height. Appears once per page.
- **Heading** (600, clamp(1.25rem, 3vw, 1.5rem), 1.3): Section labels, modal titles, tab headers.
- **Body** (400, 1rem, 1.7): Definitions, descriptions, prose. Max line length 65ch.
- **Label** (500, 0.8125rem, 0.02em tracking, uppercase): STRONGEST/STRONG/WEAK labels, CEFR badges, navigation items.
- **Thai** (400, 0.9375rem, 1.8): Thai script rendered in Noto Sans Thai with generous line-height for complex tone marks.

### Named Rules
**The One Family Rule.** One typeface, multiple weights. No pairing. Geist alone provides enough tonal range (Light 300 to Bold 700) to establish clear hierarchy without introducing a second font.

## 4. Elevation

Flat by default. Depth is conveyed through tonal contrast (white → surface gray → dark ink), not shadows. The only shadows in the system are applied to the modal overlay and interactive elements on hover — and even those are ambient diffusions, not hard drop shadows.

### Shadow Vocabulary
- **Modal Overlay** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`): The dialog backdrop. Heavy, atmospheric, signals the highest z-index layer.
- **Interactive Hover** (`box-shadow: 0 4px 12px rgba(0,0,0,0.08)`): Subtle lift on buttons and cards during hover states.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state — hover, focus, or modal elevation. The resting page casts no shadows.

## 5. Components

### Buttons
- **Shape:** Rounded at 12px (`--radius-lg`), balancing softness with precision.
- **Primary:** `bg-primary text-page hover:bg-primary/80`. Full-bleed black, confident. For "View Details" and primary actions.
- **Outline:** `border-border bg-transparent hover:bg-surface`. For secondary actions like "Show All Synonyms".
- **Ghost:** `hover:bg-surface`. For toolbar items and icon-only actions.
- **Focus:** Blue ring at 3px width, offset 2px from the element edge.

### Chips / Badges
- **Accent Badge:** Blue-soft background, deep-blue text, fully rounded (pill). Used for Thai translations, selected date indicators.
- **Neutral Badge:** Surface background, secondary ink text, fully rounded. Used for synonym/antonym words.
- **Category Badge:** Color-coded borders. STRONGEST = emerald, STRONG = blue, WEAK = gray. See word-modal for the full pattern.

### Tabs
- **Shape:** Underlined in active state, muted in inactive. The active tab gets a 2px accent border on the bottom edge.
- **Typography:** Label weight (500), 0.8125rem, uppercase tracking. Active = primary ink, inactive = tertiary ink.

### Separator
- **Style:** 1px horizontal line, border-subtle color. Divides definition from translations, translations from synonyms.

### Date Selector
- **Shape:** Horizontal scrollable pill-strip. Each date rendered as a small chip with the formatted date and word name.
- **Active state:** Blue accent background with white text. Inactive: outline-only.
- **Scroll:** Smooth horizontal overflow, touch-friendly on mobile.

## 6. Do's and Don'ts

### Do:
- **Do** use generous whitespace between sections (24px minimum between content blocks).
- **Do** keep the accent blue to ≤10% of any screen.
- **Do** render Thai text in Noto Sans Thai with 1.8 line-height for legible tone marks.
- **Do** use the Geist family exclusively — one typeface, multiple weights.
- **Do** apply shadows only to modal overlay and interactive hover states.

### Don't:
- **Don't** tint the page background warm (no cream, sand, or paper tones).
- **Don't** add decoration: no gradient text, no glassmorphism, no oversized rounded cards.
- **Don't** use border-left stripes as colored accents on cards or list items.
- **Don't** apply all-caps to body text or sentences; uppercase is reserved for labels and badges.
- **Don't** introduce a second typeface. Geist alone covers the whole hierarchy.
- **Don't** shadow resting surfaces. Flat is the default.
