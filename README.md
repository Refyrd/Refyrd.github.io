# Refyrd Games // Browser Mini-Games Platform

A clean, responsive web hub for lightweight browser mini-games, hosted on GitHub Pages.

[Русская версия (Russian version)](README.ru.md)

## Architecture
- **Main Hub (`/`):** Clean, spacious game catalog showcasing available and upcoming games with consistent alignment and typography.
- **Dedicated Game Pages (`/game-name/`):** Each game resides in its own isolated subfolder, providing dedicated play space, full controls, and navigation back to the hub.

## Design & Accessibility
- Built on a strict 8px modular spacing scale.
- Clear, modern system typography with zero distorted fonts and balanced whitespace.
- Tactile interactions: buttons with real press feedback (`active: translateY(1px)`), custom focus rings (`2px solid #FF9F1C`), and WCAG AA contrast compliance.
- No page scrolling during touch or mouse drag gestures (`touch-action: none`).

## Available Games
1. **Snake (`/snake/`):** Classic grid snake with progressive speed scaling, subtle food breathing, tactile score bumps, touch/mouse swipe controls, complete board victory state, and local high score tracking.
2. **Arkanoid (`/arkanoid/`):**
   - Dense 20x16 small squares grid with 15 archetypes featuring funnels, tunnels, and cavities for ricochet swarms.
   - 60 unique levels with varied brick tiers (1-hit, 2-hit, 3-hit armored).
   - Infinite Random Mode with procedural symmetric layouts.
   - Slower, balanced ball speed (3.6 px/frame) for comfortable control.
   - Falling power-ups (+3 balls, x3 ball multiplier cascade, paddle expander, rare bottom floor barrier).
   - High performance spatial grid collision and sound throttling for ball swarms.
   - Dedicated level selection screen with local device progress tracking (`localStorage`).
   - Draggable debug window with cheats and testing tools.
3. **Slot 03:** Reserved for upcoming game.

## Project Structure
```text
Refyrd.github.io/
├── index.html            # Main game catalog & hub
├── css/
│   └── main.css          # Core design system, shared grid, and typography
├── snake/
│   ├── index.html        # Dedicated Snake game page
│   ├── snake.css         # Board layout and animations
│   └── snake.js          # Snake game logic, audio synth, and swipe input
├── arkanoid/
│   ├── index.html        # Arkanoid level select & game view
│   ├── arkanoid.css      # Board styles, level select grid, powerup chips
│   └── arkanoid.js       # 60 levels generator, random mode, power-ups physics
├── TODO.md               # Task list and roadmap
├── README.md             # Primary documentation (English)
└── README.ru.md          # Russian documentation
```

## Local Development
Run locally with any static web server:

```bash
# Using Python standard library
python -m http.server 8000
```

## License
MIT License
