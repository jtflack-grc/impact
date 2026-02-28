# IMPACT! — A FAIR and FMVA Financial Simulator

An interactive educational tool that demonstrates how FAIR (Factor Analysis of Information Risk) and FMVA (Financial Modeling & Valuation Analyst) concepts work together to quantify IT security risk in financial terms through scenario-based simulation.

## Overview

IMPACT! is designed as a showpiece for both sides of the risk coin—FAIR and FMVA—with scenario-based play as the glue between them. This educational tool helps users learn how FAIR and FMVA concepts work together so you can understand IT security risk in financial terms.

**Features:**
- 15 interactive security scenarios with real-world IT security incidents
- FAIR risk analysis (loss event frequency, loss magnitude, Monte Carlo simulations)
- FMVA financial modeling (3-statement models, DCF valuations, capital budgeting)
- Interactive decision-making that affects risk exposure and financial outcomes
- Geographic context with 3D globe visualization
- In-app FMVA spreadsheet for hands-on financial modeling

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

- Push to `main` or `master`; the workflow builds and deploys to GitHub Pages.
- In repo **Settings → Pages**, set **Source** to **GitHub Actions**.

## Technologies

- **React** — UI framework
- **TypeScript** — Type-safe JavaScript
- **Vite** — Build tool and dev server
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **react-globe.gl** — 3D globe visualization
- **Recharts** — Charts and data visualization
- **Handsontable** — Spreadsheet component (non-commercial/evaluation license)
- **Three.js** — 3D graphics rendering

## Dependencies

This app uses Handsontable under a non-commercial and evaluation license. See [Handsontable License](https://handsontable.com/docs/license-key/) for details.

## Release Checklist

Before releasing or sharing the app:

- [ ] Run `npm run build` to ensure the build succeeds without errors
- [ ] Run `npm run preview` and test the built version locally
- [ ] Smoke test:
  - [ ] Open app, dismiss welcome popup
  - [ ] Complete at least one scenario (make choices, see results)
  - [ ] Open Credits popup and verify content displays correctly
  - [ ] Open FMVA Model tab and verify spreadsheet loads and is interactive
  - [ ] Test "Play again" from end screen to ensure state resets properly
- [ ] Verify responsive behavior on mobile/tablet (layout stacks, touch targets work)
- [ ] Check accessibility (keyboard navigation, screen reader compatibility)
- [ ] Ensure no console errors or warnings in browser dev tools

## Educational Purpose

This simulator is designed for educational purposes to demonstrate FAIR and FMVA concepts. All companies, scenarios, financial data, and incident descriptions are fictional and for illustration only.

**This application is not affiliated with the FAIR Institute or the Corporate Finance Institute (CFI).**

Risk and valuation outputs are simulated and must not be used for real-world decisions.

## License

Private / educational use as configured.
