# Project Roadmap & TODO

## Environment & Setup
- [x] Configure `.gitignore` with `.AI/`, Windows 11 system files, and VS Code configs
- [x] Initialize Git repository structure on branch `main`
- [x] Create bilingual documentation (`README.md` and `README.ru.md`)
- [x] Select visual direction: Hardware Pocket Console (`.AI/DESIGN.md`)

## Core Platform & Architecture
- [x] Redesign main hub (`index.html`) as dedicated game catalog with spacious, aligned layout
- [x] Multi-page game architecture: games hosted on dedicated sub-paths (e.g. `refyrd.github.io/snake/`)
- [x] Unified 8px modular spacing system and readable typography stack
- [x] Full keyboard navigation and visible focus outlines (WCAG AA)

## Games
- [x] Snake (`/snake/`): Dedicated page, subtle micro-animations (breathing food, score bump, gentle shake)
- [x] Pure swipe/drag controls for touch and mouse with zero page scrolling (`touch-action: none`)
- [x] Removed obsolete on-screen mobile D-pad buttons
- [x] 10-click pause debug menu (+length, audio tests, win/loss triggers) with high score protection
- [x] Victory screen and complete board clear detection
- [ ] Game 2: TBD (slot 02)
- [ ] Game 3: TBD (slot 03)

## Polish & Verification
- [x] Mobile paddings and touch layout verification
- [x] Verification of page paths, links, and responsive layouts
- [x] Audio synthesizer on Web Audio API (toggleable, default off)
- [ ] Next game implementation
