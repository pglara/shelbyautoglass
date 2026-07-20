# Shelby Auto Glass assets

This project uses deploy-safe, text-based SVG assets so every committed website asset can be inspected and processed as source text. The SVGs preserve the existing brand, service, and vehicle imagery roles while avoiding binary-file deployment errors.

## Folders

- `logo/` — Shelby Auto Glass logo files for the header, footer, and help bot.
- `hero/` — reserved for future hero imagery.
- `services/` — service card and service detail imagery for windshield repair, windshield replacement, side/rear glass, ADAS calibration, insurance, and mobile service.
- `mobile/` — van or mobile-service image for the split mobile service section.
- `reviews/` — optional customer/review-related imagery if needed later.

## Active homepage assets

These files are currently referenced by `index.html`, service pages, `help-bot.js`, and `styles.css`:

- `logo/shelby-logo-dark.svg` — header, footer, and help bot logo.
- `services/side-rear-glass.svg` — side and rear glass workmanship illustration used for the Side & Rear Glass card and service hero.
- `services/adas-calibration-photo.svg` — ADAS calibration target illustration used for the ADAS Calibration card and service hero.
- `services/work-truck.svg` — branded Shelby Auto Glass service vehicle illustration for home, insurance, ADAS gallery, and mobile contexts.
- `mobile/work-truck.svg` — branded mobile service van illustration used for the mobile service card and homepage hero background.
