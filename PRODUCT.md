# Product

## Register

product

## Users

Serious English learners in Thailand. They use this as a daily vocabulary-building reference tool — browsing the current day's word, reviewing past words, and checking Thai translations for comprehension. Primary context: mobile or desktop, quick daily check-in, often at morning or during study sessions.

## Product Purpose

A public word-of-the-day browser that delivers accurate, high-quality lexical data from Oxford Learner's Dictionaries and Thesaurus.com, enriched with Thai translations via Google Translate. New words are fetched automatically daily via cron. No accounts, no friction — just open the page and learn.

Success means: correct data (real Oxford content, categorized Thesaurus synonyms/antonyms, accurate IPA, proper Thai translations), clean presentation that lets the content speak, and zero user friction.

## Brand Personality

**Clean, minimal, academic.** Like a well-designed dictionary or reference tool — neutral, trustworthy, content-first. The design should fade into the background so the word data commands attention. Think Oxford dictionaries, Merriam-Webster, Cambridge Dictionary apps.

Three words: **Academic. Precise. Unobtrusive.**

## Anti-references

No specific anti-references. Standard design pitfalls to avoid: gamification, excessive animation, marketing fluff, dark patterns.

## Design Principles

1. **Content is the hero.** Every pixel of chrome should justify itself against the word data it serves. If a design element competes with the definition, it's wrong.
2. **Accuracy over ornament.** The UI exists to surface precise lexical information. Prioritize readability, hierarchy, and scanability over decoration.
3. **Zero friction.** No accounts, no onboarding, no popups. The user lands and immediately sees today's word.
4. **Thai-first accessibility.** Thai script must render cleanly (proper fonts, adequate sizing for complex glyphs). Color contrast must accommodate readers of both Latin and Thai scripts.
5. **Responsible defaults.** Fast, accessible, works on any device. Dark mode preferred for late-night study sessions, light mode for daytime reading.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum
- Thai script rendering: ensure proper font support for complex glyphs (tone marks, vowel positioning)
- Color contrast: body text ≥4.5:1 against backgrounds in both light and dark modes
- Responsive: works on mobile (primary device for Thai users), tablet, and desktop
- Reduced motion: respect `prefers-reduced-motion`
