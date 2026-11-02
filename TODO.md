# Project Roadmap & TODO

## Environment & Setup
- [x] Configure `.gitignore` with `.AI/`, Windows 11 system files, and VS Code configs
- [x] Initialize Git repository structure on branch `main`
- [x] Create bilingual documentation (`README.md` and `README.ru.md`)
- [x] Select visual direction: Hardware Pocket Console (`.AI/DESIGN.md`)

## Core Platform & Architecture
- [x] Redesign main hub (`index.html`) as dedicated game catalog with spacious, aligned layout
- [x] Multi-page game architecture: games hosted on dedicated sub-paths
- [x] Unified 8px modular spacing system and readable typography stack
- [x] Full keyboard navigation and visible focus outlines (WCAG AA)

## Games
- [x] Snake (`/snake/`): Dedicated page, subtle micro-animations, pure touch swipe/drag, 10-click draggable debug menu
- [x] Arkanoid (`/arkanoid/`):
  - [x] 60-level campaign with 15 distinct archetypes (funnels, tunnels, cavities) on a dense 20x16 square grid
  - [x] Infinite Random mode with procedural mirrored brick generation
  - [x] Balanced comfortable ball speed (3.6 px/frame)
  - [x] Falling power-up drops: +3 balls, x3 ball multiplier (swarm ricochets), widen paddle, rare floor barrier
  - [x] Spatial grid collision check for high-performance multi-ball swarms (60 FPS)
  - [x] Dedicated Level Select screen with progress saved in `localStorage`
  - [x] 10-click draggable debug menu with level unlock and power-up spawn options
- [ ] Game 3: TBD (slot 03)

## Polish & Verification
- [x] Mobile paddings and touch layout verification
- [x] Verification of page paths, links, and responsive layouts
- [x] Audio synthesizer on Web Audio API (toggleable, default off)
- [ ] Next game implementation
